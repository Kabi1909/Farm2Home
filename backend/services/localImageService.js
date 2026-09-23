import { fileTypeFromBuffer } from "file-type";
import UploadAsset from "../models/UploadAsset.js";
import ApiError from "../utils/ApiError.js";

const publicIdPattern = /^local\/farm2home\/[a-f\d]{24}\/[a-f\d-]{36}$/i;
export const isLocalImage = (publicId) => publicIdPattern.test(publicId);

export function localImageUrl(config, publicId) {
  if (!isLocalImage(publicId))
    throw new ApiError(400, "Invalid image identifier.");
  return `http://localhost:${config.PORT || 5000}/api/uploads/${publicId}`;
}

// Development images are real uploads persisted alongside their asset records.
// Each verified image is limited to 2 MB by the upload middleware.
export function localImageAdapter(config) {
  return {
    publicIdPrefix: "local/farm2home",
    acceptsUrl: (url, publicId) => url === localImageUrl(config, publicId),
    async upload(buffer, publicId) {
      const url = localImageUrl(config, publicId);
      const type = await fileTypeFromBuffer(buffer);
      if (
        !type ||
        !["image/jpeg", "image/png", "image/webp"].includes(type.mime)
      )
        throw new ApiError(400, "Unsupported image contents.");
      const result = await UploadAsset.updateOne(
        { publicId, uploadPending: true },
        { $set: { localData: buffer, localMime: type.mime } },
      );
      if (!result.matchedCount)
        throw new Error("Upload asset no longer exists.");
      return { publicId, url };
    },
    async remove(publicId) {
      if (!isLocalImage(publicId))
        throw new ApiError(400, "Invalid image identifier.");
      await UploadAsset.updateOne(
        { publicId },
        { $unset: { localData: 1, localMime: 1 } },
      );
    },
  };
}

export async function serveLocalImage(req, res) {
  if (req.app.locals.config.NODE_ENV !== "development")
    throw new ApiError(404, "Image not found.");
  const publicId = `local/farm2home/${req.params.owner}/${req.params.image}`;
  if (!isLocalImage(publicId)) throw new ApiError(404, "Image not found.");
  const asset = await UploadAsset.findOne({
    publicId,
    uploadPending: false,
    cleanupPending: false,
  }).select("+localData +localMime");
  if (!asset?.localData || !asset.localMime)
    throw new ApiError(404, "Image not found.");
  res.set("Cross-Origin-Resource-Policy", "cross-origin");
  res.set("Cache-Control", "public, max-age=300");
  res.type(asset.localMime).send(Buffer.from(asset.localData));
}
