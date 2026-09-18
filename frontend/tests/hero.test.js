import test from 'node:test';
import assert from 'node:assert/strict';
import { arcPoint, heroComposition, shouldPlayHero } from '../src/components/hero/heroMotion.js';

test('intro plays once per session and respects reduced motion', () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) };
  assert.equal(shouldPlayHero(storage, false), true);
  values.set('farm2homeHeroPlayed', 'true');
  assert.equal(shouldPlayHero(storage, false), false);
  values.clear();
  assert.equal(shouldPlayHero(storage, true), false);
  assert.equal(
    shouldPlayHero(
      {
        getItem() {
          throw new Error('Disabled');
        },
      },
      false,
    ),
    false,
  );
});

test('flight starts offscreen and lands within the hero on all breakpoints', () => {
  for (const [width, height] of [
    [320, 700],
    [390, 700],
    [768, 620],
    [1440, 780],
    [2560, 780],
  ]) {
    const scene = heroComposition(width, height);
    assert.ok(scene.start.x < 0);
    assert.ok(scene.landing.x > 0 && scene.landing.x < 1);
    assert.ok(scene.landing.y > 0.7 && scene.landing.y < 0.9);
    assert.ok(scene.radius > 0 && scene.radius < height * 0.12);
    assert.deepEqual(arcPoint(scene.start, scene.control, scene.landing, 0), scene.start);
    assert.deepEqual(arcPoint(scene.start, scene.control, scene.landing, 1), scene.landing);
    const middle = arcPoint(scene.start, scene.control, scene.landing, 0.5);
    assert.ok(middle.y < (scene.start.y + scene.landing.y) / 2);
  }
});

test('mobile uses a shorter journey and fewer particles', () => {
  const mobile = heroComposition(390, 700);
  const desktop = heroComposition(1440, 780);
  assert.equal(mobile.leaves, 3);
  assert.equal(desktop.leaves, 6);
  assert.ok(mobile.landing.y - mobile.start.y < desktop.landing.y - desktop.start.y);
});
