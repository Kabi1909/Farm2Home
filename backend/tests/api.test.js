import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import routes from "../routes/index.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Notification from "../models/Notification.js";
import UploadAsset from "../models/UploadAsset.js";
import Review from "../models/Review.js";
import { seedData } from "../seeds/seedData.js";
import { recordMarketPrices } from "../services/priceHistoryService.js";
import { processCleanup } from "../services/cloudinaryService.js";
import { cloudAdapter } from "../services/cloudinaryService.js";
import axios from "axios";
import { createMarketplaceApi } from "../../frontend/src/services/marketplaceApi.js";
import {
  allPages,
  productView,
  productPayload,
  userView,
  orderView,
  reviewView,
} from "../../frontend/src/services/adapters.js";

let database;
let upstream;
let predictionMode = "valid";
let receivedPrediction;
const config = {
  NODE_ENV: "test",
  FRONTEND_URL: "http://localhost:5173",
  JWT_SECRET: "isolated-test-secret-not-for-production-12345",
  JWT_EXPIRES_IN: "1h",
  AI_SERVICE_TIMEOUT_MS: 150,
  AI_PRICE_PROVIDER: "external",
  DELIVERY_CHARGE: 250,
  LOW_STOCK_THRESHOLD: 5,
};
const app = createApp(config, routes);
const api = request(app);
const password = "Development123!";
let farmer;
let otherFarmer;
let customer;
let otherCustomer;
const pickup = { fulfillmentMethod: "pickup", paymentMethod: "pay_on_pickup" };
const auth = (account) => ({ Authorization: `Bearer ${account.token}` });
const bodyOf = (response, status = 200) => {
  assert.equal(response.status, status, JSON.stringify(response.body));
  return response.body.data;
};

async function register(role, name) {
  return bodyOf(
    await api.post("/api/auth/register").send({
      name,
      email: `${name}@example.test`,
      phone: "0771234567",
      role,
      password,
      confirmPassword: password,
    }),
    201,
  );
}

async function product(owner = farmer, changes = {}) {
  return bodyOf(
    await api
      .post("/api/products")
      .set(auth(owner))
      .send({
        name: "Fresh Tomatoes",
        category: "Vegetables",
        description: "Fresh locally grown tomatoes.",
        farmingMethod: "Organic",
        quality: "Grade A",
        harvestDate: "2026-01-01",
        availableDate: "2026-01-02",
        quantity: 100,
        unit: "kg",
        price: 350,
        bulkPrice: 310,
        minimumBulkQuantity: 20,
        district: "Vavuniya",
        city: "Vavuniya",
        deliveryAvailable: true,
        pickupAvailable: true,
        location: { latitude: 8.7, longitude: 80.5, isPublic: false },
        ...changes,
      }),
    201,
  );
}

before(
  async () => {
    database = await MongoMemoryReplSet.create({
      binary: {
        downloadDir: fileURLToPath(
          new URL("../node_modules/.cache/mongodb-binaries", import.meta.url),
        ),
      },
      replSet: { count: 1, storageEngine: "wiredTiger" },
    });
    await mongoose.connect(database.getUri(), {
      dbName: "farm2home_isolated_test",
    });
    await Promise.all(
      Object.values(mongoose.models).map((model) => model.init()),
    );
    upstream = createServer(async (req, res) => {
      let payload = "";
      for await (const chunk of req) payload += chunk;
      receivedPrediction = JSON.parse(payload);
      if (predictionMode === "timeout") return;
      if (predictionMode === "redirect") {
        res.writeHead(302, { Location: "http://127.0.0.1:1/forbidden" });
        res.end();
        return;
      }
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify(
          predictionMode === "valid"
            ? {
                recommendedPrice: 340,
                minimumPrice: 320,
                maximumPrice: 360,
                confidence: "Medium",
                secret: "must-not-leak",
              }
            : {
                recommendedPrice: 500,
                minimumPrice: 700,
                maximumPrice: 100,
                confidence: "High",
              },
        ),
      );
    }).listen(0, "127.0.0.1");
    await once(upstream, "listening");
    config.AI_SERVICE_URL = `http://127.0.0.1:${upstream.address().port}`;
  },
  { timeout: 600000 },
);

