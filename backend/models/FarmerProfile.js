import mongoose from "mongoose";
import { Schema, options, ref } from "./shared.js";
const schema = new Schema(
  {
    user: { ...ref("User"), unique: true },
    farmName: { type: String, default: "" },
    district: String,
    city: String,
    description: String,
    farmSize: Number,
    mainCrops: [String],
    farmingMethods: [String],
    yearsExperience: Number,
    deliveryAvailable: { type: Boolean, default: true },
    pickupAvailable: { type: Boolean, default: true },
    publicLocation: { type: Boolean, default: false },
    latitude: Number,
    longitude: Number,
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
  },
  options,
);
schema.index({ district: 1, averageRating: -1 });
export default mongoose.model("FarmerProfile", schema);
