import mongoose from 'mongoose';
import { Schema, options, ref } from './shared.js';
const schema = new Schema({ customer: { ...ref('User'), unique: true }, items: [{ product: ref('Product'), quantity: { type: Number, min: 1, required: true } }] }, options);
export default mongoose.model('Cart', schema);
