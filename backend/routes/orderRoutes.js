import { Router } from 'express';
import * as controller from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validateRequest as validate, validateId } from '../middleware/validateRequest.js';
import { checkout, orderQuery, statusInput } from '../validation/schemas.js';
import { asyncHandler as wrap } from '../utils/asyncHandler.js';
const router = Router(); router.use(protect); router.param('id', validateId);
router.post('/orders', authorize('customer'), validate(checkout), wrap(controller.create));
router.get('/orders/my', authorize('customer'), validate(orderQuery, 'query'), wrap(controller.list));
router.get('/farmer/orders', authorize('farmer'), validate(orderQuery, 'query'), wrap(controller.list));
router.get('/farmer/orders/:id', authorize('farmer'), wrap(controller.detail));
router.get('/orders/:id', wrap(controller.detail));
router.put('/orders/:id/cancel', authorize('customer'), wrap(controller.status));
router.put('/orders/:id/status', authorize('farmer'), validate(statusInput), wrap(controller.status));
export default router;

