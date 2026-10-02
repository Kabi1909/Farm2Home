import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validateRequest } from "../middleware/validateRequest.js";
import { contactInput } from "../validation/schemas.js";
import { sendContactMessage } from "../controllers/contactController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many messages were sent. Please try again later.",
    errors: [],
  },
});

router.post(
  "/",
  limiter,
  validateRequest(contactInput),
  asyncHandler(sendContactMessage),
);

export default router;
