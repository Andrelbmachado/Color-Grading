import React, { useState, useRef, useEffect } from 'react';
import { HarmonyType } from '../types';
import {
  Shuffle,
  Bookmark,
  Share2,
  ChevronDown,
  Sun,
  Moon,
  FolderHeart,
  Check,
} from 'lucide-react';

interface HeaderProps {
  harmony: HarmonyType;
  onSelectHarmony: (harmony: HarmonyType) => void;
  onRandomize: () => void;
  onSave: () => void;
  onExport: () => void;
  onOpenSavedModal: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const renderHarmonySvg = (id: HarmonyType) => {
  switch (id) {
    case 'triangular':
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0">
          <polygon points="12,4 4,18 20,18" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="12" cy="4" r="2" fill="currentColor" />
          <circle cx="4" cy="18" r="2" fill="currentColor" />
          <circle cx="20" cy="18" r="2" fill="currentColor" />
        </svg>
      );
    case 'quadratic':
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0">
          <rect x="5" y="5" width="14" height="14" rx="1" stroke="currentColor" strokeWidth="2" />
          <circle cx="5" cy="5" r="2" fill="currentColor" />
          <circle cx="19" cy="5" r="2" fill="currentColor" />
          <circle cx="19" cy="19" r="2" fill="currentColor" />
          <circle cx="5" cy="19" r="2" fill="currentColor" />
        </svg>
      );
    case 'splitComplementary':
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0">
          <line x1="12" y1="12" x2="12" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="12" y1="12" x2="6" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="12" y1="12" x2="18" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="20" r="2" fill="currentColor" />
          <circle cx="6" cy="6" r="2" fill="currentColor" />
          <circle cx="18" cy="6" r="2" fill="currentColor" />
        </svg>
      );
    case 'complementary':
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0">
          <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="4" r="2" fill="currentColor" />
          <circle cx="12" cy="20" r="2" fill="currentColor" />
        </svg>
      );
    case 'analogous':
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0">
          <path d="M5 16 A 10 10 0 0 1 19 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="5" cy="16" r="2" fill="currentColor" />
          <circle cx="12" cy="6" r="2" fill="currentColor" />
          <circle cx="19" cy="16" r="2" fill="currentColor" />
        </svg>
      );
    case 'monochromatic':
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0">
          <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="6" cy="12" r="1.8" fill="currentColor" />
          <circle cx="12" cy="12" r="1.8" fill="currentColor" />
          <circle cx="18" cy="12" r="1.8" fill="currentColor" />
        </svg>
      );
    case 'free':
    default:
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0">
          <circle cx="12" cy="12" r="1.8" fill="currentColor" />
          <circle cx="6" cy="8" r="1.8" fill="currentColor" />
          <circle cx="18" cy="7" r="1.8" fill="currentColor" />
          <circle cx="7" cy="17" r="1.8" fill="currentColor" />
          <circle cx="17" cy="16" r="1.8" fill="currentColor" />
        </svg>
      );
  }
};

const HARMONY_OPTIONS: { id: HarmonyType; label: string }[] = [
  { id: 'triangular', label: 'Triangular' },
  { id: 'quadratic', label: 'Quadratic (Quadrado)' },
  { id: 'splitComplementary', label: 'Dividida (Y linha)' },
  { id: 'complementary', label: 'Complementar' },
  { id: 'analogous', label: 'Análogo' },
  { id: 'monochromatic', label: 'Monocromático' },
  { id: 'free', label: 'Personalizado / Livre' },
];

export const Header: React.FC<HeaderProps> = ({
  harmony,
  onSelectHarmony,
  onRandomize,
  onSave,
  onExport,
  onOpenSavedModal,
  darkMode,
  onToggleDarkMode,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const currentOption = HARMONY_OPTIONS.find(o => o.id === harmony) || HARMONY_OPTIONS[0];

  return (
    <header className="w-full bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-2xs">
      {/* Zone 1: Logo & Brand Wordmark */}
      <div className="flex items-center gap-3">
        <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
          <span className="absolute -top-0.5 left-0.5 w-4 h-4 rounded-full bg-[#00E5FF] mix-blend-multiply dark:mix-blend-screen opacity-90" />
          <span className="absolute -top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#FFDE00] mix-blend-multiply dark:mix-blend-screen opacity-90" />
          <span className="absolute bottom-0 w-4.5 h-4.5 rounded-full bg-[#FF4F81] mix-blend-multiply dark:mix-blend-screen opacity-90" />
        </div>
        <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Color Grading
        </span>
      </div>

      {/* Zone 2: Harmony Dropdown matching image.png */}
      <div className="relative" ref={dropdownRef}>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            Harmony
          </span>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 py-1.5 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/80 dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-750 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-colors shadow-2xs"
          >
            {renderHarmonySvg(harmony)}
            <span>{currentOption.label.split(' ')[0]}</span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          </button>
        </div>

        {dropdownOpen && (
          <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 bg-white dark:bg-neutral-850 rounded-2xl shadow-xl border border-neutral-200/90 dark:border-neutral-700/90 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
            {HARMONY_OPTIONS.map(opt => {
              const selected = opt.id === harmony;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    onSelectHarmony(opt.id);
                    setDropdownOpen(false);
                  }}
                  className={`w-full px-3.5 py-2 text-left text-xs font-medium flex items-center justify-between transition-colors ${
                    selected
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-semibold'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {renderHarmonySvg(opt.id)}
                    <span>{opt.label}</span>
                  </div>
                  {selected && <Check className="w-3.5 h-3.5 text-blue-500" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Zone 3: Actions + Theme Toggle */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Randomize */}
        <button
          onClick={onRandomize}
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-750 text-xs font-semibold text-neutral-700 dark:text-neutral-200 transition-colors shadow-2xs"
          title="Gerar nova paleta aleatória"
        >
          <Shuffle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Randomize</span>
        </button>

        {/* Save */}
        <button
          onClick={onSave}
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-750 text-xs font-semibold text-neutral-700 dark:text-neutral-200 transition-colors shadow-2xs"
          title="Salvar esta paleta"
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Save</span>
        </button>

        {/* Saved Library */}
        <button
          onClick={onOpenSavedModal}
          className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-200 transition-colors shadow-2xs"
          title="Minhas Paletas Salvas"
        >
          <FolderHeart className="w-3.5 h-3.5" />
        </button>

        {/* Export */}
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold transition-colors shadow-2xs"
          title="Exportar paleta"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>

        {/* Explicit Light / Dark mode button */}
        <button
          onClick={onToggleDarkMode}
          className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-100 text-xs font-semibold transition-all shadow-2xs"
          title={darkMode ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
        >
          {darkMode ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline text-[11px]">Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-neutral-700" />
              <span className="hidden sm:inline text-[11px]">Escuro</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
