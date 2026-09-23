import { Router } from "express";
import rateLimit from "express-rate-limit";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { aiInput } from "../validation/schemas.js";
import { suggestPrice } from "../services/aiService.js";
import { asyncHandler, respond } from "../utils/asyncHandler.js";

const router = Router();
const limiter = rateLimit({
  windowMs: 60000,
  limit: 10,
  keyGenerator: (req) => req.user.id,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Please wait a minute before requesting another estimate. Manual pricing remains available.",
    errors: [],
  },
});
router.post(
  "/price-suggestion",
  protect,
  authorize("farmer"),
  limiter,
  validateRequest(aiInput),
  asyncHandler(async (req, res) => {
    respond(res, await suggestPrice(req.validated.body, req.app.locals.config));
  }),
);
export default router;
