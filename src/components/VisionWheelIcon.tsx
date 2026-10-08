import React, { useId } from 'react';
import type { VisionMode } from '../types';
import { hslToRgb, rgbToHex, simulateColorBlindness } from '../utils/colorConversions';

export function VisionWheelIcon({ mode }: { mode: VisionMode }) {
  const gradientId = useId();
  return (
    <svg viewBox="0 0 40 40" width="26" height="26" className="shrink-0" aria-hidden="true">
      <defs>
        <radialGradient id={gradientId}>
          <stop offset="0" stopColor="white" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
      {Array.from({ length: 24 }, (_, index) => {
        const hue = index * 15;
        const start = hue * Math.PI / 180;
        const end = (hue + 15.5) * Math.PI / 180;
        const color = simulateColorBlindness(rgbToHex(hslToRgb({ h: hue, s: 100, l: 50 })), mode);
        return <path key={index} d={`M20 20 L${20 + 19 * Math.cos(start)} ${20 + 19 * Math.sin(start)} A19 19 0 0 1 ${20 + 19 * Math.cos(end)} ${20 + 19 * Math.sin(end)} Z`} fill={color} />;
      })}
      <circle cx="20" cy="20" r="19" fill={`url(#${gradientId})`} />
      <circle cx="20" cy="20" r="19" fill="none" stroke="currentColor" strokeOpacity=".25" />
    </svg>
  );
}
