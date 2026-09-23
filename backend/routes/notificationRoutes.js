import { Router } from "express";
import * as controller from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  validateRequest as validate,
  validateId,
} from "../middleware/validateRequest.js";
import { page } from "../validation/schemas.js";
import { asyncHandler as wrap } from "../utils/asyncHandler.js";

const router = Router();
router.use(protect);
router.param("id", validateId);
router.get("/", validate(page.strict(), "query"), wrap(controller.list));
router.put("/read-all", wrap(controller.markAllRead));
router.put("/:id/read", wrap(controller.markRead));
export default router;
