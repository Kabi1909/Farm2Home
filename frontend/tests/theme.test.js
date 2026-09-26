import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const bootstrap = readFileSync(new URL('../public/theme-init.js', import.meta.url), 'utf8');

function loadTheme(saved, systemDark, blocked = false) {
  const root = { dataset: {}, style: {} };
  runInNewContext(bootstrap, {
    document: { documentElement: root },
    localStorage: {
      getItem() {
        if (blocked) throw new Error('Storage disabled');
        return saved;
      },
    },
    window: { matchMedia: () => ({ matches: systemDark }) },
  });
  return root;
}

test('saved appearance overrides the device preference before rendering', () => {
  for (const [saved, systemDark] of [
    ['light', true],
    ['dark', false],
  ]) {
    const root = loadTheme(saved, systemDark);
    assert.equal(root.dataset.theme, saved);
    assert.equal(root.style.colorScheme, saved);
  }
});

test('first visit, invalid preferences and blocked storage use the device appearance', () => {
  assert.equal(loadTheme(null, true).dataset.theme, 'dark');
  assert.equal(loadTheme('invalid', false).dataset.theme, 'light');
  assert.equal(loadTheme(null, true, true).dataset.theme, 'dark');
});
