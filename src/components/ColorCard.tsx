import React, { useRef, useState, useEffect } from 'react';
import { ColorItem, VisionMode } from '../types';
import {
  parseHexInput,
  rgbToHex,
  cmykToRgb,
  hslToRgb,
  createColorItem,
  createColorFromHsl,
  getContrastRatio,
} from '../utils/colorConversions';
import { Plus } from 'lucide-react';

interface ColorCardProps {
  color: ColorItem;
  isActive: boolean;
  index: number;
  visionMode?: VisionMode;
  onSelect: () => void;
  onUpdate: (updated: ColorItem) => void;
}

interface NumericSpecProps {
  label: string;
  value: string;
  max: number;
  disabled?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onSlide: (value: string) => void;
  onStep: (delta: number) => void;
  onSelect: () => void;
}

function NumericSpec({ label, value, max, disabled, inputRef, onChange, onSlide, onStep, onSelect }: NumericSpecProps) {
  const [editing, setEditing] = useState(false);
  const fallbackRef = useRef<HTMLInputElement | null>(null);
  const textRef = inputRef ?? fallbackRef;
  const rangeRef = useRef<HTMLInputElement | null>(null);
  const numericValue = Math.max(0, Math.min(max, Number(value) || 0));
  const startEditing = () => {
    if (disabled) return;
    setEditing(true);
    textRef.current?.focus();
    textRef.current?.select();
  };

  return (
    <div
      className={`numeric-spec ${editing ? 'is-editing' : ''} ${disabled ? 'is-disabled' : ''}`}
      style={{ '--spec-progress': `${numericValue / max * 100}%` } as React.CSSProperties}
      title="Arraste para ajustar. Dois cliques ou Enter para digitar."
    >
      <span className="spec-fill" aria-hidden="true" />
      <input
        ref={textRef}
        type="text"
        inputMode="numeric"
        aria-label={label}
        value={value}
        placeholder={label.split(' ').pop()}
        disabled={disabled}
        tabIndex={editing ? 0 : -1}
        aria-hidden={!editing}
        onFocus={() => { setEditing(true); onSelect(); }}
        onBlur={() => setEditing(false)}
        onChange={event => onChange(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === 'Escape') {
            event.preventDefault();
            setEditing(false);
            rangeRef.current?.focus();
          }
          if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
            onStep(event.key === 'ArrowUp' ? 1 : -1);
          }
        }}
        className="spec-input spec-value"
      />
      <input
        ref={rangeRef}
        type="range"
        aria-label={label}
        aria-hidden={editing}
        tabIndex={editing ? -1 : 0}
        min={0}
        max={max}
        step={1}
        value={numericValue}
        disabled={disabled}
        onFocus={onSelect}
        onChange={event => onSlide(event.target.value)}
        onDoubleClick={startEditing}
        onKeyDown={event => {
          if (event.key === 'Enter') { event.preventDefault(); startEditing(); }
        }}
        className="spec-slider"
      />
    </div>
  );
}

