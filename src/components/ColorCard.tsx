import React, { useRef, useState, useEffect } from 'react';
import { ColorItem, HSL } from '../types';
import {
  parseHexInput,
  rgbToHex,
  cmykToRgb,
  hslToRgb,
  createColorItem,
} from '../utils/colorConversions';
import { Lock, Unlock, Plus, Trash2, Pipette } from 'lucide-react';

interface ColorCardProps {
  color: ColorItem;
  isActive: boolean;
  index: number;
  onSelect: () => void;
  onUpdate: (updated: ColorItem) => void;
  onClear: () => void;
  onToggleLock: () => void;
}

export const ColorCard: React.FC<ColorCardProps> = ({
  color,
  isActive,
  index,
  onSelect,
  onUpdate,
  onClear,
  onToggleLock,
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
      onUpdate(createColorItem(color.id, parsed, color.locked));
    }
  };

  const handleHexBlur = () => {
    const parsed = parseHexInput(hexInput);
    if (parsed) {
      onUpdate(createColorItem(color.id, parsed, color.locked));
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
    onUpdate(createColorItem(color.id, hex, color.locked));
  };

  const commitCmyk = (c: number, m: number, y: number, k: number) => {
    const clampedC = Math.max(0, Math.min(100, c));
    const clampedM = Math.max(0, Math.min(100, m));
    const clampedY = Math.max(0, Math.min(100, y));
    const clampedK = Math.max(0, Math.min(100, k));
    const rgb = cmykToRgb({ c: clampedC, m: clampedM, y: clampedY, k: clampedK });
    const hex = rgbToHex(rgb);
    onUpdate(createColorItem(color.id, hex, color.locked));
  };

  const commitHsl = (h: number, s: number, l: number) => {
    const clampedH = ((h % 360) + 360) % 360;
    const clampedS = Math.max(0, Math.min(100, s));
    const clampedL = Math.max(0, Math.min(100, l));
    const rgb = hslToRgb({ h: clampedH, s: clampedS, l: clampedL });
    const hex = rgbToHex(rgb);
    onUpdate(createColorItem(color.id, hex, color.locked));
  };

  // RGB Individual field handlers
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

  // CMYK Individual field handlers
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

  // HSL Individual field handlers
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

  const pickWithNativeEyeDropper = async () => {
    if ('EyeDropper' in window) {
      try {
        // @ts-ignore
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          onUpdate(createColorItem(color.id, result.sRGBHex.toUpperCase(), color.locked));
        }
      } catch (err) {
        // cancelled
      }
    }
  };

  const labelNumber = String(index + 1).padStart(2, '0');

  return (
    <div
      onClick={onSelect}
      className={`group relative rounded-2xl p-4 transition-all cursor-pointer ${
        isActive
          ? 'border-2 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
          : 'border border-neutral-200/90 dark:border-neutral-700/80 hover:border-neutral-300 dark:hover:border-neutral-600'
      }`}
    >
      {/* 1. TOP PART: Quadrado de cor, Nome no App, Nome Real, Controles de topo */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          {/* Quadrado de Cor */}
          <div className="relative shrink-0">
            {!color.isEmpty ? (
              <div
                className="w-12 h-12 rounded-xl shadow-inner border border-black/10 dark:border-white/10 transition-transform group-hover:scale-105"
                style={{ backgroundColor: color.hex }}
              >
                {color.locked && (
                  <div className="absolute -top-1.5 -left-1.5 p-1 bg-neutral-900 text-white rounded-full shadow text-[10px]">
                    <Lock className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 flex items-center justify-center text-neutral-400 group-hover:text-blue-500 group-hover:border-blue-400 transition-colors bg-neutral-50 dark:bg-neutral-800/40">
                <Plus className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Nome no App e Nome Real */}
          <div className="flex flex-col">
            <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
              Color {labelNumber}
            </span>
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 truncate max-w-[180px]">
              {!color.isEmpty ? color.name : 'Selecionar cor'}
            </span>
          </div>
        </div>

        {/* Ações e Seleção (apenas borda azul, sem preenchimento preto/branco) */}
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          {!color.isEmpty && (
            <div className="flex items-center gap-1">
              {'EyeDropper' in window && (
                <button
                  onClick={pickWithNativeEyeDropper}
                  title="Conta-gotas da tela"
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Pipette className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={onToggleLock}
                title={color.locked ? 'Destravar cor' : 'Travar cor'}
                className={`p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${
                  color.locked
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                }`}
              >
                {color.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={onClear}
                title="Limpar cor"
                className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Radio Indicator (apenas borda azul sem preenchimento) */}
          <div
            onClick={onSelect}
            className={`w-4 h-4 rounded-full transition-all shrink-0 ${
              isActive
                ? 'border-2 border-blue-500 bg-transparent'
                : 'border-2 border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 bg-transparent'
            }`}
          />
        </div>
      </div>

      {/* 2. BOTTOM PART: Controles de cor (HEX, RGB, CMYK, HSL) */}
      <div className="pt-3 grid grid-cols-1 sm:grid-cols-4 gap-2" onClick={e => e.stopPropagation()}>
        {/* HEX */}
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
            HEX
          </span>
          <input
            type="text"
            value={hexInput}
            onChange={handleHexChange}
            onBlur={handleHexBlur}
            disabled={color.isEmpty}
            placeholder="#------"
            className="w-full text-xs font-mono font-semibold py-1 px-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-blue-500 transition-colors uppercase disabled:opacity-50 text-center"
          />
        </div>

        {/* RGB [ R ] [ G ] [ B ] */}
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
            RGB
          </span>
          <div className="flex items-center gap-1">
            <input
              ref={rRef}
              type="text"
              value={rVal}
              placeholder="R"
              disabled={color.isEmpty}
              onChange={e => handleRgbFieldChange('r', e.target.value, gRef)}
              onKeyDown={e => {
                if (e.key === 'ArrowUp') { e.preventDefault(); stepRgb('r', 1); }
                if (e.key === 'ArrowDown') { e.preventDefault(); stepRgb('r', -1); }
              }}
              className="w-full text-[11px] font-mono py-1 px-0.5 text-center rounded-md bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <input
              ref={gRef}
              type="text"
              value={gVal}
              placeholder="G"
              disabled={color.isEmpty}
              onChange={e => handleRgbFieldChange('g', e.target.value, bRef)}
              onKeyDown={e => {
                if (e.key === 'ArrowUp') { e.preventDefault(); stepRgb('g', 1); }
                if (e.key === 'ArrowDown') { e.preventDefault(); stepRgb('g', -1); }
              }}
              className="w-full text-[11px] font-mono py-1 px-0.5 text-center rounded-md bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <input
              ref={bRef}
              type="text"
              value={bVal}
              placeholder="B"
              disabled={color.isEmpty}
              onChange={e => handleRgbFieldChange('b', e.target.value)}
              onKeyDown={e => {
                if (e.key === 'ArrowUp') { e.preventDefault(); stepRgb('b', 1); }
                if (e.key === 'ArrowDown') { e.preventDefault(); stepRgb('b', -1); }
              }}
              className="w-full text-[11px] font-mono py-1 px-0.5 text-center rounded-md bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
          </div>
        </div>

        {/* CMYK [ C ] [ M ] [ Y ] [ K ] */}
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
            CMYK
          </span>
          <div className="flex items-center gap-0.5">
            <input
              ref={cRef}
              type="text"
              value={cVal}
              placeholder="C"
              disabled={color.isEmpty}
              onChange={e => handleCmykFieldChange('c', e.target.value, mRef)}
              onKeyDown={e => {
                if (e.key === 'ArrowUp') { e.preventDefault(); stepCmyk('c', 1); }
                if (e.key === 'ArrowDown') { e.preventDefault(); stepCmyk('c', -1); }
              }}
              className="w-full text-[10px] font-mono py-1 px-0.5 text-center rounded-md bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <input
              ref={mRef}
              type="text"
              value={mVal}
              placeholder="M"
              disabled={color.isEmpty}
              onChange={e => handleCmykFieldChange('m', e.target.value, yRef)}
              onKeyDown={e => {
                if (e.key === 'ArrowUp') { e.preventDefault(); stepCmyk('m', 1); }
                if (e.key === 'ArrowDown') { e.preventDefault(); stepCmyk('m', -1); }
              }}
              className="w-full text-[10px] font-mono py-1 px-0.5 text-center rounded-md bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <input
              ref={yRef}
              type="text"
              value={yVal}
              placeholder="Y"
              disabled={color.isEmpty}
              onChange={e => handleCmykFieldChange('y', e.target.value, kRef)}
              onKeyDown={e => {
                if (e.key === 'ArrowUp') { e.preventDefault(); stepCmyk('y', 1); }
                if (e.key === 'ArrowDown') { e.preventDefault(); stepCmyk('y', -1); }
              }}
              className="w-full text-[10px] font-mono py-1 px-0.5 text-center rounded-md bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <input
              ref={kRef}
              type="text"
              value={kVal}
              placeholder="K"
              disabled={color.isEmpty}
              onChange={e => handleCmykFieldChange('k', e.target.value)}
              onKeyDown={e => {
                if (e.key === 'ArrowUp') { e.preventDefault(); stepCmyk('k', 1); }
                if (e.key === 'ArrowDown') { e.preventDefault(); stepCmyk('k', -1); }
              }}
              className="w-full text-[10px] font-mono py-1 px-0.5 text-center rounded-md bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
          </div>
        </div>

        {/* HSL [ H ] [ S ] [ L ] (Adicionado ao lado de CMYK) */}
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
            HSL
          </span>
          <div className="flex items-center gap-1">
            <input
              ref={hRef}
              type="text"
              value={hVal}
              placeholder="H"
              disabled={color.isEmpty}
              onChange={e => handleHslFieldChange('h', e.target.value, sRef)}
              onKeyDown={e => {
                if (e.key === 'ArrowUp') { e.preventDefault(); stepHsl('h', 1); }
                if (e.key === 'ArrowDown') { e.preventDefault(); stepHsl('h', -1); }
              }}
              className="w-full text-[11px] font-mono py-1 px-0.5 text-center rounded-md bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <input
              ref={sRef}
              type="text"
              value={sVal}
              placeholder="S"
              disabled={color.isEmpty}
              onChange={e => handleHslFieldChange('s', e.target.value, lRef)}
              onKeyDown={e => {
                if (e.key === 'ArrowUp') { e.preventDefault(); stepHsl('s', 1); }
                if (e.key === 'ArrowDown') { e.preventDefault(); stepHsl('s', -1); }
              }}
              className="w-full text-[11px] font-mono py-1 px-0.5 text-center rounded-md bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <input
              ref={lRef}
              type="text"
              value={lVal}
              placeholder="L"
              disabled={color.isEmpty}
              onChange={e => handleHslFieldChange('l', e.target.value)}
              onKeyDown={e => {
                if (e.key === 'ArrowUp') { e.preventDefault(); stepHsl('l', 1); }
                if (e.key === 'ArrowDown') { e.preventDefault(); stepHsl('l', -1); }
              }}
              className="w-full text-[11px] font-mono py-1 px-0.5 text-center rounded-md bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
