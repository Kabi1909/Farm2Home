import mongoose from "mongoose";
import Product from "../models/Product.js";
import FarmerProfile from "../models/FarmerProfile.js";
import UploadAsset from "../models/UploadAsset.js";
import ApiError from "../utils/ApiError.js";
import { respond } from "../utils/asyncHandler.js";
import { assertOwner } from "../middleware/roleMiddleware.js";
import { listPage, escapeRegex } from "../utils/pagination.js";
import { productCreate, productFields } from "../validation/schemas.js";
const viewed = new Map();
export function publicProduct(product) {
  const value = product.toJSON();
  if (!value.location?.isPublic) delete value.location;
  return value;
}
export async function list(req, res) {
  const q = req.validated.query,
    filter = { isActive: true, isDeleted: false };
  for (const key of [
    "category",
    "district",
    "city",
    "farmingMethod",
    "quality",
    "deliveryAvailable",
    "pickupAvailable",
  ])
    if (q[key] !== undefined) filter[key] = q[key];
  if (q.availability) filter.availabilityStatus = q.availability;
  if (q.rating !== undefined) filter.averageRating = { $gte: q.rating };
  if (q.minPrice !== undefined || q.maxPrice !== undefined)
    filter.price = {
      ...(q.minPrice !== undefined && { $gte: q.minPrice }),
      ...(q.maxPrice !== undefined && { $lte: q.maxPrice }),
    };
  if (q.search) {
    const pattern = new RegExp(escapeRegex(q.search), "i");
    const farms = await FarmerProfile.find({ farmName: pattern }).distinct(
      "user",
    );
    filter.$or = [
      ...["name", "category", "district", "city"].map((key) => ({
        [key]: pattern,
      })),
      { farmer: { $in: farms } },
    ];
  }
  const sorts = {
    latest: { createdAt: -1, _id: -1 },
    price_asc: { price: 1, _id: 1 },
    price_desc: { price: -1, _id: 1 },
    rating: { averageRating: -1, _id: 1 },
    popular: { orderCount: -1, _id: 1 },
  };
  const result = await listPage(Product, filter, q, sorts[q.sort]);
  res.json({
    success: true,
    data: result.data.map(publicProduct),
    pagination: result.pagination,
  });
}
export async function detail(req, res) {
  const product = await Product.findOne({
    _id: req.params.id,
    isActive: true,
    isDeleted: false,
  });
  if (!product) throw new ApiError(404, "Product not found.");
  const key = `${req.ip}:${product.id}`;
  if (!viewed.has(key) || viewed.get(key) < Date.now()) {
    if (viewed.size > 10000) viewed.clear();
    viewed.set(key, Date.now() + 300000);
    await Product.updateOne({ _id: product._id }, { $inc: { views: 1 } });
  }
  respond(res, publicProduct(product));
}
export async function mine(req, res) {
  const result = await listPage(
    Product,
    { farmer: req.user._id, isDeleted: false },
    req.validated.query,
  );
  res.json({ success: true, ...result });
}
export async function write(req, res) {
  const result = await mongoose.connection.transaction(async (session) => {
    let product = req.params.id
      ? await Product.findOne({ _id: req.params.id, isDeleted: false }).session(
          session,
        )
      : new Product({ farmer: req.user._id });
    if (!product) throw new ApiError(404, "Product not found.");
    assertOwner(product.farmer, req.user);
    const before = product.images.map((item) => item.publicId);
    const previous = Object.fromEntries(
      Object.keys(productFields.shape)
        .filter((key) => product.get(key) !== undefined)
        .map((key) => [key, product.get(key)]),
    );
    for (const key of ["harvestDate", "availableDate", "freshnessDate"])
      if (previous[key])
        previous[key] = previous[key].toISOString().slice(0, 10);
    if (previous.location)
      previous.location = {
        latitude: previous.location.latitude,
        longitude: previous.location.longitude,
        isPublic: previous.location.isPublic,
      };
    previous.images = product.images.map((item) => ({
      publicId: item.publicId,
    }));
    const parsed = productCreate.safeParse({
      ...previous,
      ...req.validated.body,
    });
    if (!parsed.success)
      throw new ApiError(
        400,
        "Invalid product data.",
        parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      );
    const fields = parsed.data;
    const ids = fields.images.map((item) => item.publicId);
    const assets = await UploadAsset.find({
      publicId: { $in: ids },
      owner: req.user._id,
      kind: "product",
      cleanupPending: false,
      uploadPending: false,
      $or: [{ product: null }, { product: product._id }],
    }).session(session);
    if (assets.length !== ids.length)
      throw new ApiError(
        403,
        "Images must be uploaded and owned by this farmer.",
      );
    fields.images = ids.map((publicId) => {
      const asset = assets.find((item) => item.publicId === publicId);
      return { url: asset.url, publicId };
    });
    fields.isPreOrder = fields.availabilityStatus === "Upcoming Harvest";
    if (fields.quantity === 0) fields.availabilityStatus = "Sold Out";
    product.set(fields);
    product.coverImage = fields.images[0];
    await product.save({ session });
    await UploadAsset.updateMany(
      { _id: { $in: assets.map((item) => item._id) } },
      { $set: { product: product._id } },
      { session },
    );
    await UploadAsset.updateMany(
      {
        owner: req.user._id,
        publicId: { $in: before.filter((item) => !ids.includes(item)) },
      },
      { $set: { cleanupPending: true } },
      { session },
    );
    return product;
  });
  respond(res, result, "Product saved.", req.params.id ? 200 : 201);
}
export async function remove(req, res) {
  await mongoose.connection.transaction(async (session) => {
    const product = await Product.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).session(session);
    if (!product) throw new ApiError(404, "Product not found.");
    assertOwner(product.farmer, req.user);
    product.isDeleted = true;
    product.isActive = false;
    await product.save({ session });
    await UploadAsset.updateMany(
      { product: product._id, owner: req.user._id },
      { $set: { cleanupPending: true } },
      { session },
    );
  });
  respond(res, null, "Product removed.");
}
