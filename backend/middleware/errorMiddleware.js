export function errorMiddleware(error, req, res, next) {
  if (res.headersSent) return next(error);
  let status = error.status || 500;
  let message =
    status < 500 ? error.message : "The request could not be completed.";
  if (error.code === 11000) {
    status = 409;
    message = "This record already exists.";
  }
  if (["ValidationError", "CastError", "VersionError"].includes(error.name)) {
    status = error.name === "VersionError" ? 409 : 400;
    message = "Invalid or outdated request data.";
  }
  if (error.name === "MulterError") {
    status = 400;
    message = "Upload exceeds the allowed file size or count.";
  }
  if (error.type === "entity.parse.failed") {
    status = 400;
    message = "Malformed JSON.";
  }
  if (error.publicMessage) message = error.publicMessage;
  res.status(status).json({
    success: false,
    message,
    errors: status < 500 && Array.isArray(error.errors) ? error.errors : [],
  });
}
