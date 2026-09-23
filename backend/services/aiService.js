import axios from "axios";
import { z } from "zod";
import ApiError from "../utils/ApiError.js";
import { currentPrices } from "./priceHistoryService.js";
import { escapeRegex } from "../utils/pagination.js";

const price = z.number().finite().positive().max(10000000);
const predictionSchema = z
  .object({
    recommendedPrice: price,
    minimumPrice: price,
    maximumPrice: price,
    confidence: z.enum(["Low", "Medium", "High"]),
  })
  .refine(
    (value) =>
      value.minimumPrice <= value.recommendedPrice &&
      value.recommendedPrice <= value.maximumPrice,
    "Invalid prediction range.",
  );

export const unavailableMessage =
  "Price suggestion is temporarily unavailable. You can still enter your own price.";

export async function suggestPrice(input, config) {
  let prediction;
  try {
    const endpoint = new URL(
      "predict-price",
      `${config.AI_SERVICE_URL.replace(/\/$/, "")}/`,
    );
    const response = await axios.post(endpoint.href, input, {
      timeout: config.AI_SERVICE_TIMEOUT_MS,
      maxRedirects: 0,
      maxContentLength: 16384,
      maxBodyLength: 16384,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    prediction = predictionSchema.parse(response.data);
  } catch {
    const error = new ApiError(503, unavailableMessage);
    error.publicMessage = unavailableMessage;
    throw error;
  }

  const [comparison] = await currentPrices({
    name: new RegExp(`^${escapeRegex(input.product)}$`, "i"),
    category: input.category,
    district: input.district,
    unit: input.unit,
  });
  return {
    ...prediction,
    currency: "LKR",
    unit: input.unit,
    generatedAt: new Date(),
    source: "External price prediction service",
    marketComparison: comparison || null,
    advisory:
      "An estimate, not a guaranteed selling price. Review local demand and costs before applying it.",
    marketNote: comparison
      ? `Based on ${comparison.sampleCount} matching Farm2Home listing(s); these are asking prices, not completed sales.`
      : "No matching local listings are available for comparison.",
  };
}
