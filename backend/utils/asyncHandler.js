export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);
export const respond = (res, data, message = "Success", status = 200) =>
  res.status(status).json({ success: true, message, data });
