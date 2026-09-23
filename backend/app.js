import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import mongoose from "mongoose";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import { notFoundMiddleware } from "./middleware/notFoundMiddleware.js";
export function createApp(config, routes) {
  const app = express();
  app.locals.config = config;
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: config.FRONTEND_URL,
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
    }),
  );
  app.use(express.json({ limit: "256kb" }));
  app.use(
    "/api",
    rateLimit({
      windowMs: 60000,
      limit: 180,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      message: {
        success: false,
        message: "Too many requests. Try again shortly.",
        errors: [],
      },
    }),
  );
  if (config.NODE_ENV === "development")
    app.use(
      morgan(":method :url :status :response-time ms", {
        skip: (req) => req.path.startsWith("/api/auth"),
      }),
    );
  app.get("/api/health", (req, res) =>
    res
      .status(mongoose.connection.readyState === 1 ? 200 : 503)
      .json({
        success: mongoose.connection.readyState === 1,
        service: "Farm2Home LK API",
        status:
          mongoose.connection.readyState === 1 ? "healthy" : "unavailable",
      }),
  );
  if (routes) app.use("/api", routes);
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);
  return app;
}
