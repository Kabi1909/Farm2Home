import { Router } from "express";
import * as controller from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  validateRequest as validate,
  validateId,
} from "../middleware/validateRequest.js";
import { cartInput, cartQuantity } from "../validation/schemas.js";
import { asyncHandler as wrap } from "../utils/asyncHandler.js";
const router = Router();
router.use(protect, authorize("customer"));
router.param("itemId", validateId);
router.get("/", wrap(controller.get));
router.post("/", validate(cartInput), wrap(controller.write));
router.put("/:itemId", validate(cartQuantity), wrap(controller.write));
router.delete("/:itemId", wrap(controller.write));
router.delete("/", wrap(controller.write));
export default router;
