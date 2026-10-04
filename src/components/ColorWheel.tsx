import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ColorItem, HarmonyType, HSV, WheelShape } from '../types';
import {
  Sun,
  SunMedium,
  Circle,
  Square,
  Triangle,
  UploadCloud,
} from 'lucide-react';
import { createColorFromHsv, extractPaletteFromImageFile } from '../utils/colorConversions';

interface ColorWheelProps {
  colors: ColorItem[];
  activeId: number;
  harmony: HarmonyType;
  brightness: number; // 0 - 100
  wheelShape: WheelShape;
  onColorChange: (color: ColorItem) => void;
  onBatchColorsChange?: (colors: ColorItem[]) => void;
  onSelectCard: (id: number) => void;
  onBrightnessChange: (brightness: number) => void;
  onHarmonyChange: (harmony: HarmonyType) => void;
  onWheelShapeChange: (shape: WheelShape) => void;
  onImageDropped: (colors: ColorItem[]) => void;
}

export const ColorWheel: React.FC<ColorWheelProps> = ({
  colors,
  activeId,
  harmony,
  brightness,
  wheelShape,
  onColorChange,
  onBatchColorsChange,
  onSelectCard,
  onBrightnessChange,
  onHarmonyChange,
  onWheelShapeChange,
  onImageDropped,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState<number | null>(null);
  const [dragOverWheel, setDragOverWheel] = useState(false);

  // Center & radius
  const size = 380;
  const radius = size / 2;
  const padding = 20;
  const wheelRadius = radius - padding;

  // Render the color wheel canvas with physical HSL/HSV color sweep
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = radius;
    const cy = radius;

    // Clear
    ctx.clearRect(0, 0, size, size);

    const bFactor = Math.max(0, Math.min(1, brightness / 100));

    // If brightness is 0, pure pitch black
    if (bFactor === 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, wheelRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.fill();
      return;
    }

    // Draw circular hue sweep
    const step = 0.5; // half-degree steps for smooth gradient
    for (let angle = 0; angle < 360; angle += step) {
      const startAngle = ((angle - step) * Math.PI) / 180;
      const endAngle = ((angle + step) * Math.PI) / 180;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, wheelRadius, startAngle, endAngle);
      ctx.closePath();

      // Radial gradient from center to edge
      const radGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, wheelRadius);
      const centerGray = Math.round(255 * bFactor);
      radGrad.addColorStop(0, `rgb(${centerGray}, ${centerGray}, ${centerGray})`);

      // Edge color
      const hue = angle;
      const s = 1;
      const v = bFactor;
      const c = v * s;
      const hPrime = hue / 60;
      const x = c * (1 - Math.abs((hPrime % 2) - 1));
      const m = v - c;

      let r1 = 0, g1 = 0, b1 = 0;
      if (hPrime >= 0 && hPrime < 1) { r1 = c; g1 = x; b1 = 0; }
      else if (hPrime >= 1 && hPrime < 2) { r1 = x; g1 = c; b1 = 0; }
      else if (hPrime >= 2 && hPrime < 3) { r1 = 0; g1 = c; b1 = x; }
      else if (hPrime >= 3 && hPrime < 4) { r1 = 0; g1 = x; b1 = c; }
      else if (hPrime >= 4 && hPrime < 5) { r1 = x; g1 = 0; b1 = c; }
      else { r1 = c; g1 = 0; b1 = x; }

      const r = Math.round((r1 + m) * 255);
      const g = Math.round((g1 + m) * 255);
      const b = Math.round((b1 + m) * 255);

      radGrad.addColorStop(1, `rgb(${r}, ${g}, ${b})`);

      ctx.fillStyle = radGrad;
      ctx.fill();
    }
  }, [size, wheelRadius, brightness]);

  // Convert (Hue, Saturation) -> (x, y) coordinates relative to center
  const hsvToCoords = useCallback(
    (hsv: HSV) => {
      const angleRad = (hsv.h * Math.PI) / 180;
      const dist = (hsv.s / 100) * wheelRadius;
      const x = radius + dist * Math.cos(angleRad);
      const y = radius + dist * Math.sin(angleRad);
      return { x, y, angle: hsv.h, dist };
    },
    [radius, wheelRadius]
  );

  // Convert (x, y) relative to canvas center -> (Hue, Saturation)
  const coordsToHsv = useCallback(
    (clientX: number, clientY: number): { h: number; s: number } => {
      const container = containerRef.current;
      if (!container) return { h: 0, s: 0 };
      const rect = container.getBoundingClientRect();
      const clickX = clientX - rect.left - radius;
      const clickY = clientY - rect.top - radius;

      let angleDeg = (Math.atan2(clickY, clickX) * 180) / Math.PI;
      if (angleDeg < 0) angleDeg += 360;

      const dist = Math.hypot(clickX, clickY);
      const sat = Math.min(100, Math.round((dist / wheelRadius) * 100));

      return { h: Math.round(angleDeg), s: sat };
    },
    [radius, wheelRadius]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLElement | SVGElement>, cardId?: number) => {
    e.preventDefault();
    (e.target as HTMLElement | SVGElement).setPointerCapture?.(e.pointerId);

    const targetId = cardId ?? activeId;
    setIsDragging(targetId);
    if (targetId !== activeId) {
      onSelectCard(targetId);
    }

    const { h, s } = coordsToHsv(e.clientX, e.clientY);
    const updated = createColorFromHsv(targetId, { h, s, v: brightness });
    onColorChange(updated);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement | SVGElement>) => {
    if (isDragging === null) return;
    const { h, s } = coordsToHsv(e.clientX, e.clientY);

    // In harmony modes, rotate the entire constellation smoothly around the center
    const activeColor = colors.find(c => c.id === isDragging);
    if (activeColor && onBatchColorsChange && harmony !== 'free') {
      const prevHue = activeColor.hsv.h;
      const deltaHue = (h - prevHue + 360) % 360;

      const newBatch = colors.map(c => {
        if (c.isEmpty || (c.locked && c.id !== isDragging)) return c;
        if (c.id === isDragging) {
          return createColorFromHsv(c.id, { h, s, v: brightness }, c.locked);
        }
        const rotatedH = (c.hsv.h + deltaHue) % 360;
        return createColorFromHsv(c.id, { h: rotatedH, s, v: brightness }, c.locked);
      });
      onBatchColorsChange(newBatch);
      return;
    }

    const updated = createColorFromHsv(isDragging, { h, s, v: brightness });
    onColorChange(updated);
  };

  const handlePointerUp = (_e: React.PointerEvent<HTMLElement | SVGElement>) => {
    if (isDragging !== null) {
      setIsDragging(null);
    }
  };

  // Image Drag & Drop directly onto the Wheel
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverWheel(true);
  };

  const handleDragLeave = () => {
    setDragOverWheel(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverWheel(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      extractPaletteFromImageFile(e.dataTransfer.files[0], newPalette => {
        onImageDropped(newPalette);
      });
    }
  };

  // Calculate coordinates for all active non-empty color nodes
  const activePoints = colors
    .filter(c => !c.isEmpty)
    .map(c => ({ id: c.id, coords: hsvToCoords(c.hsv), color: c }));

  // Render Harmony lines: Clean, mathematically sorted, no crossing lines!
  const renderHarmonyLines = () => {
    if (activePoints.length < 2) return null;

    if (harmony === 'triangular') {
      // 3 vertices sorted in clockwise order around the center
      const pts = activePoints.slice(0, 3);
      if (pts.length >= 3) {
        // Sort points by angle around center so the triangle never self-intersects
        const sorted = [...pts].sort((a, b) => a.coords.angle - b.coords.angle);
        const polygonStr = sorted.map(p => `${p.coords.x},${p.coords.y}`).join(' ');

        return (
          <g className="pointer-events-none filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
            <polygon
              points={polygonStr}
              fill="rgba(255, 255, 255, 0.12)"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Subtle center guide lines */}
            {sorted.map(p => (
              <line
                key={p.id}
                x1={radius}
                y1={radius}
                x2={p.coords.x}
                y2={p.coords.y}
                stroke="rgba(255, 255, 255, 0.35)"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            ))}
            <circle cx={radius} cy={radius} r={3} fill="#FFFFFF" />
          </g>
        );
      }
    } else if (harmony === 'quadratic') {
      // 4 vertices sorted in clockwise order so they ALWAYS form a perfect convex square
      const pts = activePoints.slice(0, 4);
      if (pts.length >= 4) {
        const sorted = [...pts].sort((a, b) => a.coords.angle - b.coords.angle);
        const polygonStr = sorted.map(p => `${p.coords.x},${p.coords.y}`).join(' ');

        return (
          <g className="pointer-events-none filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
            <polygon
              points={polygonStr}
              fill="rgba(255, 255, 255, 0.12)"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Diagonals to center */}
            {sorted.map(p => (
              <line
                key={p.id}
                x1={radius}
                y1={radius}
                x2={p.coords.x}
                y2={p.coords.y}
                stroke="rgba(255, 255, 255, 0.35)"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            ))}
            <circle cx={radius} cy={radius} r={3} fill="#FFFFFF" />
          </g>
        );
      }
    } else if (harmony === 'splitComplementary') {
      // Crisp 3-prong Y-line: Center to base point, center to point 1, center to point 2
      if (activePoints.length >= 3) {
        const pBase = activePoints[0];
        const p1 = activePoints[1];
        const p2 = activePoints[2];
        return (
          <g className="pointer-events-none filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
            <line
              x1={radius}
              y1={radius}
              x2={pBase.coords.x}
              y2={pBase.coords.y}
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <line
              x1={radius}
              y1={radius}
              x2={p1.coords.x}
              y2={p1.coords.y}
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <line
              x1={radius}
              y1={radius}
              x2={p2.coords.x}
              y2={p2.coords.y}
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Center joint */}
            <circle cx={radius} cy={radius} r={4} fill="#FFFFFF" />
          </g>
        );
      }
    } else if (harmony === 'complementary') {
      // Single continuous straight diameter line through center
      if (activePoints.length >= 2) {
        const p1 = activePoints[0];
        const p2 = activePoints[1];
        return (
          <g className="pointer-events-none filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
            <line
              x1={p1.coords.x}
              y1={p1.coords.y}
              x2={p2.coords.x}
              y2={p2.coords.y}
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx={radius} cy={radius} r={3.5} fill="#FFFFFF" />
          </g>
        );
      }
    } else if (harmony === 'analogous') {
      // Connected arc through sorted adjacent points
      const pts = [...activePoints.slice(0, 5)].sort((a, b) => a.coords.angle - b.coords.angle);
      return (
        <g className="pointer-events-none filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
          <polyline
            points={pts.map(p => `${p.coords.x},${p.coords.y}`).join(' ')}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </g>
      );
    } else if (harmony === 'monochromatic') {
      // Radial line along the angle
      return (
        <g className="pointer-events-none filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
          <line
            x1={radius}
            y1={radius}
            x2={activePoints[0].coords.x}
            y2={activePoints[0].coords.y}
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx={radius} cy={radius} r={3} fill="#FFFFFF" />
        </g>
      );
    }

    return null;
  };

  // Shape clipping style
  const getClipPath = () => {
    switch (wheelShape) {
      case 'triangle':
        return 'polygon(50% 4%, 4% 96%, 96% 96%)';
      case 'square':
        return 'inset(4% round 24px)';
      case 'circle':
      default:
        return 'circle(48% at 50% 50%)';
    }
  };

  return (
    <div className="flex flex-col items-center select-none w-full max-w-[480px]">
      {/* 3 Shape Switcher Buttons above the Color Wheel */}
      <div className="flex items-center gap-1 mb-5 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xs">
        <button
          onClick={() => onWheelShapeChange('circle')}
          title="Formato Circular"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            wheelShape === 'circle'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Circle className="w-3.5 h-3.5" />
          <span>Circular</span>
        </button>

        <button
          onClick={() => onWheelShapeChange('triangle')}
          title="Formato Triangular"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            wheelShape === 'triangle'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Triangle className="w-3.5 h-3.5" />
          <span>Triangular</span>
        </button>

        <button
          onClick={() => onWheelShapeChange('square')}
          title="Formato Quadrado"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            wheelShape === 'square'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Square className="w-3.5 h-3.5" />
          <span>Quadrado</span>
        </button>
      </div>

      {/* Interactive Color Wheel / Gamut Canvas Container with Drag & Drop */}
      <div
        ref={containerRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="relative cursor-crosshair touch-none"
        style={{ width: size, height: size }}
        onPointerDown={e => handlePointerDown(e)}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Underlying Canvas with color gamut */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 shadow-[0_12px_36px_rgba(0,0,0,0.12)] border border-neutral-200/60 dark:border-neutral-700/60 transition-all duration-300"
          style={{
            width: size,
            height: size,
            clipPath: getClipPath(),
          }}
        />

        {/* Drag & Drop Overlay feedback */}
        {dragOverWheel && (
          <div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-blue-600/85 backdrop-blur-xs text-white p-6 text-center animate-in fade-in"
            style={{ clipPath: getClipPath() }}
          >
            <UploadCloud className="w-10 h-10 mb-2 animate-bounce" />
            <span className="font-bold text-sm">Solte a imagem aqui</span>
            <span className="text-xs opacity-90">para extrair as cores</span>
          </div>
        )}

        {/* SVG Overlay: Guidelines, Connecting Lines, and Draggable Points */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Subtle concentric grid rings */}
          <circle
            cx={radius}
            cy={radius}
            r={wheelRadius * 0.33}
            fill="none"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <circle
            cx={radius}
            cy={radius}
            r={wheelRadius * 0.66}
            fill="none"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <circle
            cx={radius}
            cy={radius}
            r={wheelRadius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.35)"
            strokeWidth="1"
          />

          {/* 12 Radial Guidelines (every 30 degrees) */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const x2 = radius + wheelRadius * Math.cos(angle);
            const y2 = radius + wheelRadius * Math.sin(angle);
            return (
              <line
                key={i}
                x1={radius}
                y1={radius}
                x2={x2}
                y2={y2}
                stroke="rgba(255, 255, 255, 0.18)"
                strokeWidth="1"
              />
            );
          })}

          {/* Harmony connecting lines (Triangle, Square, Y-line, etc.) */}
          {renderHarmonyLines()}

          {/* Draggable Color Nodes: ONLY BLUE BORDER, NO WHITE/BLACK INNER FILL */}
          {colors.map(color => {
            if (color.isEmpty) return null;
            const { x, y } = hsvToCoords(color.hsv);
            const isActive = color.id === activeId;

            return (
              <g
                key={color.id}
                className="pointer-events-auto cursor-grab active:cursor-grabbing transition-transform"
                style={{ transformOrigin: `${x}px ${y}px` }}
                onPointerDown={e => {
                  e.stopPropagation();
                  handlePointerDown(e, color.id);
                }}
              >
                {/* Active selection: ONLY blue outer ring, no white/black center! */}
                {isActive && (
                  <circle
                    cx={x}
                    cy={y}
                    r={18}
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                    strokeOpacity="0.9"
                  />
                )}

                {/* Node circle: filled with the node's real color */}
                <circle
                  cx={x}
                  cy={y}
                  r={13}
                  fill={color.hex}
                  stroke={isActive ? '#2563EB' : '#FFFFFF'}
                  strokeWidth={isActive ? '3' : '3'}
                  className="filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)] hover:scale-110 transition-transform"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Brightness Slider (allows going all the way to 0% - absolute black) */}
      <div className="w-full mt-6 px-4 flex items-center justify-between gap-3 text-xs font-medium text-neutral-600 dark:text-neutral-300">
        <span className="whitespace-nowrap font-semibold text-neutral-700 dark:text-neutral-200">
          Brightness
        </span>

        <SunMedium className="w-4 h-4 text-neutral-400 shrink-0" />

        <div className="relative flex-1 flex items-center">
          <input
            type="range"
            min="0"
            max="100"
            value={brightness}
            onChange={e => onBrightnessChange(Number(e.target.value))}
            className="w-full h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded-full appearance-none cursor-pointer accent-neutral-800 dark:accent-neutral-200 focus:outline-none"
          />
        </div>

        <Sun className="w-4 h-4 text-neutral-600 dark:text-neutral-300 shrink-0" />

        <span className="w-12 text-right font-mono tabular-nums text-neutral-800 dark:text-neutral-100 font-semibold">
          {brightness}%
        </span>
      </div>

      {/* Professional Harmony Mode Buttons with Clean Geometry SVGs */}
      <div className="w-full mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800/80">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
            Harmonias de cores:{' '}
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {harmony === 'free' && 'Personalizado'}
              {harmony === 'monochromatic' && 'Monocromático'}
              {harmony === 'analogous' && 'Análogo'}
              {harmony === 'complementary' && 'Complementar'}
              {harmony === 'splitComplementary' && 'Dividida Complementar (Y)'}
              {harmony === 'triangular' && 'Triangular'}
              {harmony === 'quadratic' && 'Quadrático'}
            </span>
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {[
            {
              id: 'free',
              label: 'Personalizado',
              svg: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="2" fill="currentColor" />
                  <circle cx="6" cy="8" r="2" fill="currentColor" />
                  <circle cx="18" cy="7" r="2" fill="currentColor" />
                  <circle cx="7" cy="17" r="2" fill="currentColor" />
                  <circle cx="17" cy="16" r="2" fill="currentColor" />
                </svg>
              ),
            },
            {
              id: 'analogous',
              label: 'Análogo',
              svg: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M5 16 A 10 10 0 0 1 19 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="5" cy="16" r="2.5" fill="currentColor" />
                  <circle cx="12" cy="6" r="2.5" fill="currentColor" />
                  <circle cx="19" cy="16" r="2.5" fill="currentColor" />
                </svg>
              ),
            },
            {
              id: 'complementary',
              label: 'Complementar',
              svg: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="4" r="2.5" fill="currentColor" />
                  <circle cx="12" cy="20" r="2.5" fill="currentColor" />
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.4" />
                </svg>
              ),
            },
            {
              id: 'splitComplementary',
              label: 'Dividida (Y)',
              svg: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <line x1="12" y1="12" x2="12" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="12" y1="12" x2="6" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="12" y1="12" x2="18" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="20" r="2.5" fill="currentColor" />
                  <circle cx="6" cy="6" r="2.5" fill="currentColor" />
                  <circle cx="18" cy="6" r="2.5" fill="currentColor" />
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                </svg>
              ),
            },
            {
              id: 'triangular',
              label: 'Triangular',
              svg: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <polygon points="12,4 4,18 20,18" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                  <circle cx="12" cy="4" r="2.5" fill="currentColor" />
                  <circle cx="4" cy="18" r="2.5" fill="currentColor" />
                  <circle cx="20" cy="18" r="2.5" fill="currentColor" />
                </svg>
              ),
            },
            {
              id: 'quadratic',
              label: 'Quadrático',
              svg: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="5" width="14" height="14" rx="1.5" stroke="currentColor" strokeWidth="2" />
                  <circle cx="5" cy="5" r="2.2" fill="currentColor" />
                  <circle cx="19" cy="5" r="2.2" fill="currentColor" />
                  <circle cx="19" cy="19" r="2.2" fill="currentColor" />
                  <circle cx="5" cy="19" r="2.2" fill="currentColor" />
                </svg>
              ),
            },
            {
              id: 'monochromatic',
              label: 'Monocromático',
              svg: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="5" cy="12" r="2" fill="currentColor" opacity="0.4" />
                  <circle cx="12" cy="12" r="2.2" fill="currentColor" opacity="0.7" />
                  <circle cx="19" cy="12" r="2.5" fill="currentColor" />
                </svg>
              ),
            },
          ].map(item => {
            const isSelected = harmony === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onHarmonyChange(item.id as HarmonyType)}
                title={item.label}
                className={`py-2 px-1 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-950/50 dark:text-blue-400 font-bold shadow-xs'
                    : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-750'
                }`}
              >
                {item.svg}
                <span className="text-[9px] truncate max-w-full font-medium">
                  {item.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
