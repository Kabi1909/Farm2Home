import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.get('Authorization') || '';
  if (!header.startsWith('Bearer ')) throw new ApiError(401, 'Authentication required.');
  let payload;
  try { payload = jwt.verify(header.slice(7), req.app.locals.config.JWT_SECRET, { algorithms: ['HS256'], issuer: 'farm2home-api', audience: 'farm2home-web' }); }
  catch { throw new ApiError(401, 'Invalid or expired token.'); }
  if (!/^[a-f\d]{24}$/i.test(payload.sub)) throw new ApiError(401, 'Invalid token.');
  const user = await User.findById(payload.sub).select('+tokenVersion');
  if (!user || user.status !== 'active' || user.tokenVersion !== payload.version) throw new ApiError(401, 'Authentication required.');
  req.user = user; next();
});
