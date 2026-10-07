import type { ColorItem, HarmonyType } from '../types';

type Point = { x: number; y: number };

// Only primary hues define a harmony. Extra tones remain selectable markers.
export function harmonyPath(
  harmony: HarmonyType,
  colors: ColorItem[],
  position: (color: ColorItem) => Point,
  center: Point,
  ring = false,
): string {
  if (harmony === 'free') return '';
  const count = { complementary: 2, splitComplementary: 3, triangular: 3, quadratic: 4, analogous: 5, monochromatic: colors.length }[harmony];
  let primary = colors.slice(0, count).filter(color => !color.isEmpty);
  if (!primary.length) return '';
  const point = (p: Point) => `${p.x} ${p.y}`;

  if (harmony === 'splitComplementary') {
    return primary.map(color => `M ${point(center)} L ${point(position(color))}`).join(' ');
  }
  if (harmony === 'monochromatic') {
    if (ring) return `M ${point(center)} L ${point(position(primary[0]))}`;
    primary = [...primary].sort((a, b) => a.hsv.s - b.hsv.s);
  } else {
    primary = [...primary].sort((a, b) => a.hsv.h - b.hsv.h);
  }

  if (harmony === 'analogous' && primary.length > 1) {
    // Cut the sorted hues at the largest gap so a palette spanning 0° stays contiguous.
    let cut = 0;
    let largestGap = -1;
    for (let i = 0; i < primary.length; i++) {
      const gap = (primary[(i + 1) % primary.length].hsv.h - primary[i].hsv.h + 360) % 360;
      if (gap > largestGap) { largestGap = gap; cut = (i + 1) % primary.length; }
    }
    primary = [...primary.slice(cut), ...primary.slice(0, cut)];
    const first = position(primary[0]);
    const last = position(primary[primary.length - 1]);
    const radius = Math.hypot(first.x - center.x, first.y - center.y);
    if (radius < 0.01) return '';
    return `M ${point(first)} A ${radius} ${radius} 0 ${360 - largestGap > 180 ? 1 : 0} 1 ${point(last)}`;
  }

  const path = primary.map((color, i) => `${i ? 'L' : 'M'} ${point(position(color))}`).join(' ');
  return path + (harmony === 'triangular' || harmony === 'quadratic' ? ' Z' : '');
}
