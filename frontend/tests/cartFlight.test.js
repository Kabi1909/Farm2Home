import test from 'node:test';
import assert from 'node:assert/strict';
import { flightPoint, isVisibleRect } from '../src/utils/cartFlightGeometry.js';
test('cart flight arcs upward and reaches the measured destination', () => {
  for (const mobile of [false, true]) {
    const start = { x: 80, y: 540 },
      end = { x: 300, y: 60 };
    assert.deepEqual(flightPoint(start, end, 0, mobile), start);
    assert.deepEqual(flightPoint(start, end, 1, mobile), end);
    assert.ok(flightPoint(start, end, 0.5, mobile).y < (start.y + end.y) / 2);
  }
});
test('cart targets must have a visible viewport intersection', () => {
  assert.equal(
    isVisibleRect({ width: 24, height: 24, top: 10, left: 340, right: 364, bottom: 34 }, 390, 844),
    true,
  );
  assert.equal(
    isVisibleRect({ width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 }, 390, 844),
    false,
  );
  assert.equal(
    isVisibleRect({ width: 24, height: 24, top: -50, left: 20, right: 44, bottom: -26 }, 390, 844),
    false,
  );
});
