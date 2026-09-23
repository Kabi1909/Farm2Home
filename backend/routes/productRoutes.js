import { Router } from "express";
import * as controller from "../controllers/productController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  validateRequest as validate,
  validateId,
} from "../middleware/validateRequest.js";
import {
  productCreate,
  productUpdate,
  productQuery,
  page,
} from "../validation/schemas.js";
import { asyncHandler as wrap } from "../utils/asyncHandler.js";
const router = Router();
router.param("id", validateId);
router.get("/products", validate(productQuery, "query"), wrap(controller.list));
router.get("/products/:id", wrap(controller.detail));
router.get(
  "/farmer/products",
  protect,
  authorize("farmer"),
  validate(page.strict(), "query"),
  wrap(controller.mine),
);
router.post(
  "/products",
  protect,
  authorize("farmer"),
  validate(productCreate),
  wrap(controller.write),
);
router.put(
  "/products/:id",
  protect,
  authorize("farmer"),
  validate(productUpdate),
  wrap(controller.write),
);
router.delete(
  "/products/:id",
  protect,
  authorize("farmer"),
  wrap(controller.remove),
);
export default router;
