import mongoose from "mongoose";
import User from "../models/User.js";
import FarmerProfile from "../models/FarmerProfile.js";
import CustomerProfile from "../models/CustomerProfile.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import Wishlist from "../models/Wishlist.js";
import Order from "../models/Order.js";
import Review from "../models/Review.js";
import Notification from "../models/Notification.js";
import PriceHistory from "../models/PriceHistory.js";
import { calculateLine } from "../services/pricingService.js";
import { orderSteps } from "../utils/constants.js";
import { registration } from "../validation/schemas.js";

const farms = [
  ["Sunshine Farms", "Vavuniya"],
  ["Green Valley", "Kandy"],
  ["Nature's Harvest", "Anuradhapura"],
  ["Fresh Fields", "Matale"],
  ["Eco Grow", "Galle"],
  ["Hill Country Organics", "Nuwara Eliya"],
  ["Ceylon Spice Garden", "Matara"],
  ["Local Roots", "Kurunegala"],
  ["Eastern Harvest", "Batticaloa"],
  ["Jaffna Family Farm", "Jaffna"],
];
const produce = [
  ["Fresh Tomatoes", "Vegetables", 340],
  ["Carrots", "Vegetables", 280],
  ["King Bananas", "Fruits", 160],
  ["White Rice", "Rice & Grains", 220],
  ["Cinnamon Sticks", "Spices", 1200],
  ["Fresh Coconuts", "Coconut Products", 120],
  ["Green Chillies", "Vegetables", 380],
  ["Red Onions", "Vegetables", 300],
  ["Potatoes", "Vegetables", 260],
  ["Brinjal", "Vegetables", 220],
  ["Green Beans", "Vegetables", 320],
  ["Cabbage", "Vegetables", 180],
  ["Pumpkin", "Vegetables", 140],
  ["Mango", "Fruits", 260],
  ["Papaya", "Fruits", 180],
  ["Pineapple", "Fruits", 240],
  ["Green Gram", "Pulses", 680],
  ["Black Pepper", "Spices", 1800],
];