export const ColorCard: React.FC<ColorCardProps> = ({
  color,
  isActive,
  index,
  visionMode,
  onSelect,
  onUpdate,
}) => {
  const [hexInput, setHexInput] = useState(color.hex);

  // RGB individual inputs
  const [rVal, setRVal] = useState(color.isEmpty ? '' : String(color.rgb.r));
  const [gVal, setGVal] = useState(color.isEmpty ? '' : String(color.rgb.g));
  const [bVal, setBVal] = useState(color.isEmpty ? '' : String(color.rgb.b));

  // CMYK individual inputs
  const [cVal, setCVal] = useState(color.isEmpty ? '' : String(color.cmyk.c));
  const [mVal, setMVal] = useState(color.isEmpty ? '' : String(color.cmyk.m));
  const [yVal, setYVal] = useState(color.isEmpty ? '' : String(color.cmyk.y));
  const [kVal, setKVal] = useState(color.isEmpty ? '' : String(color.cmyk.k));

  // HSL individual inputs
  const [hVal, setHVal] = useState(color.isEmpty ? '' : String(color.hsl.h));
  const [sVal, setSVal] = useState(color.isEmpty ? '' : String(color.hsl.s));
  const [lVal, setLVal] = useState(color.isEmpty ? '' : String(color.hsl.l));

  // Refs for auto-focus transition
  const rRef = useRef<HTMLInputElement | null>(null);
  const gRef = useRef<HTMLInputElement | null>(null);
  const bRef = useRef<HTMLInputElement | null>(null);

  const cRef = useRef<HTMLInputElement | null>(null);
  const mRef = useRef<HTMLInputElement | null>(null);
  const yRef = useRef<HTMLInputElement | null>(null);
  const kRef = useRef<HTMLInputElement | null>(null);

  const hRef = useRef<HTMLInputElement | null>(null);
  const sRef = useRef<HTMLInputElement | null>(null);
  const lRef = useRef<HTMLInputElement | null>(null);

  // Sync internal state with color prop
  useEffect(() => {
    if (!color.isEmpty) {
      setHexInput(color.hex);
      setRVal(String(color.rgb.r));
      setGVal(String(color.rgb.g));
      setBVal(String(color.rgb.b));
      setCVal(String(color.cmyk.c));
      setMVal(String(color.cmyk.m));
      setYVal(String(color.cmyk.y));
      setKVal(String(color.cmyk.k));
      setHVal(String(color.hsl.h));
      setSVal(String(color.hsl.s));
      setLVal(String(color.hsl.l));
    } else {
      setHexInput('#------');
      setRVal('');
      setGVal('');
      setBVal('');
      setCVal('');
      setMVal('');
      setYVal('');
      setKVal('');
      setHVal('');
      setSVal('');
      setLVal('');
    }
  }, [color]);

  // HEX Handlers
  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    const parsed = parseHexInput(val);
    if (parsed) {
      onUpdate(createColorItem(color.id, parsed, false));
    }
  };

  const handleHexBlur = () => {
    const parsed = parseHexInput(hexInput);
    if (parsed) {
      onUpdate(createColorItem(color.id, parsed, false));
    } else if (!color.isEmpty) {
      setHexInput(color.hex);
    }
  };

  // Commit helpers
  const commitRgb = (r: number, g: number, b: number) => {
    const clampedR = Math.max(0, Math.min(255, r));
    const clampedG = Math.max(0, Math.min(255, g));
    const clampedB = Math.max(0, Math.min(255, b));
    const hex = rgbToHex({ r: clampedR, g: clampedG, b: clampedB });
    onUpdate(createColorItem(color.id, hex, false));
  };

  const commitCmyk = (c: number, m: number, y: number, k: number) => {
    const clampedC = Math.max(0, Math.min(100, c));
    const clampedM = Math.max(0, Math.min(100, m));
    const clampedY = Math.max(0, Math.min(100, y));
    const clampedK = Math.max(0, Math.min(100, k));
    const rgb = cmykToRgb({ c: clampedC, m: clampedM, y: clampedY, k: clampedK });
    const hex = rgbToHex(rgb);
    onUpdate(createColorItem(color.id, hex, false));
  };

  const commitHsl = (h: number, s: number, l: number) => {
    const clampedH = ((h % 360) + 360) % 360;
    const clampedS = Math.max(0, Math.min(100, s));
    const clampedL = Math.max(0, Math.min(100, l));
    onUpdate(createColorFromHsl(color.id, { h: clampedH, s: clampedS, l: clampedL }, false));
  };

  // Field change handlers with auto advance
  const handleRgbFieldChange = (
    channel: 'r' | 'g' | 'b',
    val: string,
    nextRef?: React.RefObject<HTMLInputElement | null>
  ) => {
    const numeric = val.replace(/\D/g, '').slice(0, 3);
    const num = Math.min(255, parseInt(numeric || '0', 10));

    if (channel === 'r') {
      setRVal(numeric);
      commitRgb(num, parseInt(gVal || '0', 10), parseInt(bVal || '0', 10));
      if (numeric.length === 3 || num > 25) nextRef?.current?.focus();
    } else if (channel === 'g') {
      setGVal(numeric);
      commitRgb(parseInt(rVal || '0', 10), num, parseInt(bVal || '0', 10));
      if (numeric.length === 3 || num > 25) nextRef?.current?.focus();
    } else if (channel === 'b') {
      setBVal(numeric);
      commitRgb(parseInt(rVal || '0', 10), parseInt(gVal || '0', 10), num);
    }
  };

  const stepRgb = (channel: 'r' | 'g' | 'b', delta: number) => {
    const curR = parseInt(rVal || '0', 10);
    const curG = parseInt(gVal || '0', 10);
    const curB = parseInt(bVal || '0', 10);

    if (channel === 'r') {
      const next = Math.max(0, Math.min(255, curR + delta));
      setRVal(String(next));
      commitRgb(next, curG, curB);
    } else if (channel === 'g') {
      const next = Math.max(0, Math.min(255, curG + delta));
      setGVal(String(next));
      commitRgb(curR, next, curB);
    } else if (channel === 'b') {
      const next = Math.max(0, Math.min(255, curB + delta));
      setBVal(String(next));
      commitRgb(curR, curG, next);
    }
  };

  const handleCmykFieldChange = (
    channel: 'c' | 'm' | 'y' | 'k',
    val: string,
    nextRef?: React.RefObject<HTMLInputElement | null>
  ) => {
    const numeric = val.replace(/\D/g, '').slice(0, 3);
    const num = Math.min(100, parseInt(numeric || '0', 10));

    const curC = channel === 'c' ? num : parseInt(cVal || '0', 10);
    const curM = channel === 'm' ? num : parseInt(mVal || '0', 10);
    const curY = channel === 'y' ? num : parseInt(yVal || '0', 10);
    const curK = channel === 'k' ? num : parseInt(kVal || '0', 10);

    if (channel === 'c') setCVal(numeric);
    if (channel === 'm') setMVal(numeric);
    if (channel === 'y') setYVal(numeric);
    if (channel === 'k') setKVal(numeric);

    commitCmyk(curC, curM, curY, curK);
    if ((numeric.length === 3 || num >= 10) && nextRef) {
      nextRef.current?.focus();
    }
  };

  const stepCmyk = (channel: 'c' | 'm' | 'y' | 'k', delta: number) => {
    const curC = parseInt(cVal || '0', 10);
    const curM = parseInt(mVal || '0', 10);
    const curY = parseInt(yVal || '0', 10);
    const curK = parseInt(kVal || '0', 10);

    let nextC = curC, nextM = curM, nextY = curY, nextK = curK;
    if (channel === 'c') nextC = Math.max(0, Math.min(100, curC + delta));
    if (channel === 'm') nextM = Math.max(0, Math.min(100, curM + delta));
    if (channel === 'y') nextY = Math.max(0, Math.min(100, curY + delta));
    if (channel === 'k') nextK = Math.max(0, Math.min(100, curK + delta));

    if (channel === 'c') setCVal(String(nextC));
    if (channel === 'm') setMVal(String(nextM));
    if (channel === 'y') setYVal(String(nextY));
    if (channel === 'k') setKVal(String(nextK));

    commitCmyk(nextC, nextM, nextY, nextK);
  };

  const handleHslFieldChange = (
    channel: 'h' | 's' | 'l',
    val: string,
    nextRef?: React.RefObject<HTMLInputElement | null>
  ) => {
    const numeric = val.replace(/\D/g, '').slice(0, 3);
    const maxVal = channel === 'h' ? 360 : 100;
    const num = Math.min(maxVal, parseInt(numeric || '0', 10));

    const curH = channel === 'h' ? num : parseInt(hVal || '0', 10);
    const curS = channel === 's' ? num : parseInt(sVal || '0', 10);
    const curL = channel === 'l' ? num : parseInt(lVal || '0', 10);

    if (channel === 'h') setHVal(numeric);
    if (channel === 's') setSVal(numeric);
    if (channel === 'l') setLVal(numeric);

    commitHsl(curH, curS, curL);
    if ((numeric.length === 3 || (channel === 'h' ? num > 36 : num >= 10)) && nextRef) {
      nextRef.current?.focus();
    }
  };

  const stepHsl = (channel: 'h' | 's' | 'l', delta: number) => {
    const curH = parseInt(hVal || '0', 10);
    const curS = parseInt(sVal || '0', 10);
    const curL = parseInt(lVal || '0', 10);

    let nextH = curH, nextS = curS, nextL = curL;
    if (channel === 'h') nextH = ((curH + delta) % 360 + 360) % 360;
    if (channel === 's') nextS = Math.max(0, Math.min(100, curS + delta));
    if (channel === 'l') nextL = Math.max(0, Math.min(100, curL + delta));

    if (channel === 'h') setHVal(String(nextH));
    if (channel === 's') setSVal(String(nextS));
    if (channel === 'l') setLVal(String(nextL));

    commitHsl(nextH, nextS, nextL);
  };

  // WCAG Contrast calculation
  const contrastWhite = !color.isEmpty ? getContrastRatio(color.hex, '#FFFFFF') : 1;
  const contrastBlack = !color.isEmpty ? getContrastRatio(color.hex, '#000000') : 1;
  const isAaWhite = contrastWhite >= 4.5;
  const isAaaWhite = contrastWhite >= 7.0;
  const isAaBlack = contrastBlack >= 4.5;
  const isAaaBlack = contrastBlack >= 7.0;

  // Tonal lightness scale (10% to 90%)
  const lightnessStops = [10, 20, 30, 40, 50, 60, 70, 80, 90];
  const tonalScale = !color.isEmpty
    ? lightnessStops.map(stop => {
        const rgb = hslToRgb({ h: color.hsl.h, s: color.hsl.s, l: stop });
        return { stop, hex: rgbToHex(rgb) };
      })
    : [];

  const labelNumber = String(index + 1).padStart(2, '0');
  const visionFilterStyle =
    visionMode && visionMode !== 'normal' ? { filter: `url(#${visionMode}-filter)` } : undefined;

  return (
    <div
      onClick={onSelect}
      className={`color-card group relative rounded-xl p-3 transition-all cursor-pointer select-none ${
        isActive
          ? 'border-2 border-blue-500 ring-2 ring-blue-500/20 shadow-xs bg-blue-500/2 dark:bg-blue-500/5'
          : 'border border-neutral-200/90 dark:border-neutral-700/80 hover:border-neutral-300 dark:hover:border-neutral-600 bg-white dark:bg-neutral-900/60'
      }`}
    >
      {/* 1. TOP HEADER ROW: Swatch + Names (Left) and CONTRAST METRICS AT THE TOP (Right) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Swatch (compact 26x26) */}
          <div className="relative shrink-0">
            {!color.isEmpty ? (
              <div
                className="w-8 h-8 rounded-md shadow-2xs border border-black/10 dark:border-white/10 transition-transform group-hover:scale-105"
                style={{ backgroundColor: color.hex, ...visionFilterStyle }}
              />
            ) : (
              <div className="w-8 h-8 rounded-md border-2 border-dashed border-neutral-300 dark:border-neutral-600 flex items-center justify-center text-neutral-400 group-hover:text-blue-500 group-hover:border-blue-400 transition-colors bg-neutral-50 dark:bg-neutral-800/40">
                <Plus className="w-3 h-3" />
              </div>
            )}
          </div>

          {/* Color 01 + Real Name */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
              Color {labelNumber}
            </span>
            <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 truncate max-w-[210px]">
              {!color.isEmpty ? `· ${color.name}` : '· Vazio'}
            </span>
          </div>
        </div>

        {/* CONTRAST AREA AT THE TOP OF THE CARD (Saves vertical space) */}
        {!color.isEmpty ? (
          <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
            {/* vs White */}
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-white border border-neutral-300 dark:border-neutral-500 shrink-0" />
              <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">{contrastWhite}:1</span>
              <span className={`text-[7.5px] font-extrabold px-1 py-0.2 rounded leading-tight ${
                isAaaWhite ? 'bg-emerald-600 text-white' : isAaWhite ? 'bg-blue-600 text-white' : 'bg-neutral-300 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
              }`}>
                {isAaaWhite ? 'AAA' : isAaWhite ? 'AA' : 'Fail'}
              </span>
            </div>

            {/* vs Black */}
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-black border border-neutral-600 dark:border-neutral-400 shrink-0" />
              <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">{contrastBlack}:1</span>
              <span className={`text-[7.5px] font-extrabold px-1 py-0.2 rounded leading-tight ${
                isAaaBlack ? 'bg-emerald-600 text-white' : isAaBlack ? 'bg-blue-600 text-white' : 'bg-neutral-300 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
              }`}>
                {isAaaBlack ? 'AAA' : isAaBlack ? 'AA' : 'Fail'}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 italic">
            Clique no círculo
          </span>
        )}
      </div>

      {/* 2. TONAL LIGHTNESS SCALE WITH CURRENT COLOR ARROW POINTER */}
      {!color.isEmpty && (
        <div className="relative w-full mt-3 mb-2" onClick={e => e.stopPropagation()}>
          <div className="grid grid-cols-9 gap-0.5 mb-2">
            {tonalScale.map(item => (
              <button
                key={item.stop}
                type="button"
                aria-label={`Cor ${labelNumber}: luminosidade ${item.stop}%`}
                aria-pressed={color.hsl.l === item.stop}
                onClick={() => onUpdate(createColorFromHsl(color.id, { h: color.hsl.h, s: color.hsl.s, l: item.stop }, false))}
                className={`h-6 min-w-0 rounded border text-[9px] font-mono font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400 ${color.hsl.l === item.stop ? 'bg-neutral-700 border-neutral-700 text-white dark:bg-neutral-400 dark:border-neutral-400 dark:text-neutral-950' : 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700'}`}
                title={`Aplicar luminosidade ${item.stop}%`}
              >
                {item.stop}%
              </button>
            ))}
          </div>
          <div className="relative pt-2">
          {/* Arrow pointing down directly to original/current color's lightness position */}
          <div
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-150 z-10"
            style={{ left: `${Math.max(4, Math.min(96, color.hsl.l))}%` }}
            title={`Posição da cor original no espectro escuro-claro: ${color.hsl.l}%`}
          >
            <svg width="8" height="6" viewBox="0 0 8 6" fill="none" className="text-neutral-600 dark:text-neutral-300 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">
              <path d="M4 6L0.5 0.5H7.5L4 6Z" fill="currentColor" />
            </svg>
          </div>

          {/* Dark-to-Light Degrade Strip */}
          <div className="flex items-center gap-0.5 h-2 rounded-sm overflow-hidden w-full bg-neutral-200 dark:bg-neutral-800 p-0.2 border border-black/10 dark:border-white/10">
            {tonalScale.map(item => (
              <button
                type="button"
                aria-label={`Aplicar luminosidade ${item.stop}% à cor ${labelNumber}`}
                key={item.stop}
                onClick={e => {
                  e.stopPropagation();
                  onUpdate(createColorFromHsl(color.id, { h: color.hsl.h, s: color.hsl.s, l: item.stop }, false));
                }}
                className="flex-1 h-full rounded-2xs hover:scale-125 transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-neutral-400"
                style={{ backgroundColor: item.hex, ...visionFilterStyle }}
                title={`Aplicar luminosidade ${item.stop}% (${item.hex})`}
              />
            ))}
          </div>
          </div>
        </div>
      )}

      {/* The numeric fields themselves slide and fill; Enter or double-click keeps direct typing. */}
      <div className="color-specs" onClick={event => event.stopPropagation()}>
        <div className="spec-group">
          <label htmlFor={`hex-${color.id}`} className="spec-label">HEX</label>
          <input
            id={`hex-${color.id}`} type="text" value={hexInput}
            onFocus={onSelect} onChange={handleHexChange} onBlur={handleHexBlur}
            disabled={color.isEmpty} placeholder="#------"
            className="spec-input uppercase"
          />
        </div>
        <div className="spec-group">
          <span className="spec-label">RGB</span>
          <div className="spec-channels">
            <NumericSpec
              label={`Cor ${labelNumber} RGB R`}
              value={rVal} max={255} disabled={color.isEmpty} inputRef={rRef}
              onSelect={onSelect}
              onChange={value => handleRgbFieldChange('r', value, gRef)}
              onSlide={value => handleRgbFieldChange('r', value)}
              onStep={delta => stepRgb('r', delta)}
            />
            <NumericSpec
              label={`Cor ${labelNumber} RGB G`}
              value={gVal} max={255} disabled={color.isEmpty} inputRef={gRef}
              onSelect={onSelect}
              onChange={value => handleRgbFieldChange('g', value, bRef)}
              onSlide={value => handleRgbFieldChange('g', value)}
              onStep={delta => stepRgb('g', delta)}
            />
            <NumericSpec
              label={`Cor ${labelNumber} RGB B`}
              value={bVal} max={255} disabled={color.isEmpty} inputRef={bRef}
              onSelect={onSelect}
              onChange={value => handleRgbFieldChange('b', value)}
              onSlide={value => handleRgbFieldChange('b', value)}
              onStep={delta => stepRgb('b', delta)}
            />
          </div>
        </div>
        <div className="spec-group">
          <span className="spec-label">CMYK</span>
          <div className="spec-channels">
            <NumericSpec
              label={`Cor ${labelNumber} CMYK C`}
              value={cVal} max={100} disabled={color.isEmpty} inputRef={cRef}
              onSelect={onSelect}
              onChange={value => handleCmykFieldChange('c', value, mRef)}
              onSlide={value => handleCmykFieldChange('c', value)}
              onStep={delta => stepCmyk('c', delta)}
            />
            <NumericSpec
              label={`Cor ${labelNumber} CMYK M`}
              value={mVal} max={100} disabled={color.isEmpty} inputRef={mRef}
              onSelect={onSelect}
              onChange={value => handleCmykFieldChange('m', value, yRef)}
              onSlide={value => handleCmykFieldChange('m', value)}
              onStep={delta => stepCmyk('m', delta)}
            />
            <NumericSpec
              label={`Cor ${labelNumber} CMYK Y`}
              value={yVal} max={100} disabled={color.isEmpty} inputRef={yRef}
              onSelect={onSelect}
              onChange={value => handleCmykFieldChange('y', value, kRef)}
              onSlide={value => handleCmykFieldChange('y', value)}
              onStep={delta => stepCmyk('y', delta)}
            />
            <NumericSpec
              label={`Cor ${labelNumber} CMYK K`}
              value={kVal} max={100} disabled={color.isEmpty} inputRef={kRef}
              onSelect={onSelect}
              onChange={value => handleCmykFieldChange('k', value)}
              onSlide={value => handleCmykFieldChange('k', value)}
              onStep={delta => stepCmyk('k', delta)}
            />
          </div>
        </div>
        <div className="spec-group">
          <span className="spec-label">HSL</span>
          <div className="spec-channels">
            <NumericSpec
              label={`Cor ${labelNumber} HSL H`}
              value={hVal} max={360} disabled={color.isEmpty} inputRef={hRef}
              onSelect={onSelect}
              onChange={value => handleHslFieldChange('h', value, sRef)}
              onSlide={value => handleHslFieldChange('h', value)}
              onStep={delta => stepHsl('h', delta)}
            />
            <NumericSpec
              label={`Cor ${labelNumber} HSL S`}
              value={sVal} max={100} disabled={color.isEmpty} inputRef={sRef}
              onSelect={onSelect}
              onChange={value => handleHslFieldChange('s', value, lRef)}
              onSlide={value => handleHslFieldChange('s', value)}
              onStep={delta => stepHsl('s', delta)}
            />
            <NumericSpec
              label={`Cor ${labelNumber} HSL L`}
              value={lVal} max={100} disabled={color.isEmpty} inputRef={lRef}
              onSelect={onSelect}
              onChange={value => handleHslFieldChange('l', value)}
              onSlide={value => handleHslFieldChange('l', value)}
              onStep={delta => stepHsl('l', delta)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
