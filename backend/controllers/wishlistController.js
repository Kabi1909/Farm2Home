import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import ApiError from '../utils/ApiError.js';
import { respond } from '../utils/asyncHandler.js';
import { publicProduct } from './productController.js';
export async function get(req, res) {
  const wishlist = await Wishlist.findOne({ customer: req.user._id }).populate({ path: 'products', match: { isActive: true, isDeleted: false } });
  respond(res, (wishlist?.products || []).map(publicProduct));
}
export async function write(req, res) {
  if (req.method === 'POST' && !await Product.exists({ _id: req.params.productId, isActive: true, isDeleted: false })) throw new ApiError(404, 'Product not found.');
  await Wishlist.updateOne({ customer: req.user._id }, req.method === 'POST' ? { $addToSet: { products: req.params.productId } } : { $pull: { products: req.params.productId } });
  return get(req, res);
}
