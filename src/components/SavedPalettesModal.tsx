import React, { useState } from 'react';
import { ColorItem, HarmonyType, SavedPalette } from '../types';
import { X, Trash2, FolderOpen, Plus, Bookmark, Sparkles, Check } from 'lucide-react';
import { createColorItem } from '../utils/colorConversions';

interface SavedPalettesModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedPalettes: SavedPalette[];
  currentColors: ColorItem[];
  currentHarmony: HarmonyType;
  paletteName: string;
  onSaveCurrentPalette: (name: string) => void;
  onLoadPalette: (palette: SavedPalette) => void;
  onDeletePalette: (id: string) => void;
}

const CURATED_PRESETS: { name: string; harmony: HarmonyType; hexes: string[] }[] = [
  {
    name: 'Modern Cyberpunk',
    harmony: 'triangular',
    hexes: ['#00E5FF', '#FF4F81', '#5B2DFF', '#BA1650', '#056C5C'],
  },
  {
    name: 'Sunset Boulevard',
    harmony: 'analogous',
    hexes: ['#FF5E7E', '#FF9966', '#FFD166', '#EF476F', '#06D6A0'],
  },
  {
    name: 'Nordic Forest',
    harmony: 'monochromatic',
    hexes: ['#1B4332', '#2D6A4F', '#40916C', '#74C69D', '#D8F3DC'],
  },
  {
    name: 'Warm Terracotta',
    harmony: 'splitComplementary',
    hexes: ['#E07A5F', '#3D405B', '#81B29A', '#F2CC8F', '#F4F1DE'],
  },
  {
    name: 'Neo Minimalist (Apple)',
    harmony: 'free',
    hexes: ['#1D1D1F', '#F5F5F7', '#0071E3', '#86868B', '#FBFBFD'],
  },
  {
    name: 'Deep Oceanic',
    harmony: 'quadratic',
    hexes: ['#03045E', '#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8'],
  },
];

export const SavedPalettesModal: React.FC<SavedPalettesModalProps> = ({
  isOpen,
  onClose,
  savedPalettes,
  currentColors,
  currentHarmony,
  paletteName,
  onSaveCurrentPalette,
  onLoadPalette,
  onDeletePalette,
}) => {
  const [activeTab, setActiveTab] = useState<'myPalettes' | 'curated'>('myPalettes');
  const [nameInput, setNameInput] = useState(paletteName || 'Minha Paleta');
  const [justSaved, setJustSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    onSaveCurrentPalette(nameInput.trim());
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Biblioteca de Paletas
            </h3>
            <span className="text-xs text-neutral-400">
              Salve, organize e carregue suas combinações cromáticas
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Save Form Bar */}
        <div className="px-6 py-3.5 bg-neutral-50 dark:bg-neutral-850/80 border-b border-neutral-100 dark:border-neutral-800">
          <form onSubmit={handleSave} className="flex items-center gap-2">
            <input
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              placeholder="Nome da paleta atual..."
              className="flex-1 text-xs py-2 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition-colors"
            >
              {justSaved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvo!</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Salvar Atual</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Tabs: My Palettes / Curated */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-neutral-100 dark:border-neutral-800">
          <button
            onClick={() => setActiveTab('myPalettes')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'myPalettes'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
            }`}
          >
            Minhas Paletas ({savedPalettes.length})
          </button>
          <button
            onClick={() => setActiveTab('curated')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'curated'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Paletas em Destaque</span>
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {activeTab === 'myPalettes' ? (
            savedPalettes.length === 0 ? (
              <div className="text-center py-10 text-neutral-400 text-xs">
                Nenhuma paleta salva ainda. Digite um nome acima e clique em "Salvar Atual".
              </div>
            ) : (
              savedPalettes.map(palette => (
                <div
                  key={palette.id}
                  className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 bg-white dark:bg-neutral-800/80 flex items-center justify-between gap-4 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                        {palette.name}
                      </span>
                      <span className="text-[10px] text-neutral-400 capitalize">
                        · {palette.harmony}
                      </span>
                    </div>

                    {/* Color Swatches bar */}
                    <div className="flex items-center gap-1.5 h-6 rounded-lg overflow-hidden w-48">
                      {palette.colors.map((c, i) => (
                        <div
                          key={i}
                          className="flex-1 h-full rounded"
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        onLoadPalette(palette);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
                    >
                      Carregar
                    </button>
                    <button
                      onClick={() => onDeletePalette(palette.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Excluir paleta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )
          ) : (
            /* Curated Presets */
            CURATED_PRESETS.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 bg-white dark:bg-neutral-800/80 flex items-center justify-between gap-4 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-neutral-400 capitalize">
                      · {item.harmony}
                    </span>
                  </div>

                  {/* Color Swatches bar */}
                  <div className="flex items-center gap-1.5 h-6 rounded-lg overflow-hidden w-48">
                    {item.hexes.map((hex, i) => (
                      <div
                        key={i}
                        className="flex-1 h-full rounded"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    const loaded: SavedPalette = {
                      id: `curated-${idx}`,
                      name: item.name,
                      harmony: item.harmony,
                      createdAt: new Date().toISOString(),
                      colors: item.hexes.map(h => ({
                        hex: h,
                        name: '',
                      })),
                    };
                    onLoadPalette(loaded);
                    onClose();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shrink-0"
                >
                  Usar Paleta
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
