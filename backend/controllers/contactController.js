import { sendContactEmail } from "../services/emailService.js";
import { respond } from "../utils/asyncHandler.js";

export async function sendContactMessage(req, res) {
  await sendContactEmail(
    req.validated.body,
    req.app.locals.config,
    req.app.locals.contactMailTransport,
  );
  respond(res, null, "Your message has been sent successfully.");
}
