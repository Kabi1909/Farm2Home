import { Router } from 'express';
import auth from './authRoutes.js';
import farmer from './farmerRoutes.js';
import customer from './customerRoutes.js';
import products from './productRoutes.js';
import uploads from './uploadRoutes.js';
const router = Router();
router.use('/auth', auth);
router.use(farmer);
router.use('/customer', customer);
router.use(products);
router.use(uploads);
export default router;



