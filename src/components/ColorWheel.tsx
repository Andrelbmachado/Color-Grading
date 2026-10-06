import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ColorItem, HarmonyType, HSV, HSL, WheelShape, VisionMode } from '../types';
import {
  Circle,
  Square,
  Triangle,
  Grid,
  UploadCloud,
} from 'lucide-react';
import {
  createColorFromHsv,
  createColorFromHsl,
  hslToRgb,
  rgbToHex,
  extractPaletteFromImageFile,
} from '../utils/colorConversions';

interface ColorWheelProps {
  colors: ColorItem[];
  activeId: number;
  harmony: HarmonyType;
  wheelShape: WheelShape;
  visionMode: VisionMode;
  onColorChange: (color: ColorItem) => void;
  onBatchColorsChange?: (colors: ColorItem[]) => void;
  onSelectCard: (id: number) => void;
  onHarmonyChange: (harmony: HarmonyType) => void;
  onWheelShapeChange: (shape: WheelShape) => void;
  onImageDropped: (colors: ColorItem[]) => void;
}

type DragTarget = 'ring' | 'triangle' | 'square' | 'matrix' | 'huebar' | 'circle' | null;

export const ColorWheel: React.FC<ColorWheelProps> = ({
  colors,
  activeId,
  harmony,
  wheelShape,
  visionMode,
  onColorChange,
  onBatchColorsChange,
  onSelectCard,
  onHarmonyChange,
  onWheelShapeChange,
  onImageDropped,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dragTarget, setDragTarget] = useState<DragTarget>(null);
  const [dragCardId, setDragCardId] = useState<number | null>(null);
  const [dragOverWheel, setDragOverWheel] = useState(false);

  // Active color item
  const activeColor = colors.find(c => c.id === activeId) || colors[0];
  const activeHsv = activeColor ? activeColor.hsv : { h: 180, s: 100, v: 100 };
  const activeHsl = activeColor ? activeColor.hsl : { h: 180, s: 100, l: 50 };

  // Local state for HSL inputs so user can edit fluidly
  const [hInput, setHInput] = useState<string>(String(activeHsl.h));
  const [sInput, setSInput] = useState<string>(String(activeHsl.s));
  const [lInput, setLInput] = useState<string>(String(activeHsl.l));

  useEffect(() => {
    setHInput(String(activeHsl.h));
    setSInput(String(activeHsl.s));
    setLInput(String(activeHsl.l));
  }, [activeHsl.h, activeHsl.s, activeHsl.l]);

  // Dimensions
  const size = 360;
  const radius = size / 2;
  const cx = radius;
  const cy = radius;

  // Ring dimensions for Triangle and Square modes
  const rOut = 168;
  const rIn = 138;

  // Triangle dimensions (equilateral triangle pointing up)
  const rTri = 126;
  const triVertices = {
    top: { x: cx, y: cy - rTri },
    bl: { x: cx - rTri * Math.cos(Math.PI / 6), y: cy + rTri * Math.sin(Math.PI / 6) },
    br: { x: cx + rTri * Math.cos(Math.PI / 6), y: cy + rTri * Math.sin(Math.PI / 6) },
  };

  // Square dimensions inside ring
  const sqHalf = 86;
  const sqBounds = {
    x0: cx - sqHalf,
    x1: cx + sqHalf,
    y0: cy - sqHalf,
    y1: cy + sqHalf,
  };

  // Matrix 2D dimensions
  const matBounds = {
    x0: 16,
    x1: 296,
    y0: 16,
    y1: 344,
  };
  const barBounds = {
    x0: 316,
    x1: 344,
    y0: 16,
    y1: 344,
  };

  // --------------------------------------------------------------------------
  // Canvas Rendering based on wheelShape
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    // Current Hue color
    const pureHueRgb = hslToRgb({ h: activeHsl.h, s: 100, l: 50 });
    const pureHueHex = rgbToHex(pureHueRgb);

    // --- Helper: Draw 360° Hue Ring ---
    const drawHueRing = () => {
      ctx.save();
      // Outer path
      ctx.beginPath();
      ctx.arc(cx, cy, rOut, 0, Math.PI * 2);
      ctx.arc(cx, cy, rIn, Math.PI * 2, 0, true);
      ctx.closePath();
      ctx.clip();

      // Draw angular sweep
      for (let angle = 0; angle < 360; angle += 0.8) {
        const a1 = ((angle - 1) * Math.PI) / 180;
        const a2 = ((angle + 1) * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, rOut + 2, a1, a2);
        ctx.closePath();
        ctx.fillStyle = `hsl(${angle}, 100%, 50%)`;
        ctx.fill();
      }
      ctx.restore();

      // Ring border outlines
      ctx.save();
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, rOut, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, rIn, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };

    if (wheelShape === 'triangle') {
      // 1. Draw Hue Ring
      drawHueRing();

      // 2. Draw HSL Triangle with Barycentric Dispersion
      // Top: Pure Hue, Bottom-Left: White, Bottom-Right: Black
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(triVertices.top.x, triVertices.top.y);
      ctx.lineTo(triVertices.bl.x, triVertices.bl.y);
      ctx.lineTo(triVertices.br.x, triVertices.br.y);
      ctx.closePath();
      ctx.clip();

      // Render triangle pixel buffer with high performance
      const triW = Math.ceil(triVertices.br.x - triVertices.bl.x);
      const triH = Math.ceil(triVertices.bl.y - triVertices.top.y);
      const offCanvas = document.createElement('canvas');
      offCanvas.width = triW;
      offCanvas.height = triH;
      const offCtx = offCanvas.getContext('2d');

      if (offCtx) {
        const imgData = offCtx.createImageData(triW, triH);
        const data = imgData.data;
        const pTop = { x: triVertices.top.x - triVertices.bl.x, y: 0 };
        const pBl = { x: 0, y: triH };
        const pBr = { x: triW, y: triH };

        const denom = (pBl.y - pBr.y) * (pTop.x - pBr.x) + (pBr.x - pBl.x) * (pTop.y - pBr.y);

        for (let py = 0; py < triH; py++) {
          for (let px = 0; px < triW; px++) {
            const wTop = ((pBl.y - pBr.y) * (px - pBr.x) + (pBr.x - pBl.x) * (py - pBr.y)) / denom;
            const wBl = ((pBr.y - pTop.y) * (px - pBr.x) + (pTop.x - pBr.x) * (py - pBr.y)) / denom;
            const wBr = 1 - wTop - wBl;

            if (wTop >= -0.01 && wBl >= -0.01 && wBr >= -0.01) {
              const idx = (py * triW + px) * 4;
              // R, G, B: wTop * Hue + wBl * White (255) + wBr * Black (0)
              const r = Math.min(255, Math.max(0, Math.round(wTop * pureHueRgb.r + wBl * 255)));
              const g = Math.min(255, Math.max(0, Math.round(wTop * pureHueRgb.g + wBl * 255)));
              const b = Math.min(255, Math.max(0, Math.round(wTop * pureHueRgb.b + wBl * 255)));

              data[idx] = r;
              data[idx + 1] = g;
              data[idx + 2] = b;
              data[idx + 3] = 255;
            }
          }
        }
        offCtx.putImageData(imgData, 0, 0);
        ctx.drawImage(offCanvas, triVertices.bl.x, triVertices.top.y);
      }

      // Triangle stroke outline
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    } else if (wheelShape === 'square') {
      // 1. Draw Hue Ring
      drawHueRing();

      // 2. Draw HSL/HSV Square inside ring
      // Top-Left: White, Top-Right: Pure Hue, Bottom-Left: Black, Bottom-Right: Black
      ctx.save();
      const sqW = sqBounds.x1 - sqBounds.x0;
      const sqH = sqBounds.y1 - sqBounds.y0;

      // Base gradient: Horizontal White to Pure Hue
      const hGrad = ctx.createLinearGradient(sqBounds.x0, 0, sqBounds.x1, 0);
      hGrad.addColorStop(0, '#FFFFFF');
      hGrad.addColorStop(1, pureHueHex);
      ctx.fillStyle = hGrad;
      ctx.fillRect(sqBounds.x0, sqBounds.y0, sqW, sqH);

      // Vertical gradient: Top transparent to Bottom Black
      const vGrad = ctx.createLinearGradient(0, sqBounds.y0, 0, sqBounds.y1);
      vGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vGrad.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = vGrad;
      ctx.fillRect(sqBounds.x0, sqBounds.y0, sqW, sqH);

      // Border outline
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sqBounds.x0, sqBounds.y0, sqW, sqH);
      ctx.restore();
    } else if (wheelShape === 'matrix2d') {
      // 1. Draw Main 2D Box (Saturation X, Value Y)
      ctx.save();
      const mW = matBounds.x1 - matBounds.x0;
      const mH = matBounds.y1 - matBounds.y0;

      // Horizontal White to Pure Hue
      const hGrad = ctx.createLinearGradient(matBounds.x0, 0, matBounds.x1, 0);
      hGrad.addColorStop(0, '#FFFFFF');
      hGrad.addColorStop(1, pureHueHex);
      ctx.fillStyle = hGrad;
      ctx.fillRect(matBounds.x0, matBounds.y0, mW, mH);

      // Vertical Transparent to Black
      const vGrad = ctx.createLinearGradient(0, matBounds.y0, 0, matBounds.y1);
      vGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vGrad.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = vGrad;
      ctx.fillRect(matBounds.x0, matBounds.y0, mW, mH);

      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(matBounds.x0, matBounds.y0, mW, mH);

      // 2. Draw Vertical Hue Spectrum Bar
      const bW = barBounds.x1 - barBounds.x0;
      const bH = barBounds.y1 - barBounds.y0;
      const hueGrad = ctx.createLinearGradient(0, barBounds.y0, 0, barBounds.y1);
      hueGrad.addColorStop(0, '#ff0000');
      hueGrad.addColorStop(1 / 6, '#ffff00');
      hueGrad.addColorStop(2 / 6, '#00ff00');
      hueGrad.addColorStop(3 / 6, '#00ffff');
      hueGrad.addColorStop(4 / 6, '#0000ff');
      hueGrad.addColorStop(5 / 6, '#ff00ff');
      hueGrad.addColorStop(1, '#ff0000');

      ctx.fillStyle = hueGrad;
      ctx.fillRect(barBounds.x0, barBounds.y0, bW, bH);
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.strokeRect(barBounds.x0, barBounds.y0, bW, bH);

      ctx.restore();
    } else {
      // Classical Radial Chromatic Disc
      ctx.save();
      const wheelR = radius - 16;
      for (let angle = 0; angle < 360; angle += 0.8) {
        const startAngle = ((angle - 1) * Math.PI) / 180;
        const endAngle = ((angle + 1) * Math.PI) / 180;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, wheelR, startAngle, endAngle);
        ctx.closePath();

        const radGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, wheelR);
        radGrad.addColorStop(0, '#FFFFFF');
        radGrad.addColorStop(1, `hsl(${angle}, 100%, 50%)`);

        ctx.fillStyle = radGrad;
        ctx.fill();
      }

      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, wheelR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }, [wheelShape, size, radius, activeHsl.h, rOut, rIn, rTri, sqBounds, matBounds, barBounds]);

  // --------------------------------------------------------------------------
  // Coordinate Conversions for Markers and Cursors
  // --------------------------------------------------------------------------

  // Get ring coordinate for any hue
  const hueToRingCoord = (hueDeg: number) => {
    const rad = (hueDeg * Math.PI) / 180;
    const rMid = (rOut + rIn) / 2;
    return {
      x: cx + rMid * Math.cos(rad),
      y: cy + rMid * Math.sin(rad),
    };
  };

  // Convert (S, V) to internal triangle coordinate
  const hsvToTriCoord = (s: number, v: number) => {
    const sNorm = s / 100;
    const vNorm = v / 100;

    const wTop = sNorm * vNorm;
    const wBl = (1 - sNorm) * vNorm;
    const wBr = 1 - vNorm;

    const x = wTop * triVertices.top.x + wBl * triVertices.bl.x + wBr * triVertices.br.x;
    const y = wTop * triVertices.top.y + wBl * triVertices.bl.y + wBr * triVertices.br.y;
    return { x, y };
  };

  // Convert (S, V) to internal square coordinate
  const hsvToSquareCoord = (s: number, v: number) => {
    const sNorm = Math.max(0, Math.min(1, s / 100));
    const vNorm = Math.max(0, Math.min(1, v / 100));
    const sqW = sqBounds.x1 - sqBounds.x0;
    const sqH = sqBounds.y1 - sqBounds.y0;

    return {
      x: sqBounds.x0 + sNorm * sqW,
      y: sqBounds.y0 + (1 - vNorm) * sqH,
    };
  };

  // Convert (S, V) to 2D Matrix coordinate
  const hsvToMatrixCoord = (s: number, v: number) => {
    const sNorm = Math.max(0, Math.min(1, s / 100));
    const vNorm = Math.max(0, Math.min(1, v / 100));
    const mW = matBounds.x1 - matBounds.x0;
    const mH = matBounds.y1 - matBounds.y0;

    return {
      x: matBounds.x0 + sNorm * mW,
      y: matBounds.y0 + (1 - vNorm) * mH,
    };
  };

  // Radial disc coordinates
  const hsvToRadialCoord = (hsv: HSV) => {
    const angleRad = (hsv.h * Math.PI) / 180;
    const wheelR = radius - 16;
    const dist = (hsv.s / 100) * wheelR;
    return {
      x: cx + dist * Math.cos(angleRad),
      y: cy + dist * Math.sin(angleRad),
    };
  };

  // --------------------------------------------------------------------------
  // Interactive Drag & Pointer Handlers
  // --------------------------------------------------------------------------
  const updateFromPointer = (clientX: number, clientY: number, target: DragTarget) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const dx = px - cx;
    const dy = py - cy;
    const dist = Math.hypot(dx, dy);

    if (wheelShape === 'triangle') {
      if (target === 'ring') {
        let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
        if (angleDeg < 0) angleDeg += 360;
        const newHue = Math.round(angleDeg);

        if (harmony !== 'free' && onBatchColorsChange) {
          const delta = newHue - activeHsv.h;
          const updatedBatch = colors.map(c => {
            if (c.isEmpty) return c;
            const updatedH = ((c.hsv.h + delta) % 360 + 360) % 360;
            return createColorFromHsv(c.id, { ...c.hsv, h: updatedH }, false);
          });
          onBatchColorsChange(updatedBatch);
        } else {
          onColorChange(createColorFromHsv(activeId, { ...activeHsv, h: newHue }, false));
        }
      } else if (target === 'triangle') {
        // Calculate barycentric coords
        const denom =
          (triVertices.bl.y - triVertices.br.y) * (triVertices.top.x - triVertices.br.x) +
          (triVertices.br.x - triVertices.bl.x) * (triVertices.top.y - triVertices.br.y);

        let wTop =
          ((triVertices.bl.y - triVertices.br.y) * (px - triVertices.br.x) +
            (triVertices.br.x - triVertices.bl.x) * (py - triVertices.br.y)) /
          denom;
        let wBl =
          ((triVertices.br.y - triVertices.top.y) * (px - triVertices.br.x) +
            (triVertices.top.x - triVertices.br.x) * (py - triVertices.br.y)) /
          denom;
        let wBr = 1 - wTop - wBl;

        // Clamp to triangle edges
        wTop = Math.max(0, wTop);
        wBl = Math.max(0, wBl);
        wBr = Math.max(0, wBr);
        const sum = wTop + wBl + wBr;
        if (sum > 0) {
          wTop /= sum;
          wBl /= sum;
          wBr /= sum;
        }

        const newV = Math.round((1 - wBr) * 100);
        const newS = newV > 0 ? Math.round((wTop / (wTop + wBl)) * 100) : 0;

        onColorChange(
          createColorFromHsv(
            activeId,
            { h: activeHsv.h, s: Math.max(0, Math.min(100, newS)), v: Math.max(0, Math.min(100, newV)) },
            false
          )
        );
      }
    } else if (wheelShape === 'square') {
      if (target === 'ring') {
        let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
        if (angleDeg < 0) angleDeg += 360;
        const newHue = Math.round(angleDeg);

        if (harmony !== 'free' && onBatchColorsChange) {
          const delta = newHue - activeHsv.h;
          const updatedBatch = colors.map(c => {
            if (c.isEmpty) return c;
            const updatedH = ((c.hsv.h + delta) % 360 + 360) % 360;
            return createColorFromHsv(c.id, { ...c.hsv, h: updatedH }, false);
          });
          onBatchColorsChange(updatedBatch);
        } else {
          onColorChange(createColorFromHsv(activeId, { ...activeHsv, h: newHue }, false));
        }
      } else if (target === 'square') {
        const sqW = sqBounds.x1 - sqBounds.x0;
        const sqH = sqBounds.y1 - sqBounds.y0;
        const newS = Math.round(Math.max(0, Math.min(100, ((px - sqBounds.x0) / sqW) * 100)));
        const newV = Math.round(Math.max(0, Math.min(100, (1 - (py - sqBounds.y0) / sqH) * 100)));

        onColorChange(createColorFromHsv(activeId, { h: activeHsv.h, s: newS, v: newV }, false));
      }
    } else if (wheelShape === 'matrix2d') {
      if (target === 'huebar') {
        const bH = barBounds.y1 - barBounds.y0;
        const normY = Math.max(0, Math.min(1, (py - barBounds.y0) / bH));
        const newHue = Math.round(normY * 360);
        onColorChange(createColorFromHsv(activeId, { ...activeHsv, h: newHue }, false));
      } else if (target === 'matrix') {
        const mW = matBounds.x1 - matBounds.x0;
        const mH = matBounds.y1 - matBounds.y0;
        const newS = Math.round(Math.max(0, Math.min(100, ((px - matBounds.x0) / mW) * 100)));
        const newV = Math.round(Math.max(0, Math.min(100, (1 - (py - matBounds.y0) / mH) * 100)));
        onColorChange(createColorFromHsv(activeId, { h: activeHsv.h, s: newS, v: newV }, false));
      }
    } else {
      // Classical radial wheel
      let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (angleDeg < 0) angleDeg += 360;
      const wheelR = radius - 16;
      const sat = Math.min(100, Math.round((dist / wheelR) * 100));

      onColorChange(createColorFromHsv(activeId, { h: Math.round(angleDeg), s: sat, v: activeHsv.v }, false));
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLElement | SVGElement>, cardId?: number) => {
    e.preventDefault();
    (e.target as HTMLElement | SVGElement).setPointerCapture?.(e.pointerId);

    if (cardId !== undefined) {
      onSelectCard(cardId);
      setDragCardId(cardId);
    }

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const dx = px - cx;
    const dy = py - cy;
    const dist = Math.hypot(dx, dy);

    let determinedTarget: DragTarget = null;
    if (wheelShape === 'triangle') {
      if (dist >= rIn - 10) determinedTarget = 'ring';
      else determinedTarget = 'triangle';
    } else if (wheelShape === 'square') {
      if (dist >= rIn - 10) determinedTarget = 'ring';
      else determinedTarget = 'square';
    } else if (wheelShape === 'matrix2d') {
      if (px >= 304) determinedTarget = 'huebar';
      else determinedTarget = 'matrix';
    } else {
      determinedTarget = 'circle';
    }

    setDragTarget(determinedTarget);
    updateFromPointer(e.clientX, e.clientY, determinedTarget);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement | SVGElement>) => {
    if (!dragTarget) return;
    e.preventDefault();
    updateFromPointer(e.clientX, e.clientY, dragTarget);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLElement | SVGElement>) => {
    if (dragTarget) {
      try {
        (e.target as HTMLElement | SVGElement).releasePointerCapture?.(e.pointerId);
      } catch {
        // Ignore
      }
      setDragTarget(null);
      setDragCardId(null);
    }
  };

  // --------------------------------------------------------------------------
  // HSL Inputs & Arrow Stepping
  // --------------------------------------------------------------------------
  const commitHslChange = (h: number, s: number, l: number) => {
    const clampedH = ((Math.round(h) % 360) + 360) % 360;
    const clampedS = Math.max(0, Math.min(100, Math.round(s)));
    const clampedL = Math.max(0, Math.min(100, Math.round(l)));
    onColorChange(createColorFromHsl(activeId, { h: clampedH, s: clampedS, l: clampedL }, false));
  };

  const handleHInputChange = (val: string) => {
    setHInput(val);
    const num = parseInt(val.replace(/\D/g, '') || '0', 10);
    commitHslChange(num, activeHsl.s, activeHsl.l);
  };

  const stepHInput = (delta: number) => {
    const next = ((activeHsl.h + delta) % 360 + 360) % 360;
    setHInput(String(next));
    commitHslChange(next, activeHsl.s, activeHsl.l);
  };

  const handleSInputChange = (val: string) => {
    setSInput(val);
    const num = Math.min(100, parseInt(val.replace(/\D/g, '') || '0', 10));
    commitHslChange(activeHsl.h, num, activeHsl.l);
  };

  const stepSInput = (delta: number) => {
    const next = Math.max(0, Math.min(100, activeHsl.s + delta));
    setSInput(String(next));
    commitHslChange(activeHsl.h, next, activeHsl.l);
  };

  const handleLInputChange = (val: string) => {
    setLInput(val);
    const num = Math.min(100, parseInt(val.replace(/\D/g, '') || '0', 10));
    commitHslChange(activeHsl.h, activeHsl.s, num);
  };

  const stepLInput = (delta: number) => {
    const next = Math.max(0, Math.min(100, activeHsl.l + delta));
    setLInput(String(next));
    commitHslChange(activeHsl.h, activeHsl.s, next);
  };

  // Drag and drop image onto the wheel
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverWheel(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      try {
        extractPaletteFromImageFile(files[0], extracted => {
          onImageDropped(extracted);
        });
      } catch (err) {
        console.error('Falha ao extrair paleta da imagem', err);
      }
    }
  };

  // Active cursor coordinates
  const activeTriCoord = hsvToTriCoord(activeHsv.s, activeHsv.v);
  const activeSqCoord = hsvToSquareCoord(activeHsv.s, activeHsv.v);
  const activeMatCoord = hsvToMatrixCoord(activeHsv.s, activeHsv.v);
  const activeRadialCoord = hsvToRadialCoord(activeHsv);
  const activeBarY = barBounds.y0 + (activeHsl.h / 360) * (barBounds.y1 - barBounds.y0);

  const visionFilterStyle =
    visionMode && visionMode !== 'normal' ? { filter: `url(#${visionMode}-filter)` } : undefined;

  return (
    <div className="flex flex-col items-center select-none w-full max-w-[390px]">
      {/* 1. Format Switcher Buttons: Círculo Radial (FIRST & DEFAULT), Triângulo, Quadrado, Matriz 2D */}
      <div className="w-full grid grid-cols-4 gap-2 mb-3.5 px-0.5">
        {[
          { id: 'circle', label: 'Círculo', icon: Circle },
          { id: 'triangle', label: 'Triângulo', icon: Triangle },
          { id: 'square', label: 'Quadrado', icon: Square },
          { id: 'matrix2d', label: 'Matriz 2D', icon: Grid },
        ].map(item => {
          const Icon = item.icon;
          const isSelected = wheelShape === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onWheelShapeChange(item.id as WheelShape)}
              title={`Formato: ${item.label}`}
              className={`py-2 px-1.5 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white border-2 border-blue-700 shadow-sm dark:bg-blue-600 dark:border-blue-400 font-extrabold'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-950 border-2 border-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-750 dark:text-white dark:border-neutral-700'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Interactive Chromatic Canvas Area */}
      <div
        ref={containerRef}
        onDragOver={e => {
          e.preventDefault();
          setDragOverWheel(true);
        }}
        onDragLeave={() => setDragOverWheel(false)}
        onDrop={handleDrop}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`relative w-[360px] h-[360px] rounded-3xl overflow-hidden cursor-crosshair transition-all ${
          dragOverWheel ? 'ring-4 ring-blue-500 ring-offset-2' : ''
        }`}
        style={visionFilterStyle}
      >
        {/* HTML5 Canvas with physical color dispersion */}
        <canvas ref={canvasRef} className="absolute inset-0 w-[360px] h-[360px] pointer-events-none" />

        {/* Drag over overlay for image drops */}
        {dragOverWheel && (
          <div className="absolute inset-0 bg-blue-600/25 backdrop-blur-xs flex flex-col items-center justify-center text-white font-bold text-sm pointer-events-none z-30">
            <UploadCloud className="w-10 h-10 mb-2 animate-bounce" />
            <span>Solte a imagem para extrair cores</span>
          </div>
        )}

        {/* Interactive SVG Overlay with Markers and Geometric Shapes */}
        <svg
          className="absolute inset-0 w-[360px] h-[360px] pointer-events-none"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* A) In Triangle and Square mode: Draw Ring Markers and Harmony Points */}
          {(wheelShape === 'triangle' || wheelShape === 'square') && (
            <>
              {/* Harmony lines/connections on the outer ring */}
              {harmony !== 'free' && (
                <path
                  d={colors
                    .filter(c => !c.isEmpty)
                    .map((c, i) => {
                      const { x, y } = hueToRingCoord(c.hsv.h);
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ') + (colors.filter(c => !c.isEmpty).length > 2 ? ' Z' : '')}
                  fill="none"
                  stroke="rgba(255,255,255,0.7)"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                />
              )}

              {/* Ring markers for all active colors */}
              {colors.map(color => {
                if (color.isEmpty) return null;
                const { x, y } = hueToRingCoord(color.hsv.h);
                const isActive = color.id === activeId;

                return (
                  <g
                    key={`ring-marker-${color.id}`}
                    className="pointer-events-auto cursor-pointer"
                    onPointerDown={e => {
                      e.stopPropagation();
                      handlePointerDown(e, color.id);
                    }}
                  >
                    {isActive ? (
                      <circle
                        cx={x}
                        cy={y}
                        r={11}
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="3"
                        className="filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
                      />
                    ) : (
                      // Diamond marker on ring (Image 3 style)
                      <rect
                        x={x - 5}
                        y={y - 5}
                        width={10}
                        height={10}
                        transform={`rotate(45 ${x} ${y})`}
                        fill="#FFFFFF"
                        stroke="#000000"
                        strokeWidth="1.5"
                        className="filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] hover:scale-125 transition-transform"
                      />
                    )}
                  </g>
                );
              })}

              {/* Cursor inside Triangle */}
              {wheelShape === 'triangle' && (
                <circle
                  cx={activeTriCoord.x}
                  cy={activeTriCoord.y}
                  r={7}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  className="filter drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)] pointer-events-none"
                />
              )}

              {/* Cursor inside Square */}
              {wheelShape === 'square' && (
                <circle
                  cx={activeSqCoord.x}
                  cy={activeSqCoord.y}
                  r={7}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  className="filter drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)] pointer-events-none"
                />
              )}
            </>
          )}

          {/* B) In Matrix 2D Mode: Cursor in box + Pointer arrows on Hue bar */}
          {wheelShape === 'matrix2d' && (
            <>
              {/* Cursor inside 2D Matrix */}
              <circle
                cx={activeMatCoord.x}
                cy={activeMatCoord.y}
                r={7}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                className="filter drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] pointer-events-none"
              />

              {/* Arrow pointers on vertical Hue bar (Image 3 style: triangular pointer ticks) */}
              <polygon
                points={`${barBounds.x0 - 6},${activeBarY} ${barBounds.x0 - 1},${activeBarY - 4} ${barBounds.x0 - 1},${activeBarY + 4}`}
                fill="#2563EB"
                stroke="#FFFFFF"
                strokeWidth="1"
                className="filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
              />
              <polygon
                points={`${barBounds.x1 + 6},${activeBarY} ${barBounds.x1 + 1},${activeBarY - 4} ${barBounds.x1 + 1},${activeBarY + 4}`}
                fill="#2563EB"
                stroke="#FFFFFF"
                strokeWidth="1"
                className="filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
              />
            </>
          )}

          {/* C) In Circle Radial Mode: Classic radial markers with harmony links */}
          {wheelShape === 'circle' && (
            <>
              {harmony !== 'free' && (
                <path
                  d={colors
                    .filter(c => !c.isEmpty)
                    .map((c, i) => {
                      const { x, y } = hsvToRadialCoord(c.hsv);
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ') + (colors.filter(c => !c.isEmpty).length > 2 ? ' Z' : '')}
                  fill="none"
                  stroke="rgba(255,255,255,0.8)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  className="filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
                />
              )}

              {colors.map(color => {
                if (color.isEmpty) return null;
                const { x, y } = hsvToRadialCoord(color.hsv);
                const isActive = color.id === activeId;

                return (
                  <g
                    key={`circle-marker-${color.id}`}
                    className="pointer-events-auto cursor-grab active:cursor-grabbing"
                    onPointerDown={e => {
                      e.stopPropagation();
                      handlePointerDown(e, color.id);
                    }}
                  >
                    {isActive && (
                      <circle
                        cx={x}
                        cy={y}
                        r={16}
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="2.5"
                        strokeOpacity="0.9"
                      />
                    )}

                    <circle
                      cx={x}
                      cy={y}
                      r={11}
                      fill={color.hex}
                      stroke={isActive ? '#2563EB' : '#FFFFFF'}
                      strokeWidth="2.5"
                      className="filter drop-shadow-[0_2px_5px_rgba(0,0,0,0.4)] hover:scale-110 transition-transform"
                    />
                  </g>
                );
              })}
            </>
          )}
        </svg>
      </div>

      {/* 3. Full HSL Sliders & Editable Inputs (H, S, L with arrow stepping) */}
      <div className="w-full mt-3 px-1 flex flex-col gap-2.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200">
        {/* H - Hue Row */}
        <div className="flex items-center gap-2">
          <span className="w-4 text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase">H</span>
          <div className="relative flex-1 flex flex-col justify-center">
            <input
              type="range"
              min="0"
              max="360"
              value={activeHsl.h}
              onChange={e => commitHslChange(Number(e.target.value), activeHsl.s, activeHsl.l)}
              style={{
                background:
                  'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
              }}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-600 focus:outline-none shadow-2xs border border-neutral-300 dark:border-neutral-600"
            />
          </div>
          {/* Interactive Input with Arrow Stepping */}
          <div className="relative flex items-center">
            <input
              type="text"
              value={hInput}
              onChange={e => handleHInputChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'ArrowUp') { e.preventDefault(); stepHInput(1); }
                if (e.key === 'ArrowDown') { e.preventDefault(); stepHInput(-1); }
              }}
              className="w-13 h-6 text-[10px] font-mono font-bold text-center rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
            <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 absolute right-1 pointer-events-none">°</span>
          </div>
        </div>

        {/* S - Saturation Row */}
        <div className="flex items-center gap-2">
          <span className="w-4 text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase">S</span>
          <div className="relative flex-1 flex flex-col justify-center">
            <input
              type="range"
              min="0"
              max="100"
              value={activeHsl.s}
              onChange={e => commitHslChange(activeHsl.h, Number(e.target.value), activeHsl.l)}
              style={{
                background: `linear-gradient(to right, hsl(${activeHsl.h}, 0%, ${activeHsl.l}%), hsl(${activeHsl.h}, 100%, ${activeHsl.l}%))`,
              }}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-600 focus:outline-none shadow-2xs border border-neutral-300 dark:border-neutral-600"
            />
          </div>
          {/* Interactive Input with Arrow Stepping */}
          <div className="relative flex items-center">
            <input
              type="text"
              value={sInput}
              onChange={e => handleSInputChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'ArrowUp') { e.preventDefault(); stepSInput(1); }
                if (e.key === 'ArrowDown') { e.preventDefault(); stepSInput(-1); }
              }}
              className="w-13 h-6 text-[10px] font-mono font-bold text-center rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
            <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 absolute right-1 pointer-events-none">%</span>
          </div>
        </div>

        {/* L - Lightness Row */}
        <div className="flex items-center gap-2">
          <span className="w-4 text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase">L</span>
          <div className="relative flex-1 flex flex-col justify-center">
            <input
              type="range"
              min="0"
              max="100"
              value={activeHsl.l}
              onChange={e => commitHslChange(activeHsl.h, activeHsl.s, Number(e.target.value))}
              style={{
                background: `linear-gradient(to right, #000000 0%, hsl(${activeHsl.h}, ${activeHsl.s}%, 50%) 50%, #ffffff 100%)`,
              }}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-600 focus:outline-none shadow-2xs border border-neutral-300 dark:border-neutral-600"
            />
          </div>
          {/* Interactive Input with Arrow Stepping */}
          <div className="relative flex items-center">
            <input
              type="text"
              value={lInput}
              onChange={e => handleLInputChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'ArrowUp') { e.preventDefault(); stepLInput(1); }
                if (e.key === 'ArrowDown') { e.preventDefault(); stepLInput(-1); }
              }}
              className="w-13 h-6 text-[10px] font-mono font-bold text-center rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
            <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 absolute right-1 pointer-events-none">%</span>
          </div>
        </div>
      </div>

      {/* 4. Harmony Mode Selection Buttons */}
      <div className="w-full mt-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
        <div className="grid grid-cols-7 gap-1">
          {[
            {
              id: 'free',
              label: 'Personalizado',
              svg: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="4" r="2.5" fill="currentColor" />
                  <circle cx="12" cy="20" r="2.5" fill="currentColor" />
                </svg>
              ),
            },
            {
              id: 'splitComplementary',
              label: 'Dividida (Y)',
              svg: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <line x1="12" y1="12" x2="12" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="12" y1="12" x2="6" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="12" y1="12" x2="18" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="20" r="2.5" fill="currentColor" />
                  <circle cx="6" cy="6" r="2.5" fill="currentColor" />
                  <circle cx="18" cy="6" r="2.5" fill="currentColor" />
                </svg>
              ),
            },
            {
              id: 'triangular',
              label: 'Triangular',
              svg: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="5" cy="12" r="2" fill="currentColor" />
                  <circle cx="12" cy="12" r="2.2" fill="currentColor" />
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
                className={`py-1.5 px-0.5 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-600 text-white font-extrabold shadow-sm dark:border-blue-400'
                    : 'border-neutral-300 bg-neutral-100 hover:bg-neutral-200 text-neutral-950 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-750 font-bold'
                }`}
              >
                {item.svg}
                <span className="text-[8.5px] truncate max-w-full font-bold leading-none">
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
