import React, { useState } from 'react';
import { ColorItem } from '../types';
import {
  getContrastRatio,
  simulateColorBlindness,
  rgbToHex,
  hexToRgb,
  rgbToHsl,
  hslToRgb,
} from '../utils/colorConversions';
import { Eye, ShieldCheck, Check, AlertCircle } from 'lucide-react';

interface ContrastViewProps {
  colors: ColorItem[];
  activeColor: ColorItem;
  onSelectColor: (id: number) => void;
  onUpdateColor: (color: ColorItem) => void;
}

export const ContrastView: React.FC<ContrastViewProps> = ({
  colors,
  activeColor,
  onSelectColor,
  onUpdateColor,
}) => {
  const [blindnessMode, setBlindnessMode] = useState<
    'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia'
  >('normal');

  // Generate 10 lightness stops for active color (10% to 90% lightness)
  const generateLightnessScale = (hex: string) => {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb);
    const stops = [10, 20, 30, 40, 50, 60, 70, 80, 90, 95];
    return stops.map(l => {
      const stepRgb = hslToRgb({ h: hsl.h, s: hsl.s, l });
      return {
        level: l,
        hex: rgbToHex(stepRgb),
      };
    });
  };

  const activeScale = generateLightnessScale(activeColor.hex);

  return (
    <div className="w-full flex flex-col gap-6 max-w-2xl py-2">
      {/* Daltonism / Accessibility Filter Selector */}
      <div className="bg-white dark:bg-neutral-850 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              Simulador de Daltonismo
            </span>
          </div>
          <span className="text-[11px] text-neutral-400">Verifique a legibilidade</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'normal', label: 'Visão Normal' },
            { id: 'deuteranopia', label: 'Deuteranopia (Verde)' },
            { id: 'protanopia', label: 'Protanopia (Vermelho)' },
            { id: 'tritanopia', label: 'Tritanopia (Azul)' },
            { id: 'achromatopsia', label: 'Acromatopsia (Monocromático)' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setBlindnessMode(opt.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                blindnessMode === opt.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-750'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Simulated Palette Preview */}
        <div className="flex items-center gap-2 mt-4 h-10 rounded-xl overflow-hidden">
          {colors.map(c => {
            const simulatedHex = simulateColorBlindness(c.hex, blindnessMode);
            return (
              <div
                key={c.id}
                className="flex-1 h-full flex items-center justify-center text-[10px] font-mono text-white/90 shadow-inner"
                style={{ backgroundColor: simulatedHex }}
                title={`${c.name} simulado: ${simulatedHex}`}
              >
                {simulatedHex}
              </div>
            );
          })}
        </div>
      </div>

      {/* WCAG Contrast Ratio Table */}
      <div className="bg-white dark:bg-neutral-850 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              Taxa de Contraste WCAG (Acessibilidade)
            </span>
          </div>
          <span className="text-[11px] text-neutral-400">Padrão W3C AA & AAA</span>
        </div>

        <div className="space-y-2">
          {colors.map(color => {
            const contrastWhite = getContrastRatio(color.hex, '#FFFFFF');
            const contrastBlack = getContrastRatio(color.hex, '#000000');

            const isAaWhite = contrastWhite >= 4.5;
            const isAaaWhite = contrastWhite >= 7.0;
            const isAaBlack = contrastBlack >= 4.5;
            const isAaaBlack = contrastBlack >= 7.0;

            return (
              <div
                key={color.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-6 h-6 rounded-lg border border-black/10 shrink-0"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div>
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                      Color 0{color.id}
                    </span>
                    <span className="text-[11px] font-mono text-neutral-400 ml-2">
                      {color.hex}
                    </span>
                  </div>
                </div>

                {/* Badges for White and Black background */}
                <div className="flex items-center gap-3">
                  {/* Against White */}
                  <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-800 px-2 py-1 rounded-lg border border-neutral-200/60 dark:border-neutral-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-white border border-neutral-300" />
                    <span className="text-xs font-mono font-semibold tabular-nums">
                      {contrastWhite}:1
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1 rounded ${
                        isAaaWhite
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : isAaWhite
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400'
                      }`}
                    >
                      {isAaaWhite ? 'AAA' : isAaWhite ? 'AA' : 'Fail'}
                    </span>
                  </div>

                  {/* Against Black */}
                  <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-800 px-2 py-1 rounded-lg border border-neutral-200/60 dark:border-neutral-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-black border border-neutral-600" />
                    <span className="text-xs font-mono font-semibold tabular-nums">
                      {contrastBlack}:1
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1 rounded ${
                        isAaaBlack
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : isAaBlack
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400'
                      }`}
                    >
                      {isAaaBlack ? 'AAA' : isAaBlack ? 'AA' : 'Fail'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tonal Scale Generator for Active Color (from Screenshot 2026-10-04 at 19.42.45.heic) */}
      <div className="bg-white dark:bg-neutral-850 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full border border-black/10"
              style={{ backgroundColor: activeColor.hex }}
            />
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              Escala Tonal de Luminosidade ({activeColor.name})
            </span>
          </div>
          <span className="text-[11px] text-neutral-400">10% a 95% stops</span>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
          {activeScale.map(step => (
            <div
              key={step.level}
              className="flex flex-col items-center gap-1 group cursor-pointer"
              onClick={() => navigator.clipboard.writeText(step.hex)}
              title={`Clique para copiar ${step.hex}`}
            >
              <div
                className="w-full h-12 rounded-lg border border-black/10 shadow-2xs group-hover:scale-105 transition-transform"
                style={{ backgroundColor: step.hex }}
              />
              <span className="text-[10px] font-mono text-neutral-500 font-medium">
                {step.level}
              </span>
              <span className="text-[9px] font-mono text-neutral-400 group-hover:text-blue-500 transition-colors">
                {step.hex}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
