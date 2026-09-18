import FarmerProfile from '../models/FarmerProfile.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import { respond } from '../utils/asyncHandler.js';
import { listPage, escapeRegex } from '../utils/pagination.js';
export function publicFarmer(profile) {
  const value = profile.toJSON();
  if (!value.publicLocation) { delete value.latitude; delete value.longitude; }
  return value;
}
export async function list(req, res) {
  const query = req.validated.query;
  const filter = { user: { $in: await User.find({ role: 'farmer', status: 'active' }).distinct('_id') } };
  if (query.district) filter.district = query.district;
  if (query.farmingMethod) filter.farmingMethods = query.farmingMethod;
  if (query.rating) filter.averageRating = { $gte: query.rating };
  if (query.search) filter.$or = ['farmName','description','city','district'].map((key) => ({ [key]: new RegExp(escapeRegex(query.search), 'i') }));
  const result = await listPage(FarmerProfile, filter, query, { averageRating: -1, _id: 1 }, { path: 'user', select: 'name profileImage' });
  res.json({ success: true, data: result.data.map(publicFarmer), pagination: result.pagination });
}
export async function detail(req, res) {
  const profile = await FarmerProfile.findOne({ user: req.params.id }).populate({ path: 'user', select: 'name profileImage', match: { status: 'active' } });
  if (!profile?.user) throw new ApiError(404, 'Farmer not found.');
  respond(res, publicFarmer(profile));
}
export async function mine(req, res) { respond(res, await FarmerProfile.findOne({ user: req.user._id }).populate('user', 'name email phone profileImage')); }
export async function update(req, res) {
  const { name, phone, ...fields } = req.validated.body;
  const data = await mongoose.connection.transaction(async (session) => {
    if (name || phone) await User.updateOne({ _id: req.user._id }, { $set: { ...(name && { name }), ...(phone && { phone }) } }, { session });
    return FarmerProfile.findOneAndUpdate({ user: req.user._id }, { $set: fields }, { new: true, runValidators: true, session });
  });
  respond(res, data);
}
