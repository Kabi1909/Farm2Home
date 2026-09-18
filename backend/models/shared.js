import mongoose from 'mongoose';
export const { Schema } = mongoose;
export const ref = (model, required = true) => ({ type: Schema.Types.ObjectId, ref: model, required });
export const money = { type: Number, min: 0, required: true };
export const options = { timestamps: true, optimisticConcurrency: true, toJSON: { virtuals: true, transform(doc, value) { delete value.__v; delete value.password; delete value.tokenVersion; return value; } } };
export const image = new Schema({ url: { type: String, required: true }, publicId: { type: String, required: true } }, { _id: false });
export const address = new Schema({ label: String, recipientName: String, phone: String, addressLine: String, district: String, city: String, isDefault: { type: Boolean, default: false } });
