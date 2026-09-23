import "dotenv/config";
import { z } from "zod";
const schema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  MONGO_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/)
    .default("7d"),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  AI_SERVICE_URL: z.string().url().default("http://localhost:8000"),
  AI_SERVICE_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(100)
    .max(30000)
    .default(5000),
  DELIVERY_CHARGE: z.coerce.number().min(0).max(10000).default(250),
  LOW_STOCK_THRESHOLD: z.coerce.number().int().min(0).max(1000000).default(5),
  CLOUDINARY_CLOUD_NAME: z.string().default(""),
  CLOUDINARY_API_KEY: z.string().default(""),
  CLOUDINARY_API_SECRET: z.string().default(""),
});
export function loadConfig(values = process.env) {
  const result = schema.safeParse(values);
  if (!result.success)
    throw new Error(
      `Invalid configuration: ${result.error.issues.map((issue) => issue.path.join(".")).join(", ")}`,
    );
  const config = result.data;
  if (!["http:", "https:"].includes(new URL(config.AI_SERVICE_URL).protocol))
    throw new Error("AI service must use HTTP(S).");
  return config;
}
