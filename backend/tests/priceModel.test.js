import test from "node:test";
import assert from "node:assert/strict";
import {
  predictFromListings,
  productKey,
} from "../services/marketplacePriceModel.js";

const now = new Date("2026-09-23T00:00:00Z");
const input = {
  product: "Tomato",
  category: "Vegetables",
  district: "Vavuniya",
  quality: "Grade A",
  quantity: 50,
  unit: "kg",
  harvestDate: "2026-09-23",
  month: 9,
};
const listing = {
  _id: "listing-one",
  farmer: "grower-one",
  name: "Fresh Tomatoes",
  category: "Vegetables",
  district: "Vavuniya",
  quality: "Grade A",
  quantity: 50,
  unit: "kg",
  harvestDate: now,
  updatedAt: now,
  price: 340,
  isActive: true,
  isDeleted: false,
  availabilityStatus: "Available",
};

test("model normalizes common product labels but preserves distinct varieties", () => {
  assert.equal(productKey(" Organic Fresh Tomatoes "), "tomato");
  assert.notEqual(productKey("Cherry Tomatoes"), productKey("Tomato"));
  assert.notEqual(productKey("Red Onions"), productKey("Onion"));
});

test("a single observed listing returns its real price with low coverage", () => {
  const result = predictFromListings(input, [listing], now);
  assert.equal(result.recommendedPrice, 340);
  assert.equal(result.minimumPrice, 340);
  assert.equal(result.maximumPrice, 340);
  assert.equal(result.confidence, "Low");
  assert.equal(result.model.sampleCount, 1);
  assert.equal(result.model.localSampleCount, 1);
});

test("regression favours nearby district and quality and deduplicates growers", () => {
  const result = predictFromListings(
    input,
    [
      listing,
      { ...listing, _id: "duplicate", price: 9999, updatedAt: "2020-01-01" },
      {
        ...listing,
        _id: "other",
        farmer: "grower-two",
        district: "Galle",
        quality: "Premium",
        price: 500,
      },
    ],
    now,
  );
  assert.equal(result.model.sampleCount, 2);
  assert.ok(result.recommendedPrice > 340 && result.recommendedPrice < 420);
  assert.equal(result.maximumPrice, 500);
});

test("empty, unrelated, unavailable and incompatible unit data never produce fabricated prices", () => {
  const excluded = [
    { ...listing, name: "Carrots" },
    { ...listing, unit: "piece" },
    { ...listing, name: "Cherry Tomatoes" },
    { ...listing, isActive: false },
    { ...listing, quantity: 0 },
    { ...listing, isDeleted: true },
    { ...listing, availabilityStatus: "Sold Out" },
    { ...listing, price: NaN },
  ];
  for (const data of [[], excluded])
    assert.throws(
      () => predictFromListings(input, data, now),
      (error) => error.status === 422 && /reference data/.test(error.message),
    );
});
