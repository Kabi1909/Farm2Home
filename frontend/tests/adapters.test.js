import test from 'node:test';
import assert from 'node:assert/strict';
import {
  allPages,
  productView,
  productPayload,
  farmerView,
  orderView,
  reviewView,
} from '../src/services/adapters.js';

test('DTO mapping preserves server IDs, bulk thresholds and private locations', async () => {
  const product = productView({
    id: 'product-id',
    farmer: 'farmer-id',
    images: [{ url: 'https://example.test/photo', publicId: 'owned-image' }],
    price: 350,
    bulkPrice: 310,
    minimumBulkQuantity: 20,
    isActive: true,
    availabilityStatus: 'Upcoming Harvest',
    location: { latitude: 8, longitude: 80, isPublic: false },
  });
  assert.equal(product.farmerId, 'farmer-id');
  assert.equal(product.bulkThreshold, 20);
  assert.equal(product.lat, undefined);
  const payload = await productPayload(product, {
    upload() {
      throw new Error('An existing owned image must not be uploaded again');
    },
  });
  assert.deepEqual(payload.images, [{ publicId: 'owned-image' }]);
  assert.equal(payload.isPreOrder, true);
  assert.equal(payload.bulkPrice, 310);
  assert.equal(
    farmerView({
      user: { id: 'farmer-id', name: 'Grower' },
      latitude: 8,
      longitude: 80,
      publicLocation: false,
    }).lat,
    undefined,
  );
});

test('order and review mappings use actual server snapshots and ownership IDs', () => {
  const order = orderView({
    id: 'order-id',
    customer: { id: 'customer-id', name: 'Buyer' },
    farmer: 'farmer-id',
    deliveryCharge: 175,
    fulfillmentMethod: 'pickup',
    paymentMethod: 'pay_on_pickup',
    createdAt: '2026-04-15T00:00:00Z',
    items: [
      {
        product: 'product-id',
        productName: 'Harvest',
        unitPrice: 310,
        quantity: 20,
        lineTotal: 6200,
      },
    ],
  });
  assert.equal(order.items[0].price, 310);
  assert.equal(order.displayName, 'Harvest');
  assert.equal(order.id, 'order-id');
  assert.equal(order.customerId, 'customer-id');
  assert.equal(order.deliveryFee, 175);
  assert.equal(order.estimatedDate, 'To be confirmed by the farmer');
  const review = reviewView({
    id: 'review-id',
    order: 'order-id',
    customer: { id: 'customer-id', name: 'Buyer' },
    product: 'product-id',
  });
  assert.equal(review.orderId, order.id);
  assert.equal(review.customerId, order.customerId);
});

test('paginated API data is exhausted without inserting fallback records', async () => {
  const calls = [];
  assert.deepEqual(
    await allPages(async ({ page }) => {
      calls.push(page);
      return {
        data: page === 1 ? [{ id: 'first' }] : [{ id: 'second' }],
        pagination: { hasNextPage: page === 1 },
      };
    }),
    [{ id: 'first' }, { id: 'second' }],
  );
  assert.deepEqual(calls, [1, 2]);
  assert.deepEqual(
    await allPages(async () => ({ data: [], pagination: { hasNextPage: false } })),
    [],
  );
  await assert.rejects(
    allPages(async () => {
      throw new Error('API offline');
    }),
    /API offline/,
  );
});
