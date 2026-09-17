import test from 'node:test';
import assert from 'node:assert/strict';
import {
  products,
  farmers,
  customers,
  orders,
  reviews,
  notifications,
  districts,
  orderSteps,
} from '../src/data/seed.js';
import { unitPrice, filterProducts, validPhone } from '../src/utils/helpers.js';
import { getPriceSuggestion } from '../src/services/aiService.js';

test('seed data meets the requested marketplace sizes and valid references', () => {
  assert.ok(farmers.length >= 10 && customers.length >= 20 && products.length >= 40);
  assert.ok(orders.length >= 25 && reviews.length >= 30 && notifications.length >= 20);
  assert.equal(districts.length, 25);
  assert.ok(products.every((p) => farmers.some((f) => f.id === p.farmerId) && p.images.length > 0));
  assert.ok(orders.every((o) => customers.some((c) => c.id === o.customerId)));
});

test('Tomato search and Vavuniya district can be combined', () => {
  const results = filterProducts(
    products,
    new URLSearchParams({ search: 'Tomato', district: 'Vavuniya' }),
    farmers,
  );
  assert.equal(results.length, 1);
  assert.equal(results[0].id, 'p1');
});

test('search includes farmer names and farms', () => {
  const results = filterProducts(
    products,
    new URLSearchParams({ search: 'Sunrise Family Farm' }),
    farmers,
  );
  assert.equal(results.length, products.filter((p) => p.farmerId === 'f1').length);
});

test('composed filters and ascending sort respect every constraint', () => {
  const query = new URLSearchParams({
    category: 'Vegetables',
    min: '250',
    max: '450',
    rating: '4.5',
    delivery: 'true',
    sort: 'price-asc',
  });
  const results = filterProducts(products, query, farmers);
  assert.ok(results.length > 0);
  assert.ok(
    results.every(
      (p) =>
        p.category === 'Vegetables' &&
        p.price >= 250 &&
        p.price <= 450 &&
        p.rating >= 4.5 &&
        p.delivery,
    ),
  );
  assert.deepEqual(
    results.map((p) => p.price),
    results.map((p) => p.price).sort((a, b) => a - b),
  );
});

test('disabled and draft products stay out of the public marketplace', () => {
  const fixtures = [
    { ...products[0], enabled: false },
    { ...products[1], draft: true },
  ];
  assert.equal(filterProducts(fixtures, new URLSearchParams()).length, 0);
});

test('bulk price starts exactly at the threshold', () => {
  const p = { price: 350, bulkPrice: 310, bulkThreshold: 20 };
  assert.equal(unitPrice(p, 19), 350);
  assert.equal(unitPrice(p, 20), 310);
  assert.equal(unitPrice(p, 21), 310);
  assert.equal(unitPrice({ ...p, bulkPrice: 0 }, 20), 350);
});

test('delivery and pickup use their correct status sequences', () => {
  assert.deepEqual(orderSteps('pickup'), [
    'Pending',
    'Confirmed',
    'Preparing',
    'Ready for Pickup',
    'Completed',
  ]);
  assert.deepEqual(orderSteps('delivery'), [
    'Pending',
    'Confirmed',
    'Preparing',
    'Out for Delivery',
    'Delivered',
    'Completed',
  ]);
});

test('phone validation accepts Sri Lankan local and international forms', () => {
  assert.ok(validPhone('0771234567'));
  assert.ok(validPhone('+94 771234567'));
  assert.equal(validPhone('123'), false);
});

test('mock AI recommends Rs. 340 for Grade A tomatoes', async () => {
  const result = await getPriceSuggestion({
    name: 'Tomato',
    district: 'Vavuniya',
    quality: 'Grade A',
    quantity: 50,
    unit: 'kg',
  });
  assert.deepEqual(result, {
    recommendedPrice: 340,
    minimumPrice: 320,
    maximumPrice: 360,
    confidence: 'High',
  });
});

test('mock AI failure is explicit and retryable', async () => {
  await assert.rejects(
    getPriceSuggestion({ name: 'Tomato', simulateError: true }),
    /temporarily unavailable/,
  );
});
