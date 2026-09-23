import { Router } from "express";
import * as controller from "../controllers/priceController.js";
import { priceQuery } from "../validation/schemas.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.get(
  "/recent",
  validateRequest(priceQuery, "query"),
  asyncHandler(controller.recent),
);
router.get(
  "/trends",
  validateRequest(priceQuery, "query"),
  asyncHandler(controller.trends),
);
export default router;
