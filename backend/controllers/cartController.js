import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import ApiError from "../utils/ApiError.js";
import { calculateLine, roundMoney } from "../services/pricingService.js";
import { respond } from "../utils/asyncHandler.js";
export async function cartData(customer) {
  const cart = await Cart.findOne({ customer }).populate("items.product");
  const items = (cart?.items || []).map((item) => {
    const product = item.product;
    let pricing = null;
    try {
      pricing = calculateLine(product, item.quantity);
    } catch {
      /* Keep unavailable items removable. */
    }
    return {
      id: item.id,
      productId: product?.id,
      product: product
        ? {
            id: product.id,
            name: product.name,
            images: product.images,
            farmer: product.farmer,
            quantity: product.quantity,
            unit: product.unit,
            price: product.price,
            bulkPrice: product.bulkPrice,
            minimumBulkQuantity: product.minimumBulkQuantity,
            availabilityStatus: product.availabilityStatus,
            isActive: product.isActive && !product.isDeleted,
            deliveryAvailable: product.deliveryAvailable,
            pickupAvailable: product.pickupAvailable,
            availableDate: product.availableDate,
          }
        : null,
      quantity: item.quantity,
      unavailable: !pricing,
      ...pricing,
    };
  });
  return {
    items,
    subtotal: roundMoney(
      items.reduce((sum, item) => sum + (item.lineTotal || 0), 0),
    ),
  };
}
export async function get(req, res) {
  respond(res, {
    ...(await cartData(req.user._id)),
    deliveryCharge: req.app.locals.config.DELIVERY_CHARGE,
  });
}
export async function write(req, res) {
  await mongoose.connection.transaction(async (session) => {
    const cart = await Cart.findOne({ customer: req.user._id }).session(
      session,
    );
    if (!cart) throw new ApiError(404, "Cart not found.");
    if (req.method === "DELETE") {
      if (req.params.itemId) {
        const item = cart.items.id(req.params.itemId);
        if (!item) throw new ApiError(404, "Cart item not found.");
        item.deleteOne();
      } else cart.items = [];
    } else {
      const input = req.validated.body;
      let item = req.params.itemId
        ? cart.items.id(req.params.itemId)
        : cart.items.find((row) => String(row.product) === input.productId);
      if (req.params.itemId && !item)
        throw new ApiError(404, "Cart item not found.");
      const product = await Product.findById(
        item?.product || input.productId,
      ).session(session);
      const quantity =
        input.quantity + (req.method === "POST" ? item?.quantity || 0 : 0);
      calculateLine(product, quantity);
      if (item) item.quantity = quantity;
      else {
        if (cart.items.length >= 100)
          throw new ApiError(400, "Cart has too many products.");
        cart.items.push({ product: product._id, quantity });
      }
    }
    await cart.save({ session });
  });
  respond(res, await cartData(req.user._id));
}
