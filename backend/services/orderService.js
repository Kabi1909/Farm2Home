import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import FarmerProfile from '../models/FarmerProfile.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { calculateLine, roundMoney } from './pricingService.js';
import { notify } from './notificationService.js';

export async function checkout(customer, input, key, deliveryCharge) {
  return mongoose.connection.transaction(async (session) => {
    const previous = await Order.find({ customer, checkoutKey: key }).session(session);
    if (previous.length) return previous;
    const cart = await Cart.findOne({ customer }).session(session);
    if (!cart?.items.length) throw new ApiError(400, 'Your cart is empty.');
    const groups = new Map();
    for (const entry of cart.items) {
      const product = await Product.findById(entry.product).session(session);
      const pricing = calculateLine(product, entry.quantity);
      if (!await User.exists({ _id: product.farmer, status: 'active', role: 'farmer' }).session(session)) throw new ApiError(409, 'Farmer is currently unavailable.');
      if (!product[`${input.fulfillmentMethod}Available`]) throw new ApiError(400, `${product.name} does not support ${input.fulfillmentMethod}.`);
      const remaining = product.quantity - entry.quantity;
      const updated = await Product.updateOne({ _id: product._id, quantity: { $gte: entry.quantity }, isActive: true, isDeleted: false }, { $inc: { quantity: -entry.quantity, orderCount: 1 }, $set: { availabilityStatus: remaining === 0 ? 'Sold Out' : product.isPreOrder ? 'Upcoming Harvest' : remaining < 5 ? 'Low Stock' : 'Available' } }, { session });
      if (updated.modifiedCount !== 1) throw new ApiError(409, 'Stock changed. Please review your cart.');
      const farmer = String(product.farmer);
      if (!groups.has(farmer)) groups.set(farmer, []);
      groups.get(farmer).push({ product: product._id, productName: product.name, productImage: product.coverImage?.url || product.images[0]?.url || '', category: product.category, unit: product.unit, ...pricing, isPreOrder: product.isPreOrder, availableDate: product.availableDate });
      if (remaining < 5) await notify(product.farmer, 'low_stock', `${product.name}: ${remaining} ${product.unit} remaining`, { relatedProduct: product._id }, session);
    }
    const created = [], groupId = randomUUID();
    for (const [farmer, items] of groups) {
      const subtotal = roundMoney(items.reduce((sum, item) => sum + item.lineTotal, 0));
      const fee = input.fulfillmentMethod === 'delivery' ? deliveryCharge : 0;
      const profile = await FarmerProfile.findOne({ user: farmer }).session(session);
      const [order] = await Order.create([{ orderNumber: `F2H-${randomUUID().slice(0,8).toUpperCase()}`, checkoutGroupId: groupId, checkoutKey: key, customer, farmer, items, subtotal, deliveryCharge: fee, total: roundMoney(subtotal + fee), ...input, pickupDetails: input.fulfillmentMethod === 'pickup' ? `${profile?.farmName || 'Farm pickup'} · ${profile?.city || ''}, ${profile?.district || ''}. Coordinate pickup with your farmer.` : undefined, isPreOrder: items.some((item) => item.isPreOrder), statusHistory: [{ status: 'Pending', changedAt: new Date(), changedBy: customer }] }], { session });
      created.push(order); await notify(farmer, 'new_order', `New order ${order.orderNumber}`, { relatedOrder: order._id }, session);
    }
    cart.items = []; await cart.save({ session });
    return created;
  });
}
