import mongoose from "mongoose";
import { Schema, options, ref } from "./shared.js";
const schema = new Schema(
  {
    customer: ref("User"),
    product: ref("Product"),
    farmer: ref("User"),
    order: ref("Order"),
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
  },
  options,
);
schema.index({ customer: 1, order: 1, product: 1 }, { unique: true });
schema.index({ product: 1, createdAt: -1 });
schema.index({ farmer: 1, createdAt: -1 });
export default mongoose.model("Review", schema);
