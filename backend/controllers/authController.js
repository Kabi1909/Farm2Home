import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import FarmerProfile from "../models/FarmerProfile.js";
import CustomerProfile from "../models/CustomerProfile.js";
import Cart from "../models/Cart.js";
import Wishlist from "../models/Wishlist.js";
import ApiError from "../utils/ApiError.js";
import { respond } from "../utils/asyncHandler.js";
import { generateToken } from "../utils/generateToken.js";
const dummyHash = await bcrypt.hash("Not-a-valid-account-123!", 12);
export async function register(req, res) {
  const { name, email, phone, password, role } = req.validated.body;
  const user = await mongoose.connection.transaction(async (session) => {
    const [created] = await User.create(
      [{ name, email, phone, password, role }],
      { session },
    );
    const Profile = role === "farmer" ? FarmerProfile : CustomerProfile;
    await Profile.create([{ user: created._id }], { session });
    if (role === "customer") {
      await Cart.create([{ customer: created._id, items: [] }], { session });
      await Wishlist.create([{ customer: created._id, products: [] }], {
        session,
      });
    }
    return created;
  });
  respond(
    res,
    { user, token: generateToken(user, req.app.locals.config) },
    "Account created.",
    201,
  );
}
export async function login(req, res) {
  const { email, password } = req.validated.body;
  const user = await User.findOne({ email }).select("+password +tokenVersion");
  const valid = await bcrypt.compare(password, user?.password || dummyHash);
  if (!user || !valid || user.status !== "active")
    throw new ApiError(401, "Email or password is incorrect.");
  respond(res, { user, token: generateToken(user, req.app.locals.config) });
}
export const me = (req, res) => respond(res, req.user);
export async function logout(req, res) {
  await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
  respond(res, null, "Signed out on all devices.");
}
