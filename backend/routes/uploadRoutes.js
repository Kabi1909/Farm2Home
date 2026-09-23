import { Router } from "express";
import rateLimit from "express-rate-limit";
import ApiError from "../utils/ApiError.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload, verifyImages } from "../middleware/uploadMiddleware.js";
import { uploadImages } from "../services/cloudinaryService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { serveLocalImage } from "../services/localImageService.js";
const router = Router();
router.get(
  "/uploads/local/farm2home/:owner/:image",
  asyncHandler(serveLocalImage),
);
const limiter = rateLimit({
  windowMs: 15 * 60000,
  limit: 30,
  keyGenerator: (req) => req.user.id,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Upload limit reached. Please try again later.",
    errors: [],
  },
});
router.post(
  "/uploads/:kind",
  protect,
  (req, res, next) => {
    if (
      !["product", "profile"].includes(req.params.kind) ||
      (req.params.kind === "product" && req.user.role !== "farmer")
    ) {
      return next(new ApiError(403, "Upload type is not allowed."));
    }
    next();
  },
  limiter,
  upload,
  verifyImages,
  asyncHandler(uploadImages),
);
export default router;
