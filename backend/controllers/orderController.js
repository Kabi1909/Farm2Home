import { randomUUID } from "node:crypto";
import Order from "../models/Order.js";
import ApiError from "../utils/ApiError.js";
import { respond } from "../utils/asyncHandler.js";
import { listPage } from "../utils/pagination.js";
import { checkout, transitionOrder } from "../services/orderService.js";
export async function create(req, res) {
  const key = req.get("Idempotency-Key") || randomUUID();
  if (!/^[a-zA-Z0-9_-]{8,100}$/.test(key))
    throw new ApiError(400, "Invalid idempotency key.");
  respond(
    res,
    await checkout(
      req.user._id,
      req.validated.body,
      key,
      req.app.locals.config.DELIVERY_CHARGE,
      req.app.locals.config.LOW_STOCK_THRESHOLD,
    ),
    "Orders created.",
    201,
  );
}
export async function list(req, res) {
  const filter = {
    [req.user.role === "farmer" ? "farmer" : "customer"]: req.user._id,
  };
  const { status } = req.validated.query;
  if (status)
    filter.status =
      status === "active"
        ? { $nin: ["Completed", "Cancelled"] }
        : status === "completed"
          ? "Completed"
          : status === "cancelled"
            ? "Cancelled"
            : status;
  res.json({
    success: true,
    ...(await listPage(Order, filter, req.validated.query)),
  });
}
export async function detail(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found.");
  if (
    String(order[req.user.role === "farmer" ? "farmer" : "customer"]) !==
    req.user.id
  )
    throw new ApiError(403, "You do not own this order.");
  respond(res, order);
}
export async function status(req, res) {
  respond(
    res,
    await transitionOrder(
      req.params.id,
      req.user,
      req.path.endsWith("/cancel") ? "Cancelled" : req.validated.body.status,
      req.app.locals.config.LOW_STOCK_THRESHOLD,
    ),
  );
}
