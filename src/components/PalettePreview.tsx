import React, { useState } from 'react';
import { ColorItem } from '../types';
import { Copy, Check, Maximize2 } from 'lucide-react';

interface PalettePreviewProps {
  colors: ColorItem[];
  activeId: number;
  onSelectColor: (id: number) => void;
  onOpenFullPreview: () => void;
}

export const PalettePreview: React.FC<PalettePreviewProps> = ({
  colors,
  activeId,
  onSelectColor,
  onOpenFullPreview,
}) => {
  const [copiedAll, setCopiedAll] = useState(false);

  const copyAllHexes = () => {
    const hexes = colors.filter(c => !c.isEmpty).map(c => c.hex).join(', ');
    navigator.clipboard.writeText(hexes);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  };

  return (
    <div className="w-full bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-300 dark:border-neutral-700 p-5 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between transition-colors">
      {/* Label with strong contrast */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
          Palette Preview
        </span>
      </div>

      {/* 5 Continuous Color Bars */}
      <div className="flex-1 w-full flex items-center gap-2 h-14">
        {colors.map((color, index) => {
          const isActive = color.id === activeId;
          const isFilled = !color.isEmpty;

          return (
            <div
              key={color.id}
              onClick={() => onSelectColor(color.id)}
              title={isFilled ? `${color.name} (${color.hex})` : `Cor 0${index + 1} vazia`}
              className={`relative flex-1 h-full rounded-2xl transition-all cursor-pointer overflow-hidden flex items-center justify-center group shadow-xs ${
                isFilled
                  ? 'hover:brightness-105 hover:scale-[1.01]'
                  : 'bg-neutral-200 dark:bg-neutral-800 border-2 border-dashed border-neutral-300 dark:border-neutral-700'
              } ${isActive ? 'ring-3 ring-blue-500 ring-offset-2 dark:ring-offset-neutral-900 z-10' : ''}`}
              style={{
                backgroundColor: isFilled ? color.hex : undefined,
              }}
            >
              {isFilled && (
                <span className="text-xs font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-950/80 backdrop-blur-xs text-white px-2 py-0.5 rounded-lg shadow-md border border-white/20">
                  {color.hex}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions on the right with strong contrast and visible buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={copyAllHexes}
          title="Copiar todos os códigos HEX"
          className="py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 text-xs font-bold transition-all shadow-sm flex items-center gap-2 active:scale-95"
        >
          {copiedAll ? (
            <>
              <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
              <span>Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copiar Paleta</span>
            </>
          )}
        </button>

        <button
          onClick={onOpenFullPreview}
          title="Visualização em tela cheia das 5 colunas"
          className="p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-100 transition-colors shadow-2xs"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
