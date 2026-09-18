import test from 'node:test';
import assert from 'node:assert/strict';
import { cartAdditionError } from '../src/utils/cartValidation.js';
const product = { enabled: true, quantity: 25, unit: 'kg', availability: 'Available' };
test('cart validates combined quantity and preserves valid bulk purchases', () => {
  assert.equal(cartAdditionError(product, 20), null);
  assert.equal(cartAdditionError(product, 2, 23), null);
  assert.equal(cartAdditionError(product, 3, 23), 'Only 2 kg available.');
  assert.equal(cartAdditionError(product, 1, 25), 'Only 0 kg available.');
  assert.ok(cartAdditionError(product, 0));
  assert.ok(cartAdditionError(product, 1.5));
});
test('unavailable, removed and draft products reject additions', () => {
  for (const candidate of [
    null,
    { ...product, enabled: false },
    { ...product, draft: true },
    { ...product, availability: 'Sold Out' },
    { ...product, quantity: 0 },
  ]) {
    assert.equal(cartAdditionError(candidate, 1), 'This product is currently unavailable.');
  }
});
