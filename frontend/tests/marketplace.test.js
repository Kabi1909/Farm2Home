import test from 'node:test';
import assert from 'node:assert/strict';
import { districts, orderSteps } from '../src/data/catalog.js';
import { unitPrice, filterProducts, validPhone } from '../src/utils/helpers.js';
import { getPriceSuggestion } from '../src/services/aiService.js';
import { marketplaceApi } from '../src/services/marketplaceApi.js';
// Test inputs are isolated here; the application never imports them.
const farmers = [{ id: 'f1', name: 'Test grower', farm: 'Sunrise Family Farm' }];
const products = [
  {
    id: 'p1',
    farmerId: 'f1',
    name: 'Tomato',
    district: 'Vavuniya',
    category: 'Vegetables',
    price: 340,
    rating: 4.8,
    delivery: true,
    enabled: true,
  },
  {
    id: 'p2',
    farmerId: 'f1',
    name: 'Carrot',
    district: 'Kandy',
    category: 'Vegetables',
    price: 280,
    rating: 4.6,
    delivery: true,
    enabled: true,
  },
];
test('district choices retain all 25 Sri Lankan districts', () => {
  assert.equal(new Set(districts).size, 25);
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

test('price advisor forwards the actual product and abort signal to the API', async (t) => {
  const signal = new AbortController().signal;
  const expected = {
    recommendedPrice: 375,
    minimumPrice: 360,
    maximumPrice: 390,
    confidence: 'Medium',
  };
  t.mock.method(marketplaceApi, 'suggestPrice', async (values, actualSignal) => {
    assert.deepEqual(values, {
      product: 'Tomato',
      category: 'Vegetables',
      district: 'Vavuniya',
      quality: 'Grade A',
      quantity: 20,
      unit: 'kg',
      harvestDate: '2026-06-01',
      month: 6,
    });
    assert.equal(actualSignal, signal);
    return expected;
  });
  assert.deepEqual(
    await getPriceSuggestion(
      {
        name: ' Tomato ',
        category: 'Vegetables',
        district: 'Vavuniya',
        quality: 'Grade A',
        quantity: '20',
        unit: 'kg',
        harvestDate: '2026-06-01',
      },
      { signal },
    ),
    expected,
  );
});
test('an unavailable advisor rejects instead of returning a generated price', async (t) => {
  t.mock.method(marketplaceApi, 'suggestPrice', async () => {
    throw new Error('Service unavailable');
  });
  await assert.rejects(
    getPriceSuggestion({ name: 'Tomato', harvestDate: '2026-06-01' }),
    /Service unavailable/,
  );
});
