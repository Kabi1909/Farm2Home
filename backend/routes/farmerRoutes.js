import { Router } from "express";
import { z } from "zod";
import * as controller from "../controllers/farmerController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  validateRequest as validate,
  validateId,
} from "../middleware/validateRequest.js";
import { farmerProfile, page } from "../validation/schemas.js";
import { districts, methods } from "../utils/constants.js";
import { asyncHandler as wrap } from "../utils/asyncHandler.js";
const router = Router();
router.param("id", validateId);
router.get(
  "/farmers",
  validate(
    page
      .extend({
        search: z.string().max(100).optional(),
        district: z.enum(districts).optional(),
        farmingMethod: z.enum(methods).optional(),
        rating: z.coerce.number().min(0).max(5).optional(),
      })
      .strict(),
    "query",
  ),
  wrap(controller.list),
);
router.get("/farmers/:id", wrap(controller.detail));
router.get(
  "/farmer/profile",
  protect,
  authorize("farmer"),
  wrap(controller.mine),
);
router.put(
  "/farmer/profile",
  protect,
  authorize("farmer"),
  validate(farmerProfile),
  wrap(controller.update),
);
export default router;
