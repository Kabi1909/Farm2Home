import test from 'node:test';
import assert from 'node:assert/strict';
import { createOrderPdf } from '../src/services/orderPdf.js';

const order = {
  id: 'order-one',
  orderNumber: 'F2H-1001',
  date: '2026-09-26',
  status: 'Pending',
  farmerId: 'farm-one',
  customer: 'Test Customer',
  phone: '0771234567',
  fulfillment: 'delivery',
  address: '12 Farm Road',
  deliveryAddress: { city: 'Colombo', district: 'Colombo' },
  payment: 'Cash on Delivery',
  paymentStatus: 'pending',
  subtotal: 6200,
  deliveryFee: 250,
  total: 6450,
  items: [
    {
      name: 'Fresh Tomatoes',
      quantity: 20,
      unit: 'kg',
      price: 310,
      lineTotal: 6200,
      isBulkPrice: true,
    },
  ],
};
const textOf = (pdf) => pdf.internal.pages.slice(1).flat().join('\n');

test('order PDF contains confirmed quantities, bulk prices, payment status and delivery totals', () => {
  const pdf = createOrderPdf([order], [{ id: 'farm-one', farm: 'Sunrise Farm' }]);
  const text = textOf(pdf);
  for (const expected of [
    'F2H-1001',
    'Test Customer',
    'Sunrise Farm',
    'Fresh Tomatoes',
    '20 kg',
    '310.00',
    '6,200.00',
    '250.00',
    '6,450.00',
    'Bulk price applied',
    'Payment status: pending',
    'not proof of payment',
  ]) {
    assert.ok(text.includes(expected), expected);
  }
  assert.ok(pdf.output().startsWith('%PDF-'));
});

test('multi-farmer PDFs paginate long orders and include every farmer and combined total', () => {
  const manyItems = Array.from({ length: 75 }, (_, index) => ({
    ...order.items[0],
    name: `Product ${index + 1} with a long saved description `.repeat(3),
  }));
  const second = {
    ...order,
    id: 'order-two',
    orderNumber: 'F2H-1002',
    fulfillment: 'pickup',
    payment: 'Pay on Pickup',
    deliveryFee: 0,
    total: 6200,
    items: manyItems,
  };
  const pdf = createOrderPdf([order, second]);
  assert.ok(pdf.getNumberOfPages() > 3);
  const text = textOf(pdf);
  for (const expected of ['F2H-1001', 'F2H-1002', 'Product 75', 'Farm pickup', '12,650.00']) {
    assert.ok(text.includes(expected), expected);
  }
  assert.throws(() => createOrderPdf([]), /No confirmed orders/);
});
