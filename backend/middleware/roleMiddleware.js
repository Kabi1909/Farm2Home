import ApiError from "../utils/ApiError.js";
export const authorize =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.user?.role)
      ? next()
      : next(new ApiError(403, "This role cannot perform that action."));
export function assertOwner(owner, user) {
  if (String(owner) !== String(user._id))
    throw new ApiError(403, "You do not own this resource.");
}
