import React, { useId } from 'react';
import type { WheelShape } from '../types';

export function WheelShapeIcon({ shape }: { shape: WheelShape }) {
  const id = useId();
  const innerPath = shape === 'triangle' ? 'M20 9 L10.5 25.5 L29.5 25.5 Z' : 'M12 12 H28 V28 H12 Z';
  return (
    <svg viewBox="0 0 40 40" width="28" height="28" className="shrink-0" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-white`}><stop stopColor="white" /><stop offset="1" stopColor="white" stopOpacity="0" /></radialGradient>
        <linearGradient id={`${id}-color`}><stop stopColor="white" /><stop offset="1" stopColor="#a020ff" /></linearGradient>
        <linearGradient id={`${id}-shade`} x2="0" y2="1"><stop stopColor="black" stopOpacity="0" /><stop offset="1" stopColor="black" /></linearGradient>
      </defs>
      {Array.from({ length: 24 }, (_, index) => {
        const hue = index * 15;
        const a = hue * Math.PI / 180;
        const b = (hue + 15.5) * Math.PI / 180;
        const p = (r: number, t: number) => `${20 + r * Math.cos(t)} ${20 + r * Math.sin(t)}`;
        const d = shape === 'circle'
          ? `M20 20 L${p(19, a)} A19 19 0 0 1 ${p(19, b)} Z`
          : `M${p(19, a)} A19 19 0 0 1 ${p(19, b)} L${p(13, b)} A13 13 0 0 0 ${p(13, a)} Z`;
        return <path key={index} d={d} fill={`hsl(${hue} 100% 50%)`} />;
      })}
      {shape === 'circle' ? <circle cx="20" cy="20" r="19" fill={`url(#${id}-white)`} /> : <>
        <path d={innerPath} fill={`url(#${id}-color)`} />
        <path d={innerPath} fill={`url(#${id}-shade)`} stroke="currentColor" strokeOpacity=".3" />
      </>}
    </svg>
  );
}
