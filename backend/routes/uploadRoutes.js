import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { upload, verifyImages } from "../middleware/uploadMiddleware.js";
import { uploadImages } from "../services/cloudinaryService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
const router = Router();
router.post(
  "/uploads/:kind",
  protect,
  upload,
  verifyImages,
  asyncHandler(uploadImages),
);
export default router;
