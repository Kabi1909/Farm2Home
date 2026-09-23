import mongoose from "mongoose";
import User from "../models/User.js";
import CustomerProfile from "../models/CustomerProfile.js";
import ApiError from "../utils/ApiError.js";
import { respond } from "../utils/asyncHandler.js";
export async function mine(req, res) {
  respond(
    res,
    await CustomerProfile.findOne({ user: req.user._id }).populate(
      "user",
      "name email phone profileImage",
    ),
  );
}
export async function update(req, res) {
  const { name, phone, ...fields } = req.validated.body;
  const profile = await mongoose.connection.transaction(async (session) => {
    if (name || phone)
      await User.updateOne(
        { _id: req.user._id },
        { $set: { ...(name && { name }), ...(phone && { phone }) } },
        { session },
      );
    return CustomerProfile.findOneAndUpdate(
      { user: req.user._id },
      { $set: fields },
      { new: true, session, runValidators: true },
    );
  });
  respond(res, profile);
}
export async function addressWrite(req, res) {
  const profile = await CustomerProfile.findOne({ user: req.user._id });
  const entry = req.params.addressId
    ? profile.addresses.id(req.params.addressId)
    : null;
  if (req.params.addressId && !entry)
    throw new ApiError(404, "Address not found.");
  if (req.method === "DELETE") entry.deleteOne();
  else {
    if (req.validated.body.isDefault)
      profile.addresses.forEach((item) => {
        item.isDefault = false;
      });
    if (entry) entry.set(req.validated.body);
    else {
      if (profile.addresses.length >= 10)
        throw new ApiError(400, "Maximum ten addresses.");
      profile.addresses.push(req.validated.body);
    }
  }
  if (
    profile.addresses.length &&
    !profile.addresses.some((item) => item.isDefault)
  )
    profile.addresses[0].isDefault = true;
  await profile.save();
  respond(res, profile);
}
