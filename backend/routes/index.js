import { Router } from 'express';
import auth from './authRoutes.js';
import farmer from './farmerRoutes.js';
import customer from './customerRoutes.js';
const router = Router();
router.use('/auth', auth);
router.use(farmer);
router.use('/customer', customer);
export default router;