export async function seedData({ NODE_ENV, SEED_PASSWORD }) {
  if (!["development", "test"].includes(NODE_ENV))
    throw new Error("Seeding is limited to development and test.");
  const passwordCheck = registration.safeParse({
    name: "Seed",
    email: "seed@example.test",
    phone: "0771234567",
    role: "customer",
    password: SEED_PASSWORD,
    confirmPassword: SEED_PASSWORD,
  });
  if (!passwordCheck.success) {
    throw new Error(
      "Set a SEED_PASSWORD that satisfies the registration password rules.",
    );
  }
  // Never erase or merge over an existing database.
  for (const Model of Object.values(mongoose.models)) {
    if (await Model.exists({}))
      throw new Error(
        "Seed requires an empty database; existing records were not changed.",
      );
  }
  return mongoose.connection.transaction(async (session) => {
    const farmers = [];
    const customers = [];
    const products = [];
    for (let index = 0; index < 30; index += 1) {
      const isFarmer = index < 10;
      const number = isFarmer ? index + 1 : index - 9;
      const role = isFarmer ? "farmer" : "customer";
      const [user] = await User.create(
        [
          {
            name: isFarmer
              ? `${farms[index][0]} Grower`
              : `Demo Customer ${number}`,
            email: `${role}${number}@farm2home.example`,
            phone: `077${String(index + 1).padStart(7, "0")}`,
            role,
            password: SEED_PASSWORD,
          },
        ],
        { session, ordered: true },
      );
      if (isFarmer) {
        farmers.push(user);
        await FarmerProfile.create(
          [
            {
              user: user._id,
              farmName: farms[index][0],
              district: farms[index][1],
              city: farms[index][1],
              description:
                "Fictional Sri Lankan family farm for local development.",
              farmingMethods: ["Organic"],
              mainCrops: ["Vegetables", "Fruits"],
              deliveryAvailable: true,
              pickupAvailable: true,
              publicLocation: false,
            },
          ],
          { session, ordered: true },
        );
      } else {
        customers.push(user);
        await CustomerProfile.create(
          [{ user: user._id, district: "Colombo", city: "Colombo" }],
          { session, ordered: true },
        );
        await Cart.create([{ customer: user._id }], { session });
        await Wishlist.create([{ customer: user._id }], { session });
      }
    }
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    for (let index = 0; index < 40; index += 1) {
      const farmerIndex = Math.floor(index / 4);
      const [name, category, price] = produce[index % produce.length];
      const upcoming = index % 4 === 3 && farmerIndex % 2 === 0;
      const date = new Date(today.getTime() + (upcoming ? 7 : -2) * 86400000);
      const [product] = await Product.create(
        [
          {
            farmer: farmers[farmerIndex]._id,
            name,
            category,
            price,
            bulkPrice: Math.round(price * 0.9),
            minimumBulkQuantity: 20,
            description:
              "Fictional demo listing. Fresh produce from a local family farm.",
            quantity: 200,
            unit: category === "Coconut Products" ? "piece" : "kg",
            quality: "Grade A",
            farmingMethod: "Organic",
            district: farms[farmerIndex][1],
            city: farms[farmerIndex][1],
            harvestDate: date,
            availableDate: date,
            isPreOrder: upcoming,
            availabilityStatus: upcoming ? "Upcoming Harvest" : "Available",
            deliveryAvailable: true,
            pickupAvailable: true,
          },
        ],
        { session, ordered: true },
      );
      products.push(product);
    }
    for (let index = 0; index < 25; index += 1) {
      const farmer = farmers[index % 10];
      const customer = customers[index % 20];
      const selected = products.slice((index % 10) * 4, (index % 10) * 4 + 2);
      const completed = index < 20;
      const items = selected.map((product) => ({
        product: product._id,
        productName: product.name,
        category: product.category,
        unit: product.unit,
        ...calculateLine(product, 2),
        isPreOrder: false,
        availableDate: product.availableDate,
      }));
      const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
      const [order] = await Order.create(
        [
          {
            orderNumber: `DEMO-${String(index + 1).padStart(4, "0")}`,
            checkoutGroupId: `demo-group-${index}`,
            checkoutKey: `demo-checkout-${index}`,
            customer: customer._id,
            farmer: farmer._id,
            items,
            subtotal,
            deliveryCharge: 0,
            total: subtotal,
            fulfillmentMethod: "pickup",
            paymentMethod: "pay_on_pickup",
            pickupDetails:
              "Demo pickup location; coordinate with the fictional farmer.",
            status: completed ? "Completed" : "Pending",
            paymentStatus: completed ? "paid" : "pending",
            statusHistory: (completed ? orderSteps("pickup") : ["Pending"]).map(
              (status) => ({
                status,
                changedAt: new Date(),
                changedBy: status === "Pending" ? customer._id : farmer._id,
              }),
            ),
          },
        ],
        { session, ordered: true },
      );
      for (const product of selected) {
        product.quantity -= 2;
        product.orderCount += 1;
        await product.save({ session });
        if (index < 15)
          await Review.create(
            [
              {
                customer: customer._id,
                farmer: farmer._id,
                product: product._id,
                order: order._id,
                rating: index % 2 ? 4 : 5,
                comment: "Demo review: fresh produce and friendly pickup.",
              },
            ],
            { session, ordered: true },
          );
      }
      await Notification.create(
        [
          {
            user: farmer._id,
            type: "new_order",
            title: `Demo order ${order.orderNumber}`,
            message: "Fictional order notification for development.",
            relatedOrder: order._id,
          },
        ],
        { session, ordered: true },
      );
    }
    for (const product of products) {
      const reviews = await Review.find({ product: product._id }).session(
        session,
      );
      product.reviewCount = reviews.length;
      product.averageRating = reviews.length
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        : 0;
      await product.save({ session });
      await PriceHistory.create(
        Array.from({ length: 7 }, (_, day) => ({
          productName: product.name.toLowerCase(),
          category: product.category,
          district: product.district,
          unit: product.unit,
          averagePrice: product.price,
          minimumPrice: product.price,
          maximumPrice: product.price,
          sampleCount: 1,
          date: new Date(today.getTime() - day * 86400000),
          source: "Fictional development seed; not observed market data",
        })),
        { session, ordered: true },
      );
    }
    for (const farmer of farmers) {
      const reviews = await Review.find({ farmer: farmer._id }).session(
        session,
      );
      await FarmerProfile.updateOne(
        { user: farmer._id },
        {
          $set: {
            totalReviews: reviews.length,
            averageRating: reviews.length
              ? reviews.reduce((sum, review) => sum + review.rating, 0) /
                reviews.length
              : 0,
            completedOrders: await Order.countDocuments({
              farmer: farmer._id,
              status: "Completed",
            }).session(session),
          },
        },
        { session, ordered: true },
      );
    }
    return {
      farmers: 10,
      customers: 20,
      products: 40,
      orders: 25,
      reviews: 30,
      notifications: 25,
      priceHistory: 280,
    };
  });
}
