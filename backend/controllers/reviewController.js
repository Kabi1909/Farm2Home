import Review from "../models/Review.js";
import { createReview } from "../services/reviewService.js";
import { respond } from "../utils/asyncHandler.js";
import { listPage } from "../utils/pagination.js";

export async function create(req, res) {
  respond(
    res,
    await createReview(req.user._id, req.validated.body),
    "Review submitted.",
    201,
  );
}

export async function list(req, res) {
  const filter = req.params.productId
    ? { product: req.params.productId }
    : { farmer: req.params.farmerId || req.user._id };
  const result = await listPage(
    Review,
    filter,
    req.validated.query,
    { createdAt: -1, _id: -1 },
    { path: "customer", select: "name profileImage" },
  );
  res.json({
    success: true,
    ...result,
    data: result.data.map((review) => ({
      id: review.id,
      product: review.product,
      farmer: review.farmer,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      customerName: review.customer?.name || "Customer",
      customerImage: review.customer?.profileImage?.url || "",
      verifiedPurchase: true,
    })),
  });
}
