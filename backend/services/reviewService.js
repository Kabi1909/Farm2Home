import mongoose from "mongoose";
import Review from "../models/Review.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import FarmerProfile from "../models/FarmerProfile.js";
import ApiError from "../utils/ApiError.js";
import { notify } from "./notificationService.js";

export async function createReview(customer, input) {
  return mongoose.connection.transaction(async (session) => {
    const order = await Order.findOne({
      _id: input.orderId,
      customer,
      status: "Completed",
      "items.product": input.productId,
    }).session(session);

    if (!order) {
      throw new ApiError(403, "Review a product from your completed orders.");
    }

    const [review] = await Review.create(
      [
        {
          customer,
          order: order._id,
          farmer: order.farmer,
          product: input.productId,
          rating: input.rating,
          comment: input.comment,
        },
      ],
      { session },
    );

    // Updating the shared rating documents also serializes concurrent reviews.
    const [productRating] = await Review.aggregate([
      { $match: { product: review.product } },
      {
        $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } },
      },
    ]).session(session);
    await Product.updateOne(
      { _id: review.product },
      {
        $set: {
          averageRating: productRating.average,
          reviewCount: productRating.count,
        },
      },
      { session },
    );

    const [farmerRating] = await Review.aggregate([
      { $match: { farmer: order.farmer } },
      {
        $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } },
      },
    ]).session(session);
    await FarmerProfile.updateOne(
      { user: order.farmer },
      {
        $set: {
          averageRating: farmerRating.average,
          totalReviews: farmerRating.count,
        },
      },
      { session },
    );
    await notify(
      order.farmer,
      "new_review",
      "A customer reviewed your produce.",
      {
        relatedProduct: review.product,
        relatedOrder: order._id,
      },
      session,
    );
    return review;
  });
}
