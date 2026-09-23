import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { roundMoney } from "./pricingService.js";

const month = {
  $dateToString: {
    format: "%Y-%m",
    date: "$createdAt",
    timezone: "Asia/Colombo",
  },
};

export async function farmerAnalytics(farmer) {
  const [orders, inventory] = await Promise.all([
    Order.aggregate([
      { $match: { farmer } },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                orders: { $sum: 1 },
                completedOrders: {
                  $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
                },
                revenue: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "Completed"] }, "$subtotal", 0],
                  },
                },
              },
            },
          ],
          monthlyRevenue: [
            { $match: { status: "Completed" } },
            { $group: { _id: month, revenue: { $sum: "$subtotal" } } },
            { $sort: { _id: -1 } },
            { $limit: 12 },
            { $sort: { _id: 1 } },
            {
              $project: {
                _id: 0,
                month: "$_id",
                revenue: { $round: ["$revenue", 2] },
              },
            },
          ],
          monthlyOrders: [
            { $group: { _id: month, orders: { $sum: 1 } } },
            { $sort: { _id: -1 } },
            { $limit: 12 },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, month: "$_id", orders: 1 } },
          ],
          salesByCategory: [
            { $match: { status: "Completed" } },
            { $unwind: "$items" },
            {
              $group: {
                _id: "$items.category",
                revenue: { $sum: "$items.lineTotal" },
              },
            },
            { $sort: { revenue: -1 } },
            {
              $project: {
                _id: 0,
                category: "$_id",
                revenue: { $round: ["$revenue", 2] },
              },
            },
          ],
          units: [
            { $match: { status: "Completed" } },
            { $unwind: "$items" },
            {
              $group: {
                _id: "$items.unit",
                quantity: { $sum: "$items.quantity" },
              },
            },
            { $project: { _id: 0, unit: "$_id", quantity: 1 } },
          ],
          bestSellingProducts: [
            { $match: { status: "Completed" } },
            { $unwind: "$items" },
            {
              $group: {
                _id: "$items.product",
                name: { $last: "$items.productName" },
                unit: { $last: "$items.unit" },
                quantity: { $sum: "$items.quantity" },
                revenue: { $sum: "$items.lineTotal" },
              },
            },
            { $sort: { revenue: -1 } },
            { $limit: 10 },
            {
              $project: {
                _id: 0,
                productId: "$_id",
                name: 1,
                unit: 1,
                quantity: 1,
                revenue: { $round: ["$revenue", 2] },
              },
            },
          ],
        },
      },
    ]),
    Product.aggregate([
      { $match: { farmer, isDeleted: false, isActive: true } },
      {
        $group: {
          _id: null,
          activeProducts: { $sum: 1 },
          upcomingHarvests: { $sum: { $cond: ["$isPreOrder", 1, 0] } },
          lowStockProducts: {
            $sum: {
              $cond: [{ $eq: ["$availabilityStatus", "Low Stock"] }, 1, 0],
            },
          },
        },
      },
    ]),
  ]);
  const data = orders[0];
  const totals = data.totals[0] || {
    revenue: 0,
    orders: 0,
    completedOrders: 0,
  };
  const stock = inventory[0] || {
    activeProducts: 0,
    upcomingHarvests: 0,
    lowStockProducts: 0,
  };
  delete totals._id;
  delete stock._id;
  return {
    summary: {
      ...totals,
      ...stock,
      revenue: roundMoney(totals.revenue),
      unitsSold: data.units.reduce((sum, item) => sum + item.quantity, 0),
      averageOrderValue: totals.completedOrders
        ? roundMoney(totals.revenue / totals.completedOrders)
        : 0,
    },
    unitsSoldByUnit: data.units,
    monthlyRevenue: data.monthlyRevenue,
    monthlyOrders: data.monthlyOrders,
    salesByCategory: data.salesByCategory,
    bestSellingProducts: data.bestSellingProducts,
    currency: "LKR",
    revenueBasis:
      "Completed order merchandise subtotals, excluding delivery charges",
  };
}
