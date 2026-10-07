import test from 'node:test';
import assert from 'node:assert/strict';
import { createColorFromHsv, generateHarmonicColors } from '../src/utils/colorConversions.ts';
import { harmonyPath } from '../src/utils/harmonyGeometry.ts';
import type { HarmonyType } from '../src/types.ts';

const palette = (count = 5) => Array.from({ length: count }, (_, i) => createColorFromHsv(i + 1, { h: 350, s: 80, v: 85 }));
const coord = (color: ReturnType<typeof createColorFromHsv>) => ({
  x: 180 + color.hsv.s * Math.cos(color.hsv.h * Math.PI / 180),
  y: 180 + color.hsv.s * Math.sin(color.hsv.h * Math.PI / 180),
});
const center = { x: 180, y: 180 };
const patterns = {
  analogous: [-60, -30, 0, 30, 60], complementary: [0, 180],
  splitComplementary: [0, 150, 210], triangular: [0, 120, 240], quadratic: [0, 90, 180, 270],
};

test('all harmonies keep their angles and selected color when any card is edited', () => {
  for (const [harmony, angles] of Object.entries(patterns)) {
    for (let selected = 0; selected < 5; selected++) {
      const initial = palette();
      const base = initial[selected];
      const generated = generateHarmonicColors(base, harmony as HarmonyType, initial);
      const root = 350 - angles[selected % angles.length];
      assert.equal(generated[selected].hex, base.hex, `${harmony}, card ${selected}`);
      angles.forEach((offset, i) => {
        assert.equal(generated[i].hsv.h, ((root + offset) % 360 + 360) % 360);
        assert.equal(generated[i].hsv.s, base.hsv.s);
      });
    }
  }
});

test('quadratic connects four perimeter vertices, without diagonals or extra tones', () => {
  const colors = generateHarmonicColors(palette()[2], 'quadratic', palette());
  const path = harmonyPath('quadratic', colors, coord, center);
  assert.equal((path.match(/L /g) || []).length, 3);
  assert.ok(path.endsWith(' Z'));
  const points = [...colors.slice(0, 4)].sort((a, b) => a.hsv.h - b.hsv.h).map(coord);
  for (let i = 0; i < 4; i++) {
    const a = points[i], b = points[(i + 1) % 4], c = points[(i + 2) % 4];
    assert.ok(Math.abs((b.x - a.x) * (c.x - b.x) + (b.y - a.y) * (c.y - b.y)) < 1e-7);
  }
});

test('analogous uses a continuous open arc across the zero-degree boundary', () => {
  const colors = generateHarmonicColors(palette()[2], 'analogous', palette());
  const path = harmonyPath('analogous', colors, coord, center);
  assert.match(path, / A /);
  assert.ok(!path.includes(' Z'));
  assert.ok(!path.includes(' L '));
  assert.match(path, / 0 0 1 /);
});

test('complementary is a line, split complementary is a Y, triangular is a closed triangle', () => {
  for (const harmony of ['complementary', 'splitComplementary', 'triangular'] as const) {
    const colors = generateHarmonicColors(palette()[0], harmony, palette());
    const path = harmonyPath(harmony, colors, coord, center);
    assert.equal((path.match(/L /g) || []).length, harmony === 'complementary' ? 1 : harmony === 'triangular' ? 2 : 3);
    assert.equal(path.endsWith(' Z'), harmony === 'triangular');
    if (harmony === 'splitComplementary') assert.equal((path.match(/M 180 180/g) || []).length, 3);
  }
});

test('monochromatic stays on one radial line for every selected card', () => {
  for (let selected = 0; selected < 5; selected++) {
    const colors = generateHarmonicColors(palette()[selected], 'monochromatic', palette());
    assert.ok(colors.every(color => color.hsv.h === 350));
    assert.ok(new Set(colors.map(color => color.hex)).size > 1);
    assert.ok(!harmonyPath('monochromatic', colors, coord, center).endsWith(' Z'));
  }
});

test('editing a harmony preserves added cards, IDs, and the empty slot', () => {
  const colors = palette(8);
  colors[7] = { ...colors[7], isEmpty: true, hex: '#------' };
  const generated = generateHarmonicColors(colors[5], 'quadratic', colors);
  assert.equal(generated.length, 8);
  assert.deepEqual(generated.map(color => color.id), colors.map(color => color.id));
  assert.equal(generated[5].hex, colors[5].hex);
  assert.equal(generated[7].isEmpty, true);
  assert.equal(harmonyPath('free', generated, coord, center), '');
});
