import mongoose from 'mongoose';
import { Schema, options, ref, address } from './shared.js';
const schema = new Schema({ user: { ...ref('User'), unique: true }, addresses: [address], district: String, city: String, preferredProducts: [String] }, options);
export default mongoose.model('CustomerProfile', schema);
