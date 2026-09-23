import Product from "../models/Product.js";
import ApiError from "../utils/ApiError.js";
import { escapeRegex } from "../utils/pagination.js";
import { roundMoney } from "./pricingService.js";

// Name normalization merges spelling/plural forms, never different varieties.
const plurals = {
  tomatoes: "tomato",
  potatoes: "potato",
  carrots: "carrot",
  bananas: "banana",
  coconuts: "coconut",
  onions: "onion",
  chillies: "chilli",
};
export function productKey(name) {
  return name
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word && !["fresh", "organic", "local"].includes(word))
    .map((word) => plurals[word] || word)
    .join(" ");
}

// Instance-based regression: fit to the current observations on each request.
// Log prices and inverse-distance weights reduce the influence of extreme prices.
// No synthetic training rows, category-wide substitutions or hard-coded prices.
export function predictFromListings(input, listings, now = new Date()) {
  const key = productKey(input.product);
  const candidates = listings.filter(
    (row) =>
      key &&
      productKey(row.name) === key &&
      row.category === input.category &&
      row.unit === input.unit &&
      row.isActive &&
      !row.isDeleted &&
      row.quantity > 0 &&
      row.availabilityStatus !== "Sold Out" &&
      Number.isFinite(row.price) &&
      row.price >= 0.01 &&
      row.price <= 10000000,
  );
  const ranked = candidates
    .map((row) => {
      const month = new Date(row.harvestDate).getUTCMonth() + 1;
      const monthGap = Number.isFinite(month)
        ? Math.abs(month - input.month)
        : 6;
      const age = Math.max(
        0,
        (now - new Date(row.updatedAt || row.harvestDate)) / 86400000,
      );
      const distance =
        (row.district === input.district ? 0 : 2) +
        (row.quality === input.quality ? 0 : 1) +
        Math.min(monthGap, 12 - monthGap) / 6 +
        Math.min(
          2,
          Math.abs(Math.log((row.quantity + 1) / (input.quantity + 1))),
        ) +
        Math.min(2, Number.isFinite(age) ? age / 90 : 2);
      return { row, distance, weight: 1 / (0.25 + distance) };
    })
    .sort(
      (a, b) =>
        a.distance - b.distance ||
        String(a.row._id).localeCompare(String(b.row._id)),
    );
  // One observation per grower prevents duplicate listings inflating confidence.
  const growers = new Set();
  const neighbours = ranked
    .filter(({ row }) => {
      const grower = String(row.farmer);
      if (growers.has(grower)) return false;
      growers.add(grower);
      return true;
    })
    .slice(0, 7);
  if (!neighbours.length) {
    throw new ApiError(
      422,
      `No comparable ${input.product} prices are available in ${input.unit}. Publish an initial listing with your own researched price, or connect a trained external price service. The advisor cannot estimate a price without reference data.`,
    );
  }
  const totalWeight = neighbours.reduce((sum, value) => sum + value.weight, 0);
  const predicted = Math.exp(
    neighbours.reduce(
      (sum, { row, weight }) => sum + Math.log(row.price) * weight,
      0,
    ) / totalWeight,
  );
  const prices = neighbours.map(({ row }) => row.price);
  const localCount = neighbours.filter(
    ({ row }) => row.district === input.district,
  ).length;
  return {
    recommendedPrice: roundMoney(predicted),
    minimumPrice: roundMoney(Math.min(...prices)),
    maximumPrice: roundMoney(Math.max(...prices)),
    confidence: neighbours.length >= 5 && localCount >= 3 ? "Medium" : "Low",
    source: "Farm2Home marketplace regression model",
    model: {
      name: "Weighted k-nearest-neighbours regression",
      version: "1.0",
      sampleCount: neighbours.length,
      localSampleCount: localCount,
    },
    marketNote: `Estimated from ${neighbours.length} comparable listing(s) from distinct farmers; ${localCount} in ${input.district}. The range shows observed asking prices, not a prediction interval. Confidence describes data coverage, not validated forecast accuracy.`,
  };
}

export async function marketplacePrediction(input) {
  const key = productKey(input.product);
  // Prefix matching in MongoDB narrows candidates; exact normalized matching above
  // prevents e.g. cherry tomatoes from silently becoming ordinary tomatoes.
  const search = key.split(" ").filter(Boolean).map(escapeRegex).join(".*");
  const listings = await Product.find({
    name: new RegExp(search || "^$", "i"),
    category: input.category,
    unit: input.unit,
    isActive: true,
    isDeleted: false,
    quantity: { $gt: 0 },
    availabilityStatus: { $ne: "Sold Out" },
  })
    .select(
      "name category unit farmer price quality quantity district harvestDate updatedAt isActive isDeleted availabilityStatus",
    )
    .sort({ updatedAt: -1, _id: 1 })
    .limit(1000)
    .lean();
  return predictFromListings(input, listings);
}
