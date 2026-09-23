import { Router } from "express";
import { z } from "zod";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { farmerAnalytics } from "../services/analyticsService.js";
import { asyncHandler, respond } from "../utils/asyncHandler.js";

const router = Router();
router.get(
  "/farmer/analytics",
  protect,
  authorize("farmer"),
  validateRequest(z.object({}).strict(), "query"),
  asyncHandler(async (req, res) =>
    respond(res, await farmerAnalytics(req.user._id)),
  ),
);
export default router;
