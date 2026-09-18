import mongoose from 'mongoose';
import { Schema, options, ref } from './shared.js';
export default mongoose.model('Wishlist', new Schema({ customer: { ...ref('User'), unique: true }, products: [ref('Product')] }, options));
