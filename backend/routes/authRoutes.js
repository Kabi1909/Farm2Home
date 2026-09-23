import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as controller from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { registration, login, passwordChange } from "../validation/schemas.js";
import { asyncHandler as wrap } from "../utils/asyncHandler.js";
const router = Router();
const limiter = rateLimit({
  windowMs: 15 * 60000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Try again later.",
    errors: [],
  },
});
router.post(
  "/register",
  limiter,
  validateRequest(registration),
  wrap(controller.register),
);
router.post("/login", limiter, validateRequest(login), wrap(controller.login));
router.get("/me", protect, controller.me);
router.post("/logout", protect, wrap(controller.logout));
router.put(
  "/password",
  limiter,
  protect,
  validateRequest(passwordChange),
  wrap(controller.changePassword),
);
export default router;