after(async () => {
  upstream?.closeAllConnections();
  if (upstream) await new Promise((resolve) => upstream.close(resolve));
  await mongoose.disconnect();
  await database?.stop();
});

test(
  "seed is internally consistent, hashes passwords and refuses a populated database",
  { timeout: 60000 },
  async () => {
    const counts = await seedData({
      NODE_ENV: "test",
      SEED_PASSWORD: password,
    });
    assert.equal(counts.products, 40);
    assert.equal(await Review.countDocuments(), 30);
    assert.equal(await Order.countDocuments(), 25);
    const seeded = await User.findOne({ role: "farmer" }).select("+password");
    assert.notEqual(seeded.password, password);
    assert.equal(await seeded.comparePassword(password), true);
    await assert.rejects(
      seedData({ NODE_ENV: "test", SEED_PASSWORD: password }),
      /empty database/,
    );
    // Only the disposable replica set created by this test is cleared.
    for (const model of Object.values(mongoose.models))
      await model.deleteMany({});
  },
);

test("registration, authentication and role enforcement", async () => {
  farmer = await register("farmer", "farmer-one");
  otherFarmer = await register("farmer", "farmer-two");
  customer = await register("customer", "customer-one");
  otherCustomer = await register("customer", "customer-two");
  assert.equal(farmer.user.password, undefined);
  bodyOf(
    await api
      .post("/api/auth/login")
      .send({ email: "farmer-one@example.test", password }),
  );
  assert.equal(
    (
      await api
        .post("/api/auth/login")
        .send({ email: "farmer-one@example.test", password: "wrong" })
    ).status,
    401,
  );
  assert.equal((await api.get("/api/cart")).status, 401);
  assert.equal((await api.get("/api/cart").set(auth(farmer))).status, 403);
  assert.equal(
    (
      await api
        .put("/api/customer/profile")
        .set(auth(customer))
        .send({ role: "farmer" })
    ).status,
    400,
  );
  assert.equal((await api.get("/api/unknown")).status, 404);
  assert.equal((await api.get("/api/health")).status, 200);
});

test("products protect ownership, uploaded assets, coordinates and derived fields", async () => {
  const item = await product();
  assert.equal(
    (
      await api
        .put(`/api/products/${item.id}`)
        .set(auth(otherFarmer))
        .send({ price: 1 })
    ).status,
    403,
  );
  assert.equal(
    (await api.delete(`/api/products/${item.id}`).set(auth(otherFarmer)))
      .status,
    403,
  );
  assert.equal(
    (
      await api
        .put(`/api/products/${item.id}`)
        .set(auth(farmer))
        .send({ averageRating: 5 })
    ).status,
    400,
  );
  assert.equal(
    (
      await api
        .put(`/api/products/${item.id}`)
        .set(auth(farmer))
        .send({ images: [{ publicId: "another-users-image" }] })
    ).status,
    403,
  );
  assert.equal((await api.get("/api/products/not-an-id")).status, 400);
  assert.equal(
    bodyOf(await api.get(`/api/products/${item.id}`)).location,
    undefined,
  );
  const filtered = await api.get(
    "/api/products?category=Vegetables&district=Vavuniya&sort=price_asc&limit=1",
  );
  assert.equal(filtered.status, 200);
  assert.equal(filtered.body.data.length, 1);
  assert.equal(filtered.body.pagination.limit, 1);
  assert.equal((await api.get("/api/products?sort=__proto__")).status, 400);
});

