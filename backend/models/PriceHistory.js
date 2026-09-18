import mongoose from 'mongoose';
import { Schema, options } from './shared.js';
const schema = new Schema({ productName: String, category: String, district: String, unit: String, averagePrice: Number, minimumPrice: Number, maximumPrice: Number, sampleCount: Number, date: Date, source: { type: String, default: 'Farm2Home listings' } }, options);
schema.index({ productName: 1, district: 1, unit: 1, date: -1 }, { unique: true });
export default mongoose.model('PriceHistory', schema);
