import mongoose from "mongoose";
import { Schema, options, ref, image, money } from "./shared.js";
import {
  categories,
  districts,
  methods,
  qualities,
  units,
  availability,
} from "../utils/constants.js";
const schema = new Schema(
  {
    farmer: ref("User"),
    name: { type: String, required: true },
    category: { type: String, enum: categories, required: true },
    description: String,
    images: [image],
    coverImage: image,
    farmingMethod: { type: String, enum: methods },
    quality: { type: String, enum: qualities },
    harvestDate: Date,
    availableDate: Date,
    freshnessDate: Date,
    quantity: { type: Number, min: 0, required: true },
    unit: { type: String, enum: units, required: true },
    price: money,
    bulkPrice: { type: Number, min: 0, default: 0 },
    minimumBulkQuantity: { type: Number, min: 1, default: 20 },
    district: { type: String, enum: districts },
    city: String,
    location: {
      latitude: Number,
      longitude: Number,
      isPublic: { type: Boolean, default: false },
    },
    deliveryAvailable: Boolean,
    pickupAvailable: Boolean,
    deliveryNotes: String,
    pickupInstructions: String,
    availabilityStatus: {
      type: String,
      enum: availability,
      default: "Available",
    },
    isPreOrder: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    orderCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  options,
);
schema.index({ farmer: 1, createdAt: -1 });
schema.index({ isActive: 1, isDeleted: 1, category: 1, district: 1, price: 1 });
schema.index({ createdAt: -1 });
export default mongoose.model("Product", schema);