test("multi-farmer checkout applies bulk pricing, snapshots totals and supports retries", async () => {
  const first = await product();
  const second = await product(otherFarmer);
  bodyOf(
    await api
      .post("/api/cart")
      .set(auth(customer))
      .send({ productId: first.id, quantity: 20 }),
  );
  bodyOf(
    await api
      .post("/api/cart")
      .set(auth(customer))
      .send({ productId: second.id, quantity: 2 }),
  );
  const created = bodyOf(
    await api
      .post("/api/orders")
      .set(auth(customer))
      .set("Idempotency-Key", "checkout-transaction-1")
      .send(pickup),
    201,
  );
  assert.equal(created.length, 2);
  assert.equal(
    created.find((order) => order.farmer === farmer.user.id).total,
    6200,
  );
  assert.equal(created[0].paymentStatus, "pending");
  assert.equal((await Product.findById(first.id)).quantity, 80);
  assert.equal(
    (await Cart.findOne({ customer: customer.user.id })).items.length,
    0,
  );
  const retry = bodyOf(
    await api
      .post("/api/orders")
      .set(auth(customer))
      .set("Idempotency-Key", "checkout-transaction-1")
      .send(pickup),
    201,
  );
  assert.equal(retry.length, 2);
  assert.equal((await Product.findById(first.id)).quantity, 80);
  assert.equal(
    (await api.get(`/api/orders/${created[0].id}`).set(auth(otherCustomer)))
      .status,
    403,
  );
  assert.equal(
    (
      await api
        .post("/api/orders")
        .set(auth(customer))
        .send({ ...pickup, total: 1 })
    ).status,
    400,
  );
});

test("late checkout failures roll back stock and retain the entire cart", async () => {
  const first = await product();
  const second = await product(otherFarmer, { pickupAvailable: false });
  await api
    .post("/api/cart")
    .set(auth(customer))
    .send({ productId: first.id, quantity: 2 });
  await api
    .post("/api/cart")
    .set(auth(customer))
    .send({ productId: second.id, quantity: 2 });
  assert.equal(
    (await api.post("/api/orders").set(auth(customer)).send(pickup)).status,
    400,
  );
  assert.equal((await Product.findById(first.id)).quantity, 100);
  assert.equal(
    (await Cart.findOne({ customer: customer.user.id })).items.length,
    2,
  );
  await api.delete("/api/cart").set(auth(customer));
});

test("concurrent customers cannot oversell and cancellation restores stock exactly once", async () => {
  const item = await product(farmer, { quantity: 5 });
  for (const account of [customer, otherCustomer])
    await api
      .post("/api/cart")
      .set(auth(account))
      .send({ productId: item.id, quantity: 5 });
  const results = await Promise.all(
    [customer, otherCustomer].map((account) =>
      api.post("/api/orders").set(auth(account)).send(pickup),
    ),
  );
  assert.deepEqual(results.map((result) => result.status).sort(), [201, 409]);
  assert.equal((await Product.findById(item.id)).quantity, 0);
  const winner = results[0].status === 201 ? customer : otherCustomer;
  const order = results.find((result) => result.status === 201).body.data[0];
  bodyOf(await api.put(`/api/orders/${order.id}/cancel`).set(auth(winner)));
  assert.equal(
    (await api.put(`/api/orders/${order.id}/cancel`).set(auth(winner))).status,
    409,
  );
  assert.equal((await Product.findById(item.id)).quantity, 5);
  for (const account of [customer, otherCustomer])
    await api.delete("/api/cart").set(auth(account));
});

test("order transitions, reviews and analytics only accept eligible owned activity", async () => {
  const item = await product();
  await api
    .post("/api/cart")
    .set(auth(customer))
    .send({ productId: item.id, quantity: 2 });
  const [order] = bodyOf(
    await api.post("/api/orders").set(auth(customer)).send(pickup),
    201,
  );
  const review = {
    orderId: order.id,
    productId: item.id,
    rating: 5,
    comment: "Fresh and carefully packed.",
  };
  assert.equal(
    (await api.post("/api/reviews").set(auth(customer)).send(review)).status,
    403,
  );
  assert.equal(
    (
      await api
        .put(`/api/orders/${order.id}/status`)
        .set(auth(farmer))
        .send({ status: "Completed" })
    ).status,
    409,
  );
  assert.equal(
    (
      await api
        .put(`/api/orders/${order.id}/status`)
        .set(auth(otherFarmer))
        .send({ status: "Confirmed" })
    ).status,
    403,
  );
  for (const status of [
    "Confirmed",
    "Preparing",
    "Ready for Pickup",
    "Completed",
  ]) {
    bodyOf(
      await api
        .put(`/api/orders/${order.id}/status`)
        .set(auth(farmer))
        .send({ status }),
    );
  }
  assert.equal(
    (await api.post("/api/reviews").set(auth(otherCustomer)).send(review))
      .status,
    403,
  );
  bodyOf(await api.post("/api/reviews").set(auth(customer)).send(review), 201);
  assert.equal(
    (await api.post("/api/reviews").set(auth(customer)).send(review)).status,
    409,
  );
  const reviews = bodyOf(await api.get(`/api/reviews/product/${item.id}`));
  assert.equal(reviews[0].verifiedPurchase, true);
  assert.equal(reviews[0].order, undefined);
  assert.equal((await Product.findById(item.id)).averageRating, 5);
  const analytics = bodyOf(
    await api.get("/api/farmer/analytics").set(auth(farmer)),
  );
  assert.equal(analytics.summary.revenue, 700);
  assert.equal(analytics.summary.completedOrders, 1);
  assert.equal(
    (
      await api
        .get(`/api/farmer/analytics?farmerId=${farmer.user.id}`)
        .set(auth(otherFarmer))
    ).status,
    400,
  );
});

