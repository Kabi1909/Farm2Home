import PriceHistory from "../models/PriceHistory.js";
import { currentPrices } from "../services/priceHistoryService.js";
import { escapeRegex, listPage, pagination } from "../utils/pagination.js";

function filters(query, productField) {
  return {
    ...(query.product && {
      [productField]: new RegExp(`^${escapeRegex(query.product)}$`, "i"),
    }),
    ...(query.district && { district: query.district }),
    ...(query.unit && { unit: query.unit }),
  };
}

export async function recent(req, res) {
  const query = req.validated.query;
  const prices = await currentPrices(filters(query, "name"));
  const start = (query.page - 1) * query.limit;
  res.json({
    success: true,
    data: prices.slice(start, start + query.limit),
    pagination: pagination(query.page, query.limit, prices.length),
    source: "Farm2Home active listing prices",
    currency: "LKR",
    asOf: new Date(),
  });
}

export async function trends(req, res) {
  const query = req.validated.query;
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - query.period + 1);
  since.setUTCHours(0, 0, 0, 0);
  const result = await listPage(
    PriceHistory,
    {
      ...filters(query, "productName"),
      date: { $gte: since },
    },
    query,
    { date: -1, productName: 1, district: 1, _id: 1 },
  );
  res.json({
    success: true,
    ...result,
    currency: "LKR",
    source: "Farm2Home historical listing snapshots",
  });
}
