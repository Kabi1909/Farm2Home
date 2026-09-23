import Product from "../models/Product.js";
import PriceHistory from "../models/PriceHistory.js";

// Listing prices are indicative asking prices, not official market quotations.
export async function currentPrices(filter = {}) {
  return Product.aggregate([
    {
      $match: {
        isActive: true,
        isDeleted: false,
        quantity: { $gt: 0 },
        ...filter,
      },
    },
    {
      $group: {
        _id: {
          name: { $toLower: "$name" },
          district: "$district",
          unit: "$unit",
        },
        category: { $first: "$category" },
        averagePrice: { $avg: "$price" },
        minimumPrice: { $min: "$price" },
        maximumPrice: { $max: "$price" },
        sampleCount: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        productName: "$_id.name",
        district: "$_id.district",
        unit: "$_id.unit",
        category: 1,
        averagePrice: { $round: ["$averagePrice", 2] },
        minimumPrice: 1,
        maximumPrice: 1,
        sampleCount: 1,
      },
    },
    { $sort: { productName: 1, district: 1, unit: 1 } },
  ]);
}

export async function recordMarketPrices(now = new Date()) {
  const date = new Date(`${now.toISOString().slice(0, 10)}T00:00:00.000Z`);
  const prices = await currentPrices();
  if (!prices.length) return 0;
  await PriceHistory.bulkWrite(
    prices.map((price) => ({
      updateOne: {
        filter: {
          productName: price.productName,
          district: price.district,
          unit: price.unit,
          date,
        },
        update: {
          $set: { ...price, date, source: "Farm2Home listing prices" },
        },
        upsert: true,
      },
    })),
  );
  return prices.length;
}
