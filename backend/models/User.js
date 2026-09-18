import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { Schema, options, image } from './shared.js';
import { roles } from '../utils/constants.js';
const schema = new Schema({ name: { type: String, required: true }, email: { type: String, required: true, lowercase: true, trim: true, unique: true }, phone: String, password: { type: String, required: true, select: false }, role: { type: String, enum: roles, required: true }, profileImage: image, status: { type: String, enum: ['active','disabled'], default: 'active' }, tokenVersion: { type: Number, default: 0, select: false } }, options);
schema.pre('save', async function () { if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12); });
schema.methods.comparePassword = function (candidate) { return bcrypt.compare(candidate, this.password); };
export default mongoose.model('User', schema);
