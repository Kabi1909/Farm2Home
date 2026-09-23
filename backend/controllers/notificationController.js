import Notification from "../models/Notification.js";
import ApiError from "../utils/ApiError.js";
import { listPage } from "../utils/pagination.js";
import { respond } from "../utils/asyncHandler.js";

export async function list(req, res) {
  const filter = { user: req.user._id };
  const [result, unreadCount] = await Promise.all([
    listPage(Notification, filter, req.validated.query, {
      createdAt: -1,
      _id: -1,
    }),
    Notification.countDocuments({ ...filter, isRead: false }),
  ]);
  res.json({ success: true, ...result, unreadCount });
}

export async function markRead(req, res) {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: { isRead: true } },
    { new: true },
  );
  if (!notification) throw new ApiError(404, "Notification not found.");
  respond(res, notification);
}

export async function markAllRead(req, res) {
  const result = await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { $set: { isRead: true } },
  );
  respond(res, { updatedCount: result.modifiedCount });
}
