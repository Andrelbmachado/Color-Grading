import React, { useState, useRef, useEffect } from 'react';
import { ColorItem, HarmonyType } from '../types';
import {
  Download,
  ChevronDown,
  Sun,
  Moon,
  FileSpreadsheet,
  FileCode,
  FileText,
  Image as ImageIcon,
  FileJson,
  Check,
} from 'lucide-react';

interface HeaderProps {
  colors: ColorItem[];
  harmony: HarmonyType;
  paletteName: string;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  onExportCsv: () => void;
  onExportCss: () => void;
  onExportPdf: () => void;
  onExportJson: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  onExportPng,
  onExportSvg,
  onExportCsv,
  onExportCss,
  onExportPdf,
  onExportJson,
}) => {
  const [exportOpen, setExportOpen] = useState(false);
  const [lastExported, setLastExported] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleExport = (type: string, action: () => void) => {
    action();
    setLastExported(type);
    setTimeout(() => {
      setLastExported(null);
      setExportOpen(false);
    }, 700);
  };

  return (
    <header className="w-full bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-3 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-40 shadow-xs">
      {/* Brand Wordmark & Tri-Color Circles */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        <svg viewBox="0 0 36 32" className="w-7 h-7 sm:w-9 sm:h-9 shrink-0" aria-hidden="true">
          <circle cx="11" cy="10" r="8" fill="#00E5FF" />
          <circle cx="25" cy="10" r="8" fill="#FFDE00" />
          <circle cx="18" cy="22.1" r="8" fill="#FF4F81" />
        </svg>
        <span className="text-sm sm:text-xl font-bold tracking-[-0.045em] leading-none text-neutral-900 dark:text-white whitespace-nowrap">
          Color Grading
        </span>
      </div>

      {/* Right Controls: High-Contrast Export Dropdown + Sun/Moon Switch */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Export Dropdown with high contrast colors */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setExportOpen(!exportOpen)}
            className="flex items-center gap-1.5 sm:gap-2 py-2 px-3 sm:px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
          </button>

          {/* High-Contrast Dropdown Menu */}
          {exportOpen && (
            <div className="absolute -right-[72px] sm:right-0 mt-2 w-64 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-300 dark:border-neutral-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-1.5 border-b border-neutral-200 dark:border-neutral-800">
                <span className="text-[10px] font-extrabold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                  Escolha o Formato
                </span>
              </div>

              {[
                { id: 'png', label: 'Imagem PNG', desc: '1200x630 com códigos e nomes', icon: ImageIcon, fn: onExportPng },
                { id: 'svg', label: 'Vetor SVG', desc: 'Vetor escalável para Figma/Design', icon: FileText, fn: onExportSvg },
                { id: 'pdf', label: 'Documento PDF', desc: 'Ficha da paleta para impressão', icon: FileText, fn: onExportPdf },
                { id: 'csv', label: 'Planilha CSV', desc: 'HEX, RGB, CMYK, HSL e nomes', icon: FileSpreadsheet, fn: onExportCsv },
                { id: 'css', label: 'Variáveis CSS', desc: ':root { --color-1: ... }', icon: FileCode, fn: onExportCss },
                { id: 'json', label: 'Arquivo JSON', desc: 'Tokens de design estruturados', icon: FileJson, fn: onExportJson },
              ].map(opt => {
                const Icon = opt.icon;
                const isExported = lastExported === opt.id;

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleExport(opt.id, opt.fn)}
                    className="w-full px-4 py-2.5 text-left text-xs flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border-b border-neutral-100 dark:border-neutral-800/50 last:border-b-0"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
                        <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="font-bold text-neutral-900 dark:text-neutral-50 text-xs">
                          {opt.label}
                        </div>
                        <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                          {opt.desc}
                        </div>
                      </div>
                    </div>
                    {isExported && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sun & Moon Switch Toggle */}
        <button
          role="switch"
          aria-checked={darkMode}
          onClick={onToggleDarkMode}
          title={darkMode ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          className={`relative w-16 h-8 rounded-full p-1 transition-colors flex items-center cursor-pointer border ${
            darkMode
              ? 'bg-neutral-800 border-neutral-700'
              : 'bg-neutral-200 border-neutral-300'
          }`}
        >
          <div className="w-full flex items-center justify-between px-1.5 text-neutral-500 select-none">
            <Sun className={`w-3.5 h-3.5 transition-opacity ${darkMode ? 'opacity-30' : 'text-amber-500 opacity-90'}`} />
            <Moon className={`w-3.5 h-3.5 transition-opacity ${darkMode ? 'text-blue-400 opacity-90' : 'opacity-30'}`} />
          </div>

          <div
            className={`absolute top-1 w-6 h-6 rounded-full bg-white dark:bg-neutral-900 shadow-md flex items-center justify-center transition-transform duration-200 ease-out border border-black/10 dark:border-white/10 ${
              darkMode ? 'translate-x-8' : 'translate-x-0'
            }`}
          >
            {darkMode ? (
              <Moon className="w-3.5 h-3.5 text-blue-400" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            )}
          </div>
        </button>
      </div>
    </header>
  );
};
