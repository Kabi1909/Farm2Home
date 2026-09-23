import mongoose from "mongoose";
import { Schema, options, ref } from "./shared.js";
const schema = new Schema(
  {
    user: ref("User"),
    type: String,
    title: String,
    message: String,
    relatedOrder: ref("Order", false),
    relatedProduct: ref("Product", false),
    isRead: { type: Boolean, default: false },
  },
  options,
);
schema.index({ user: 1, isRead: 1, createdAt: -1 });
export default mongoose.model("Notification", schema);
