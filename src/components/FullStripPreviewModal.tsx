import React, { useState } from 'react';
import { ColorItem } from '../types';
import { getContrastTextColor } from '../utils/colorConversions';
import { X, Copy, Check, Download } from 'lucide-react';

interface FullStripPreviewModalProps {
  colors: ColorItem[];
  paletteName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const FullStripPreviewModal: React.FC<FullStripPreviewModalProps> = ({
  colors,
  paletteName,
  isOpen,
  onClose,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyHex = (hex: string, idx: number) => {
    navigator.clipboard.writeText(hex);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl h-[80vh] bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/20">
        {/* Header bar */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              {paletteName || 'Paleta Principal'}
            </h3>
            <span className="text-xs text-neutral-400">
              Visualização em tela cheia das 5 colunas de cor
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5 Full Height Color Columns matching Screenshot 2026-10-04 at 19.40.54.heic */}
        <div className="flex-1 w-full flex flex-col sm:flex-row overflow-hidden m-4 sm:m-6 rounded-2xl shadow-md border border-neutral-200/40">
          {colors.map((color, index) => {
            const isFilled = !color.isEmpty;
            const textColor = isFilled ? getContrastTextColor(color.hex) : '#888888';
            const isCopied = copiedIndex === index;

            return (
              <div
                key={color.id}
                className="flex-1 relative flex flex-col justify-end p-5 transition-all group select-none min-h-[80px]"
                style={{
                  backgroundColor: isFilled ? color.hex : '#E5E7EB',
                }}
              >
                {/* Content at bottom left and bottom right */}
                <div
                  className="flex items-center justify-between w-full font-mono text-sm font-semibold tracking-wide"
                  style={{ color: textColor }}
                >
                  <span className="opacity-90">{isFilled ? color.hex : 'Vazio'}</span>

                  {isFilled && (
                    <button
                      onClick={() => copyHex(color.hex, index)}
                      title="Copiar HEX"
                      className="p-1.5 rounded-lg bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 transition-colors flex items-center gap-1 text-xs"
                      style={{ color: textColor }}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span className="text-[10px]">Copiado</span>
                        </>
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
