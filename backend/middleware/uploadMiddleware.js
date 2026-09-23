import multer from "multer";
import { fileTypeFromBuffer } from "file-type";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 5, fields: 0 },
  fileFilter(req, file, done) {
    done(
      null,
      ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype),
    );
  },
}).array("images", 5);
export const verifyImages = asyncHandler(async (req, res, next) => {
  if (!req.files?.length)
    throw new ApiError(400, "Upload JPG, PNG or WebP images.");
  for (const file of req.files) {
    const type = await fileTypeFromBuffer(file.buffer).catch(() => null);
    if (
      !type ||
      !["image/jpeg", "image/png", "image/webp"].includes(type.mime) ||
      type.mime !== file.mimetype
    )
      throw new ApiError(400, "Image contents do not match a supported type.");
  }
  next();
});