test("retry keys cannot be reused with changed fulfillment details", async () => {
  const response = await api
    .post("/api/orders")
    .set(auth(customer))
    .set("Idempotency-Key", "checkout-transaction-1")
    .send({
      fulfillmentMethod: "delivery",
      paymentMethod: "cash_on_delivery",
      deliveryAddress: {
        recipientName: "Customer",
        phone: "0771234567",
        addressLine: "123 Test Road",
        district: "Colombo",
        city: "Colombo",
      },
    });
  assert.equal(response.status, 409);
  assert.match(response.body.message, /different details/);
});

test("pre-orders reserve stock but cannot be fulfilled before their availability date", async () => {
  const future = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const item = await product(farmer, {
    harvestDate: future,
    availableDate: future,
    availabilityStatus: "Upcoming Harvest",
  });
  assert.equal(item.isPreOrder, true);
  bodyOf(
    await api
      .post("/api/cart")
      .set(auth(customer))
      .send({ productId: item.id, quantity: 1 }),
  );
  const [order] = bodyOf(
    await api.post("/api/orders").set(auth(customer)).send(pickup),
    201,
  );
  for (const status of ["Confirmed", "Preparing"]) {
    bodyOf(
      await api
        .put(`/api/orders/${order.id}/status`)
        .set(auth(farmer))
        .send({ status }),
    );
  }
  const response = await api
    .put(`/api/orders/${order.id}/status`)
    .set(auth(farmer))
    .send({ status: "Ready for Pickup" });
  assert.equal(response.status, 409);
  assert.equal((await Product.findById(item.id)).quantity, 99);
});

test("notifications, addresses and wishlists are private and duplicate-safe", async () => {
  const notice = await Notification.findOne({ user: farmer.user.id });
  assert.equal(
    (
      await api
        .put(`/api/notifications/${notice.id}/read`)
        .set(auth(otherFarmer))
    ).status,
    404,
  );
  bodyOf(
    await api.put(`/api/notifications/${notice.id}/read`).set(auth(farmer)),
  );
  bodyOf(await api.put("/api/notifications/read-all").set(auth(farmer)));
  assert.equal(
    (await api.get("/api/notifications").set(auth(farmer))).body.unreadCount,
    0,
  );
  const address = {
    recipientName: "Customer",
    phone: "0771234567",
    addressLine: "123 Test Road",
    district: "Colombo",
    city: "Colombo",
  };
  const saved = bodyOf(
    await api.post("/api/customer/addresses").set(auth(customer)).send(address),
  );
  const addressId = saved.addresses[0]._id;
  assert.equal(
    (
      await api
        .delete(`/api/customer/addresses/${addressId}`)
        .set(auth(otherCustomer))
    ).status,
    404,
  );
  const item = await product();
  for (let index = 0; index < 2; index += 1)
    bodyOf(await api.post(`/api/wishlist/${item.id}`).set(auth(customer)));
  assert.equal(
    bodyOf(await api.get("/api/wishlist").set(auth(customer))).length,
    1,
  );
  assert.equal(
    bodyOf(await api.get("/api/wishlist").set(auth(otherCustomer))).length,
    0,
  );
});

