import mongoose from "mongoose";
import { createHash, randomUUID } from "node:crypto";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import FarmerProfile from "../models/FarmerProfile.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { calculateLine, roundMoney } from "./pricingService.js";
import { notify } from "./notificationService.js";
import { orderSteps } from "../utils/constants.js";
import { inventoryStatus } from "./inventoryService.js";

export async function checkout(
  customer,
  input,
  key,
  deliveryCharge,
  lowStockThreshold = 5,
) {
  const checkoutFingerprint = createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex");
  return mongoose.connection.transaction(async (session) => {
    const previous = await Order.find({ customer, checkoutKey: key }).session(
      session,
    );
    if (previous.length) {
      if (
        previous.some(
          (order) => order.checkoutFingerprint !== checkoutFingerprint,
        )
      ) {
        throw new ApiError(
          409,
          "This checkout key has already been used with different details.",
        );
      }
      return previous;
    }
    const cart = await Cart.findOne({ customer }).session(session);
    if (!cart?.items.length) throw new ApiError(400, "Your cart is empty.");
    const groups = new Map();
    for (const entry of cart.items) {
      const product = await Product.findById(entry.product).session(session);
      const pricing = calculateLine(product, entry.quantity);
      if (
        !(await User.exists({
          _id: product.farmer,
          status: "active",
          role: "farmer",
        }).session(session))
      )
        throw new ApiError(409, "Farmer is currently unavailable.");
      if (!product[`${input.fulfillmentMethod}Available`])
        throw new ApiError(
          400,
          `${product.name} does not support ${input.fulfillmentMethod}.`,
        );
      const farm = await FarmerProfile.findOne({
        user: product.farmer,
      }).session(session);
      if (!farm?.[`${input.fulfillmentMethod}Available`]) {
        throw new ApiError(
          409,
          "The farm no longer supports this fulfillment method.",
        );
      }
      const remaining = product.quantity - entry.quantity;
      const updated = await Product.updateOne(
        {
          _id: product._id,
          quantity: { $gte: entry.quantity },
          isActive: true,
          isDeleted: false,
        },
        {
          $inc: { quantity: -entry.quantity, orderCount: 1 },
          $set: {
            availabilityStatus: inventoryStatus(
              remaining,
              product.isPreOrder,
              lowStockThreshold,
            ),
          },
        },
        { session },
      );
      if (updated.modifiedCount !== 1)
        throw new ApiError(409, "Stock changed. Please review your cart.");
      const farmer = String(product.farmer);
      if (!groups.has(farmer)) groups.set(farmer, []);
      groups.get(farmer).push({
        product: product._id,
        productName: product.name,
        productImage: product.coverImage?.url || product.images[0]?.url || "",
        category: product.category,
        unit: product.unit,
        ...pricing,
        isPreOrder: product.isPreOrder,
        availableDate: product.availableDate,
      });
      if (
        remaining <= lowStockThreshold &&
        product.quantity > lowStockThreshold
      )
        await notify(
          product.farmer,
          "low_stock",
          `${product.name}: ${remaining} ${product.unit} remaining`,
          { relatedProduct: product._id },
          session,
        );
    }
    const created = [],
      groupId = randomUUID();
    for (const [farmer, items] of groups) {
      const subtotal = roundMoney(
        items.reduce((sum, item) => sum + item.lineTotal, 0),
      );
      const fee = input.fulfillmentMethod === "delivery" ? deliveryCharge : 0;
      const profile = await FarmerProfile.findOne({ user: farmer }).session(
        session,
      );
      const [order] = await Order.create(
        [
          {
            orderNumber: `F2H-${randomUUID().slice(0, 8).toUpperCase()}`,
            checkoutGroupId: groupId,
            checkoutKey: key,
            checkoutFingerprint,
            customer,
            farmer,
            items,
            subtotal,
            deliveryCharge: fee,
            total: roundMoney(subtotal + fee),
            ...input,
            pickupDetails:
              input.fulfillmentMethod === "pickup"
                ? `${profile?.farmName || "Farm pickup"} · ${profile?.city || ""}, ${profile?.district || ""}. Coordinate pickup with your farmer.`
                : undefined,
            isPreOrder: items.some((item) => item.isPreOrder),
            statusHistory: [
              { status: "Pending", changedAt: new Date(), changedBy: customer },
            ],
          },
        ],
        { session },
      );
      created.push(order);
      await notify(
        farmer,
        "new_order",
        `New order ${order.orderNumber}`,
        { relatedOrder: order._id },
        session,
      );
    }
    cart.items = [];
    await cart.save({ session });
    return created;
  });
}
export function canTransition(current, next, fulfillment) {
  if (next === "Cancelled") return current === "Pending";
  const steps = orderSteps(fulfillment),
    index = steps.indexOf(current);
  return index >= 0 && index < steps.length - 1 && steps[index + 1] === next;
}
export async function transitionOrder(
  orderId,
  actor,
  next,
  lowStockThreshold = 5,
) {
  return mongoose.connection.transaction(async (session) => {
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new ApiError(404, "Order not found.");
    const owner = actor.role === "farmer" ? order.farmer : order.customer;
    if (String(owner) !== String(actor._id))
      throw new ApiError(403, "You do not own this order.");
    if (actor.role === "customer" && next !== "Cancelled")
      throw new ApiError(403, "Only the farmer can progress an order.");
    if (!canTransition(order.status, next, order.fulfillmentMethod))
      throw new ApiError(409, "This status transition is not allowed.");
    const today = new Date().toISOString().slice(0, 10);
    if (
      [
        "Ready for Pickup",
        "Out for Delivery",
        "Delivered",
        "Completed",
      ].includes(next) &&
      order.items.some(
        (item) =>
          item.isPreOrder &&
          item.availableDate?.toISOString().slice(0, 10) > today,
      )
    ) {
      throw new ApiError(
        409,
        "This pre-order is not available for fulfillment yet.",
      );
    }
    if (next === "Cancelled") {
      for (const item of order.items) {
        const product = await Product.findById(item.product).session(session);
        if (product) {
          product.quantity += item.quantity;
          product.orderCount = Math.max(0, product.orderCount - 1);
          product.availabilityStatus = inventoryStatus(
            product.quantity,
            product.isPreOrder,
            lowStockThreshold,
          );
          await product.save({ session });
        }
      }
    }
    if (next === "Completed") {
      order.paymentStatus = "paid";
      await FarmerProfile.updateOne(
        { user: order.farmer },
        { $inc: { completedOrders: 1 } },
        { session },
      );
    }
    order.status = next;
    order.statusHistory.push({
      status: next,
      changedAt: new Date(),
      changedBy: actor._id,
    });
    await order.save({ session });
    await notify(
      actor.role === "farmer" ? order.customer : order.farmer,
      "order_status",
      `${order.orderNumber}: ${next}`,
      { relatedOrder: order._id },
      session,
    );
    return order;
  });
}
