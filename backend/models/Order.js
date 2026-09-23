import mongoose from "mongoose";
import { Schema, options, ref, address, money } from "./shared.js";
import { statuses } from "../utils/constants.js";
const schema = new Schema(
  {
    orderNumber: { type: String, unique: true },
    checkoutGroupId: String,
    checkoutKey: String,
    checkoutFingerprint: String,
    customer: ref("User"),
    farmer: ref("User"),
    items: [
      {
        product: ref("Product"),
        productName: String,
        productImage: String,
        category: String,
        quantity: Number,
        unit: String,
        unitPrice: money,
        isBulkPrice: Boolean,
        lineTotal: money,
        isPreOrder: Boolean,
        availableDate: Date,
      },
    ],
    subtotal: money,
    deliveryCharge: money,
    total: money,
    fulfillmentMethod: { type: String, enum: ["delivery", "pickup"] },
    deliveryAddress: address,
    pickupDetails: String,
    paymentMethod: {
      type: String,
      enum: ["cash_on_delivery", "pay_on_pickup"],
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    status: { type: String, enum: statuses, default: "Pending" },
    isPreOrder: Boolean,
    statusHistory: [
      { status: String, changedAt: Date, changedBy: ref("User") },
    ],
  },
  options,
);
schema.index({ customer: 1, createdAt: -1 });
schema.index({ farmer: 1, status: 1, createdAt: -1 });
schema.index({ customer: 1, checkoutKey: 1, farmer: 1 }, { unique: true });
export default mongoose.model("Order", schema);