test("prices identify their source and history snapshots are idempotent", async () => {
  await recordMarketPrices();
  await recordMarketPrices();
  const recent = await api.get(
    "/api/prices/recent?product=Fresh%20Tomatoes&district=Vavuniya&unit=kg",
  );
  assert.equal(recent.status, 200);
  assert.ok(recent.body.data[0].sampleCount > 0);
  const trends = await api.get(
    "/api/prices/trends?product=Fresh%20Tomatoes&district=Vavuniya&unit=kg",
  );
  assert.equal(trends.body.data.length, 1);
  assert.match(trends.body.source, /Farm2Home/);
});

test("AI proxy sanitizes responses and fails safely for invalid, redirected and slow predictions", async () => {
  const input = {
    product: "Fresh Tomatoes",
    category: "Vegetables",
    district: "Vavuniya",
    quality: "Grade A",
    quantity: 50,
    unit: "kg",
    harvestDate: "2026-09-25",
    month: 9,
  };
  assert.equal(
    (await api.post("/api/ai/price-suggestion").set(auth(customer)).send(input))
      .status,
    403,
  );
  const prediction = bodyOf(
    await api.post("/api/ai/price-suggestion").set(auth(farmer)).send(input),
  );
  assert.equal(prediction.recommendedPrice, 340);
  assert.equal(prediction.secret, undefined);
  assert.equal(receivedPrediction.product, input.product);
  assert.ok(prediction.marketComparison.sampleCount > 0);
  for (const mode of ["invalid", "redirect", "timeout"]) {
    predictionMode = mode;
    const response = await api
      .post("/api/ai/price-suggestion")
      .set(auth(farmer))
      .send(input);
    assert.equal(response.status, 503);
    assert.match(response.body.message, /enter your own price/);
  }
  await product(farmer, { price: 410 });
  predictionMode = "valid";
});

test("built-in price advisor uses MongoDB listings without the external service", async () => {
  const previousProvider = config.AI_PRICE_PROVIDER;
  config.AI_PRICE_PROVIDER = "marketplace";
  predictionMode = "timeout";
  const input = {
    product: "Model Tomatoes",
    category: "Vegetables",
    district: "Vavuniya",
    quality: "Grade A",
    quantity: 50,
    unit: "kg",
    harvestDate: "2026-09-23",
    month: 9,
  };
  try {
    const noData = await api
      .post("/api/ai/price-suggestion")
      .set(auth(farmer))
      .send(input);
    assert.equal(noData.status, 422);
    assert.match(noData.body.message, /No comparable/);
    await product(farmer, { name: "Model Tomatoes", price: 350 });
    const prediction = bodyOf(
      await api.post("/api/ai/price-suggestion").set(auth(farmer)).send(input),
    );
    assert.equal(prediction.recommendedPrice, 350);
    assert.equal(prediction.confidence, "Low");
    assert.match(prediction.source, /marketplace regression/);
    assert.equal(prediction.model.sampleCount, 1);
    assert.equal(prediction.currency, "LKR");
    assert.equal(prediction.unit, "kg");
  } finally {
    config.AI_PRICE_PROVIDER = previousProvider;
    predictionMode = "valid";
  }
});

test("image signatures, asset ownership and cleanup retry are enforced", async () => {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
    "base64",
  );
  const removed = [];
  app.locals.cloudAdapter = {
    upload: async (buffer, publicId) => ({
      publicId,
      url: `https://images.example.test/${publicId}.png`,
    }),
    remove: async (publicId) => {
      removed.push(publicId);
    },
  };
  assert.equal(
    (
      await api
        .post("/api/uploads/product")
        .set(auth(farmer))
        .attach("images", Buffer.from("fake"), {
          filename: "fake.png",
          contentType: "image/png",
        })
    ).status,
    400,
  );
  const [image] = bodyOf(
    await api
      .post("/api/uploads/product")
      .set(auth(farmer))
      .attach("images", png, "tomato.png"),
    201,
  );
  const item = await product(farmer, { images: [image] });
  assert.equal(item.images[0].url, image.url);
  bodyOf(await api.delete(`/api/products/${item.id}`).set(auth(farmer)));
  await processCleanup({
    remove: async () => {
      throw new Error("offline");
    },
  });
  assert.equal(
    (await UploadAsset.findOne({ publicId: image.publicId })).cleanupPending,
    true,
  );
  await processCleanup(app.locals.cloudAdapter);
  assert.ok(removed.includes(image.publicId));
  assert.equal(await UploadAsset.findOne({ publicId: image.publicId }), null);
});

