import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { configuredCloudinary } from "../config/cloudinary.js";
import UploadAsset from "../models/UploadAsset.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { respond } from "../utils/asyncHandler.js";
import { isLocalImage, localImageAdapter } from "./localImageService.js";
function unavailable() {
  const error = new ApiError(503, "Image service unavailable.");
  error.publicMessage =
    "Image upload is temporarily unavailable. Please try again.";
  return error;
}
export function cloudAdapter(config) {
  const local = localImageAdapter(config);
  const hasCredentials = [
    config.CLOUDINARY_CLOUD_NAME,
    config.CLOUDINARY_API_KEY,
    config.CLOUDINARY_API_SECRET,
  ].some(Boolean);
  if (config.NODE_ENV === "development" && !hasCredentials) {
    return {
      ...local,
      remove: (publicId) =>
        isLocalImage(publicId)
          ? local.remove(publicId)
          : Promise.reject(unavailable()),
    };
  }
  const cloud = configuredCloudinary(config);
  return {
    ensureAvailable() {
      if (!cloud) {
        const error = unavailable();
        error.publicMessage =
          "Image storage is not configured. Set all three Cloudinary credentials on the backend, then restart it.";
        throw error;
      }
    },
    upload: (buffer, publicId) =>
      new Promise((resolve, reject) => {
        if (!cloud) return reject(unavailable());
        const stream = cloud.uploader.upload_stream(
          {
            public_id: publicId,
            resource_type: "image",
            timeout: 10000,
            overwrite: false,
          },
          (error, value) =>
            error
              ? reject(unavailable())
              : resolve({ url: value.secure_url, publicId: value.public_id }),
        );
        stream.on("error", () => reject(unavailable()));
        stream.end(buffer);
      }),
    remove: async (publicId) => {
      if (isLocalImage(publicId)) return local.remove(publicId);
      if (!cloud) throw unavailable();
      const result = await cloud.uploader.destroy(publicId, {
        resource_type: "image",
        invalidate: true,
        timeout: 10000,
      });
      if (!["ok", "not found"].includes(result.result)) throw unavailable();
    },
  };
}
export async function processCleanup(adapter) {
  const eligible = {
    $or: [
      { cleanupPending: true, uploadPending: false },
      {
        uploadPending: true,
        createdAt: { $lt: new Date(Date.now() - 3600000) },
      },
      {
        kind: "product",
        product: null,
        createdAt: { $lt: new Date(Date.now() - 86400000) },
      },
    ],
  };
  const assets = await UploadAsset.find(eligible).limit(25);
  for (const asset of assets) {
    try {
      // Claim before deleting remotely; a product cannot bind a claimed asset.
      const claimed = await UploadAsset.findOneAndUpdate(
        { _id: asset._id, ...eligible },
        { $set: { cleanupPending: true } },
      );
      if (!claimed) continue;
      await adapter.remove(asset.publicId);
      await asset.deleteOne();
    } catch {
      /* Persist queue entry for the next cleanup attempt. */
    }
  }
}
export async function uploadImages(req, res) {
  const kind = req.params.kind;
  if (
    !["product", "profile"].includes(kind) ||
    (kind === "product" && req.user.role !== "farmer")
  )
    throw new ApiError(403, "Upload type is not allowed.");
  if (kind === "profile" && req.files.length !== 1)
    throw new ApiError(400, "Choose one profile image.");
  const adapter =
    req.app.locals.cloudAdapter || cloudAdapter(req.app.locals.config);
  adapter.ensureAvailable?.();
  const created = [];
  try {
    for (const file of req.files) {
      // Persist the intended public ID before network IO so failures stay retryable.
      const asset = await UploadAsset.create({
        publicId: `${adapter.publicIdPrefix || "farm2home"}/${req.user.id}/${randomUUID()}`,
        owner: req.user._id,
        kind,
        uploadPending: true,
      });
      created.push(asset);
      const image = await adapter.upload(file.buffer, asset.publicId);
      if (
        image.publicId !== asset.publicId ||
        !(adapter.acceptsUrl
          ? adapter.acceptsUrl(image.url, asset.publicId)
          : image.url.startsWith("https://"))
      )
        throw unavailable();
      asset.url = image.url;
      await asset.save();
    }
    await mongoose.connection.transaction(async (session) => {
      await UploadAsset.updateMany(
        { _id: { $in: created.map((asset) => asset._id) } },
        { $set: { uploadPending: false } },
        { session },
      );
      if (kind === "profile") {
        const old = await User.findOneAndUpdate(
          { _id: req.user._id },
          {
            $set: {
              profileImage: {
                url: created[0].url,
                publicId: created[0].publicId,
              },
            },
          },
          { session },
        );
        if (old.profileImage?.publicId)
          await UploadAsset.updateOne(
            { publicId: old.profileImage.publicId, owner: req.user._id },
            { $set: { cleanupPending: true } },
            { session },
          );
      }
    });
  } catch (error) {
    await UploadAsset.updateMany(
      { _id: { $in: created.map((asset) => asset._id) } },
      { $set: { cleanupPending: true, uploadPending: false } },
    );
    throw unavailable();
  }
  respond(
    res,
    created.map(({ url, publicId }) => ({ url, publicId })),
    "Images uploaded.",
    201,
  );
}
