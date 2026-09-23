import { Router } from "express";
import * as controller from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  validateRequest as validate,
  validateId,
} from "../middleware/validateRequest.js";
import { reviewInput, page } from "../validation/schemas.js";
import { asyncHandler as wrap } from "../utils/asyncHandler.js";

const router = Router();
router.param("productId", validateId);
router.param("farmerId", validateId);
router.post(
  "/reviews",
  protect,
  authorize("customer"),
  validate(reviewInput),
  wrap(controller.create),
);
router.get(
  "/reviews/product/:productId",
  validate(page.strict(), "query"),
  wrap(controller.list),
);
router.get(
  "/reviews/farmer/:farmerId",
  validate(page.strict(), "query"),
  wrap(controller.list),
);
router.get(
  "/farmer/reviews",
  protect,
  authorize("farmer"),
  validate(page.strict(), "query"),
  wrap(controller.list),
);
export default router;