test("logout revokes existing tokens without exposing secrets", async () => {
  bodyOf(await api.post("/api/auth/logout").set(auth(otherCustomer)));
  assert.equal(
    (await api.get("/api/auth/me").set(auth(otherCustomer))).status,
    401,
  );
  const malformed = await api
    .post("/api/auth/login")
    .set("Content-Type", "application/json")
    .send("{");
  assert.equal(malformed.status, 400);
  assert.equal(malformed.body.stack, undefined);
});

test("frontend API adapters complete an authenticated marketplace flow without browser fixtures", async () => {
  const server = createServer(app).listen(0, "127.0.0.1");
  await once(server, "listening");
  const tokens = new Map();
  const client = axios.create({
    baseURL: `http://127.0.0.1:${server.address().port}/api`,
  });
  client.interceptors.request.use((request) => {
    const token = tokens.get("f2h:token");
    if (token) request.headers.Authorization = `Bearer ${token}`;
    return request;
  });
  const frontend = createMarketplaceApi(client, {
    setItem: (key, value) => tokens.set(key, value),
    removeItem: (key) => tokens.delete(key),
  });
  try {
    for (const role of ["farmer", "customer"]) {
      await frontend.auth.register({
        name: `Adapter ${role}`,
        email: `adapter-${role}@example.test`,
        phone: "0771234567",
        password,
        confirmPassword: password,
        role,
      });
    }
    const grower = await frontend.auth.login(
      "adapter-farmer@example.test",
      password,
    );
    await frontend.farmer.updateProfile({
      farmName: "Adapter farm",
      district: "Vavuniya",
      city: "Vavuniya",
    });
    assert.equal(
      userView(grower, await frontend.farmer.profile()).farm,
      "Adapter farm",
    );
    const listing = productView(
      await frontend.products.create(
        await productPayload(
          {
            name: "Adapter harvest",
            category: "Vegetables",
            description: "Produce for an isolated integration test.",
            method: "Organic",
            quality: "Grade A",
            harvestDate: "2026-01-01",
            availableDate: "2026-01-02",
            quantity: 50,
            unit: "kg",
            price: 350,
            bulkPrice: 310,
            bulkThreshold: 20,
            district: "Vavuniya",
            city: "Vavuniya",
            delivery: true,
            pickup: true,
            enabled: true,
            availability: "Available",
            images: [],
          },
          frontend,
        ),
      ),
    );
    assert.equal(listing.farmerId, grower.id);
    const buyer = await frontend.auth.login(
      "adapter-customer@example.test",
      password,
    );
    assert.deepEqual((await frontend.cart.get()).items, []);
    await frontend.cart.add(listing.id, 20);
    const basket = await frontend.cart.get();
    assert.equal(basket.items[0].unitPrice, 310);
    assert.equal(basket.deliveryCharge, config.DELIVERY_CHARGE);
    assert.equal(basket.items[0].product.pickupAvailable, true);
    await frontend.wishlist.add(listing.id);
    assert.equal((await frontend.wishlist.get())[0].id, listing.id);
    const [placed] = await frontend.orders.create(
      pickup,
      "frontend-adapter-checkout",
    );
    const order = orderView(placed);
    assert.equal(order.customerId, buyer.id);
    assert.equal(order.subtotal, 6200);
    assert.deepEqual((await frontend.cart.get()).items, []);
    await frontend.auth.login("adapter-farmer@example.test", password);
    for (const status of [
      "Confirmed",
      "Preparing",
      "Ready for Pickup",
      "Completed",
    ])
      await frontend.orders.updateStatus(order.id, status);
    await frontend.auth.login("adapter-customer@example.test", password);
    await frontend.reviews.create({
      orderId: order.id,
      productId: listing.id,
      rating: 5,
      comment: "Fresh produce and a smooth collection.",
    });
    const ownReviews = (await allPages(frontend.reviews.mine)).map(reviewView);
    assert.equal(ownReviews.length, 1);
    assert.equal(ownReviews[0].customerId, buyer.id);
    assert.equal(ownReviews[0].orderId, order.id);
    const publicReview = (await allPages(frontend.reviews.list)).find(
      (value) => value.id === ownReviews[0].id,
    );
    assert.equal(publicReview.order, undefined);
    assert.equal(publicReview.customer, undefined);
    assert.equal(publicReview.customerName, buyer.name);
    const oldToken = tokens.get("f2h:token");
    await assert.rejects(
      frontend.auth.changePassword(
        "incorrect",
        "UpdatedPassword123!",
        "UpdatedPassword123!",
      ),
    );
    await frontend.auth.changePassword(
      password,
      "UpdatedPassword123!",
      "UpdatedPassword123!",
    );
    assert.notEqual(tokens.get("f2h:token"), oldToken);
    assert.equal((await frontend.auth.me()).id, buyer.id);
    assert.equal(
      (await api.get("/api/auth/me").set("Authorization", `Bearer ${oldToken}`))
        .status,
      401,
    );
    await frontend.auth.logout();
    assert.equal(tokens.size, 0);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("development profile uploads persist without Cloudinary and replace images safely", async () => {
  const previousAdapter = app.locals.cloudAdapter;
  const previousEnvironment = config.NODE_ENV;
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
    "base64",
  );
  delete app.locals.cloudAdapter;
  config.NODE_ENV = "development";
  try {
    const sendPhoto = () =>
      api
        .post("/api/uploads/profile")
        .set(auth(farmer))
        .attach("images", png, "profile.png");
    const [first] = bodyOf(await sendPhoto(), 201);
    assert.ok(first.publicId.startsWith("local/farm2home/"));
    assert.equal(
      bodyOf(await api.get("/api/auth/me").set(auth(farmer))).profileImage.url,
      first.url,
    );
    bodyOf(
      await api
        .put("/api/farmer/profile")
        .set(auth(farmer))
        .send({ farmName: "Profile with uploaded photo" }),
    );
    // A fresh application instance reads the bytes from MongoDB, not process memory.
    const fresh = request(createApp(config, routes));
    const imageResponse = await fresh.get(new URL(first.url).pathname);
    assert.equal(imageResponse.status, 200);
    assert.equal(imageResponse.headers["content-type"], "image/png");
    assert.equal(
      imageResponse.headers["cross-origin-resource-policy"],
      "cross-origin",
    );
    assert.deepEqual(imageResponse.body, png);
    assert.equal(
      (await UploadAsset.findOne({ publicId: first.publicId })).localData,
      undefined,
    );
    const publicProfile = bodyOf(
      await fresh.get("/api/farmers/" + farmer.user.id),
    );
    assert.equal(publicProfile.user.profileImage.url, first.url);
    const [second] = bodyOf(await sendPhoto(), 201);
    assert.notEqual(second.publicId, first.publicId);
    assert.equal((await fresh.get(new URL(first.url).pathname)).status, 404);
    await processCleanup(cloudAdapter(config));
    assert.equal(await UploadAsset.findOne({ publicId: first.publicId }), null);
    assert.equal((await fresh.get(new URL(second.url).pathname)).status, 200);
    assert.equal(
      (await fresh.get("/api/uploads/local/farm2home/invalid/invalid")).status,
      404,
    );
    const before = await UploadAsset.countDocuments();
    config.NODE_ENV = "production";
    const blocked = await sendPhoto();
    assert.equal(blocked.status, 503);
    assert.match(blocked.body.message, /Cloudinary credentials/);
    assert.equal(await UploadAsset.countDocuments(), before);
    assert.equal((await fresh.get(new URL(second.url).pathname)).status, 404);
    config.NODE_ENV = "development";
    config.CLOUDINARY_CLOUD_NAME = "incomplete-configuration";
    assert.equal((await sendPhoto()).status, 503);
    assert.equal(await UploadAsset.countDocuments(), before);
  } finally {
    config.NODE_ENV = previousEnvironment;
    delete config.CLOUDINARY_CLOUD_NAME;
    app.locals.cloudAdapter = previousAdapter;
  }
});
