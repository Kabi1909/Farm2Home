import test from "node:test";
import assert from "node:assert/strict";
import { calculateLine } from "../services/pricingService.js";
import { canTransition } from "../services/orderService.js";
import { inventoryStatus } from "../services/inventoryService.js";
import {
  productCreate,
  aiInput,
  registration,
  checkout,
} from "../validation/schemas.js";
import { loadConfig } from "../config/env.js";

const available = {
  isActive: true,
  isDeleted: false,
  availabilityStatus: "Available",
  quantity: 100,
  price: 350,
  bulkPrice: 310,
  minimumBulkQuantity: 20,
};

test("bulk pricing changes at the threshold and uses currency rounding", () => {
  assert.equal(calculateLine(available, 19).unitPrice, 350);
  assert.deepEqual(calculateLine(available, 20), {
    quantity: 20,
    unitPrice: 310,
    isBulkPrice: true,
    lineTotal: 6200,
  });
  assert.equal(calculateLine({ ...available, price: 0.1 }, 3).lineTotal, 0.3);
});

test("invalid quantities and unavailable products cannot enter checkout", () => {
  for (const quantity of [0, -1, 0.5, NaN, Infinity, 101]) {
    assert.throws(() => calculateLine(available, quantity));
  }
  for (const product of [
    null,
    { ...available, isActive: false },
    { ...available, isDeleted: true },
  ]) {
    assert.throws(() => calculateLine(product, 1));
  }
});

test("order state machine separates pickup and delivery and prevents repeated cancellation", () => {
  assert.equal(canTransition("Pending", "Completed", "delivery"), false);
  assert.equal(canTransition("Preparing", "Ready for Pickup", "pickup"), true);
  assert.equal(
    canTransition("Preparing", "Ready for Pickup", "delivery"),
    false,
  );
  assert.equal(canTransition("Pending", "Cancelled", "pickup"), true);
  assert.equal(canTransition("Cancelled", "Cancelled", "pickup"), false);
  assert.equal(canTransition("Completed", "Cancelled", "delivery"), false);
});

test("stock status uses configurable boundaries and preserves upcoming harvests", () => {
  assert.equal(inventoryStatus(0, true), "Sold Out");
  assert.equal(inventoryStatus(3, true), "Upcoming Harvest");
  assert.equal(inventoryStatus(5, false, 5), "Low Stock");
  assert.equal(inventoryStatus(6, false, 5), "Available");
});

test("AI validation rejects fabricated month, unsupported district and arbitrary upstream URLs", () => {
  const input = {
    product: "Tomato",
    category: "Vegetables",
    district: "Vavuniya",
    quality: "Grade A",
    quantity: 50,
    unit: "kg",
    harvestDate: "2026-09-25",
    month: 9,
  };
  assert.equal(aiInput.safeParse(input).success, true);
  for (const change of [
    { month: 8 },
    { quantity: 0 },
    { harvestDate: "2026-02-30" },
    { district: "Unknown" },
    { url: "http://example.com" },
  ]) {
    assert.equal(aiInput.safeParse({ ...input, ...change }).success, false);
  }
});

test("registration and checkout reject mass assignment and mismatched fulfillment", () => {
  const input = {
    name: "Demo",
    email: "user@example.test",
    phone: "0771234567",
    password: "Development123!",
    confirmPassword: "Development123!",
    role: "customer",
  };
  assert.equal(registration.safeParse(input).success, true);
  assert.equal(
    registration.safeParse({ ...input, role: "admin" }).success,
    false,
  );
  assert.equal(
    registration.safeParse({ ...input, tokenVersion: 0 }).success,
    false,
  );
  assert.equal(
    checkout.safeParse({
      fulfillmentMethod: "pickup",
      paymentMethod: "cash_on_delivery",
    }).success,
    false,
  );
  assert.equal(
    checkout.safeParse({
      fulfillmentMethod: "delivery",
      paymentMethod: "cash_on_delivery",
    }).success,
    false,
  );
  assert.equal(
    checkout.safeParse({
      fulfillmentMethod: "pickup",
      paymentMethod: "pay_on_pickup",
      total: 1,
    }).success,
    false,
  );
  assert.equal(
    productCreate.safeParse({ farmer: "arbitrary-owner" }).success,
    false,
  );
});

test("configuration rejects weak secrets and unsupported AI protocols", () => {
  assert.throws(() =>
    loadConfig({ MONGO_URI: "mongodb://localhost/test", JWT_SECRET: "short" }),
  );
  assert.throws(() =>
    loadConfig({
      MONGO_URI: "mongodb://localhost/test",
      JWT_SECRET: "x".repeat(32),
      AI_SERVICE_URL: "file:///etc/passwd",
    }),
  );
});

test("registration rejects passwords that bcrypt would truncate in UTF-8", () => {
  const password = `Aa1!${"😀".repeat(20)}`;
  assert.ok(password.length < 72);
  assert.equal(
    registration.safeParse({
      name: "Customer",
      email: "unicode@example.test",
      phone: "0771234567",
      password,
      confirmPassword: password,
      role: "customer",
    }).success,
    false,
  );
});
