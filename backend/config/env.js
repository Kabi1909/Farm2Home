import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { z } from "zod";
dotenv.config({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
  quiet: true,
});
const schema = z.object({
  DEV_LOCAL_DB: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
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
    throw Object.assign(
      new Error(
        `Invalid backend/.env configuration: ${result.error.issues.map((issue) => `${issue.path.join(".")} (${issue.message})`).join(", ")}. Run npm run dev to create a missing development configuration, or edit the existing .env.`,
      ),
      { code: "CONFIG_INVALID" },
    );
  const config = result.data;
  if (!["http:", "https:"].includes(new URL(config.AI_SERVICE_URL).protocol))
    throw Object.assign(new Error("AI_SERVICE_URL must use HTTP(S)."), {
      code: "CONFIG_INVALID",
    });
  return config;
}
