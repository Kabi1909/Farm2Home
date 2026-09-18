import mongoose from 'mongoose';
import { Schema, options, ref } from './shared.js';
export default mongoose.model('UploadAsset', new Schema({ owner: ref('User'), url: String, publicId: { type: String, unique: true }, product: ref('Product', false), kind: { type: String, enum: ['product','profile'] }, cleanupPending: { type: Boolean, default: false } }, options));
