import { randomUUID } from 'node:crypto';
import { configuredCloudinary } from '../config/cloudinary.js';
import UploadAsset from '../models/UploadAsset.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { respond } from '../utils/asyncHandler.js';
function unavailable() { const error = new ApiError(503, 'Image service unavailable.'); error.publicMessage = 'Image upload is temporarily unavailable. Please try again.'; return error; }
export function cloudAdapter(config) {
  const cloud = configuredCloudinary(config);
  return {
    upload: (buffer, publicId) => new Promise((resolve, reject) => {
      if (!cloud) return reject(unavailable());
      const stream = cloud.uploader.upload_stream({ public_id: publicId, resource_type: 'image', timeout: 10000, overwrite: false }, (error, value) => error ? reject(unavailable()) : resolve({ url: value.secure_url, publicId: value.public_id }));
      stream.on('error', () => reject(unavailable())); stream.end(buffer);
    }),
    remove: async (publicId) => { if (!cloud) throw unavailable(); await cloud.uploader.destroy(publicId, { resource_type: 'image', invalidate: true, timeout: 10000 }); },
  };
}
export async function processCleanup(adapter) {
  const assets = await UploadAsset.find({ $or: [{ cleanupPending: true }, { kind: 'product', product: null, createdAt: { $lt: new Date(Date.now() - 86400000) } }] }).limit(25);
  for (const asset of assets) {
    try { await adapter.remove(asset.publicId); await asset.deleteOne(); } catch { /* Persist queue entry for the next cleanup attempt. */ }
  }
}
export async function uploadImages(req, res) {
  const kind = req.params.kind;
  if (!['product','profile'].includes(kind) || kind === 'product' && req.user.role !== 'farmer') throw new ApiError(403, 'Upload type is not allowed.');
  if (kind === 'profile' && req.files.length !== 1) throw new ApiError(400, 'Choose one profile image.');
  const adapter = req.app.locals.cloudAdapter || cloudAdapter(req.app.locals.config);
  const created = [];
  try {
    for (const file of req.files) {
      const image = await adapter.upload(file.buffer, `farm2home/${req.user.id}/${randomUUID()}`);
      const asset = await UploadAsset.create({ ...image, owner: req.user._id, kind }); created.push(asset);
    }
    if (kind === 'profile') {
      const old = await User.findOneAndUpdate({ _id: req.user._id }, { $set: { profileImage: { url: created[0].url, publicId: created[0].publicId } } });
      if (old.profileImage?.publicId) await UploadAsset.updateOne({ publicId: old.profileImage.publicId, owner: req.user._id }, { $set: { cleanupPending: true } });
    }
  } catch (error) {
    await UploadAsset.updateMany({ _id: { $in: created.map((asset) => asset._id) } }, { $set: { cleanupPending: true } });
    throw unavailable();
  }
  respond(res, created.map(({ url, publicId }) => ({ url, publicId })), 'Images uploaded.', 201);
}
