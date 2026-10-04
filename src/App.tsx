/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ColorItem, HarmonyType, SavedPalette, WheelShape } from './types';
import {
  createColorItem,
  createColorFromHsv,
  generateHarmonicColors,
  getRandomHex,
} from './utils/colorConversions';
import { Header } from './components/Header';
import { ColorWheel } from './components/ColorWheel';
import { ColorCard } from './components/ColorCard';
import { PalettePreview } from './components/PalettePreview';
import { ContrastView } from './components/ContrastView';
import { FullStripPreviewModal } from './components/FullStripPreviewModal';
import { ExportModal } from './components/ExportModal';
import { SavedPalettesModal } from './components/SavedPalettesModal';
import { ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

export default function App() {
  // Initialize initial colors matching image.png:
  // Color 01: #00E5FF (active)
  // Color 02: #FF6B6B
  // Color 03: #5B2DFF
  // Color 04: empty placeholder
  // Color 05: empty placeholder
  const [colors, setColors] = useState<ColorItem[]>([
    createColorItem(1, '#00E5FF'),
    createColorItem(2, '#FF6B6B'),
    createColorItem(3, '#5B2DFF'),
    {
      ...createColorItem(4, '#CCCCCC'),
      isEmpty: true,
      hex: '#------',
    },
    {
      ...createColorItem(5, '#CCCCCC'),
      isEmpty: true,
      hex: '#------',
    },
  ]);

  const [activeId, setActiveId] = useState<number>(1);
  const [harmony, setHarmony] = useState<HarmonyType>('triangular');
  const [brightness, setBrightness] = useState<number>(100);
  const [wheelShape, setWheelShape] = useState<WheelShape>('circle');
  const [paletteName, setPaletteName] = useState<string>('Color Grading');
  const [showContrastSection, setShowContrastSection] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dark mode
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Modals
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSavedOpen, setIsSavedOpen] = useState(false);
  const [isFullPreviewOpen, setIsFullPreviewOpen] = useState(false);

  // Saved palettes in localStorage
  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>(() => {
    try {
      const stored = localStorage.getItem('color_grading_palettes');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Toast notification helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Sync dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Persist saved palettes
  useEffect(() => {
    try {
      localStorage.setItem('color_grading_palettes', JSON.stringify(savedPalettes));
    } catch {
      // quota
    }
  }, [savedPalettes]);

  // Handle color change from color wheel or input
  const handleColorChange = useCallback(
    (updatedColor: ColorItem) => {
      setColors(prev => {
        const newColor = { ...updatedColor, isEmpty: false };
        if (harmony === 'free') {
          return prev.map(c => (c.id === updatedColor.id ? newColor : c));
        }
        return generateHarmonicColors(newColor, harmony, prev);
      });
    },
    [harmony]
  );

  // Batch rotation when dragging in harmony mode
  const handleBatchColorsChange = (newBatch: ColorItem[]) => {
    setColors(newBatch);
  };

  // Switch harmony type
  const handleHarmonyChange = (newHarmony: HarmonyType) => {
    setHarmony(newHarmony);
    if (newHarmony === 'free') return;

    // Apply new harmony based on the current active color
    const activeColor = colors.find(c => c.id === activeId) || colors[0];
    const baseColor = activeColor.isEmpty ? createColorItem(activeColor.id, '#00E5FF') : activeColor;

    setColors(prev => {
      // Make sure needed slots are non-empty for the harmony geometry
      const prepared = prev.map((c, i) => {
        let shouldBeActive = false;
        if (newHarmony === 'triangular' && i < 3) shouldBeActive = true;
        if (newHarmony === 'quadratic' && i < 4) shouldBeActive = true;
        if (newHarmony === 'splitComplementary' && i < 3) shouldBeActive = true;
        if (newHarmony === 'complementary' && i < 2) shouldBeActive = true;
        if (newHarmony === 'analogous' || newHarmony === 'monochromatic') shouldBeActive = true;

        if (shouldBeActive && c.isEmpty) {
          return { ...c, isEmpty: false };
        }
        return c;
      });

      return generateHarmonicColors(baseColor, newHarmony, prepared);
    });
  };

  // Brightness slider change (allows going to 0% - absolute black)
  const handleBrightnessChange = (val: number) => {
    setBrightness(val);
    setColors(prev =>
      prev.map(c => {
        if (c.isEmpty || c.locked) return c;
        const newHsv = { ...c.hsv, v: val };
        return createColorFromHsv(c.id, newHsv, c.locked);
      })
    );
  };

  // Randomize palette
  const handleRandomize = useCallback(() => {
    const randomHex = getRandomHex();
    const activeColor = colors.find(c => c.id === activeId) || colors[0];
    const newBase = createColorItem(activeColor.id, randomHex, activeColor.locked);

    if (harmony === 'free') {
      setColors(prev =>
        prev.map(c => (c.locked ? c : createColorItem(c.id, getRandomHex(), false)))
      );
    } else {
      setColors(prev => generateHarmonicColors(newBase, harmony, prev));
    }
    showToast('Nova paleta gerada!');
  }, [activeId, colors, harmony]);

  // Card actions
  const handleSelectCard = (id: number) => {
    setActiveId(id);
    const target = colors.find(c => c.id === id);
    if (target && target.isEmpty) {
      const filled = createColorItem(id, getRandomHex());
      setColors(prev => prev.map(c => (c.id === id ? filled : c)));
    }
  };

  const handleClearCard = (id: number) => {
    setColors(prev =>
      prev.map(c =>
        c.id === id
          ? {
              ...createColorItem(id, '#CCCCCC'),
              isEmpty: true,
              hex: '#------',
            }
          : c
      )
    );
  };

  const handleToggleLock = (id: number) => {
    setColors(prev =>
      prev.map(c => (c.id === id ? { ...c, locked: !c.locked } : c))
    );
  };

  // Image dropped directly on the wheel
  const handleImageDropped = (newColors: ColorItem[]) => {
    setColors(newColors);
    setActiveId(1);
    setHarmony('free');
    showToast('Cores extraídas da imagem com sucesso!');
  };

  // Save current palette to localStorage
  const handleSavePalette = (nameToSave?: string) => {
    const name = nameToSave || paletteName || `Paleta ${savedPalettes.length + 1}`;
    const newEntry: SavedPalette = {
      id: `pal_${Date.now()}`,
      name,
      harmony,
      createdAt: new Date().toISOString(),
      colors: colors
        .filter(c => !c.isEmpty)
        .map(c => ({
          hex: c.hex,
          name: c.name,
          locked: c.locked,
        })),
    };
    setSavedPalettes(prev => [newEntry, ...prev]);
    showToast(`Paleta "${name}" salva!`);
  };

  // Load saved palette
  const handleLoadPalette = (palette: SavedPalette) => {
    setPaletteName(palette.name);
    setHarmony(palette.harmony);

    const loaded = palette.colors.map((c, i) => createColorItem(i + 1, c.hex, c.locked));
    while (loaded.length < 5) {
      const emptyId = loaded.length + 1;
      loaded.push({
        ...createColorItem(emptyId, '#CCCCCC'),
        isEmpty: true,
        hex: '#------',
      });
    }
    setColors(loaded);
    setActiveId(1);
    showToast(`Paleta "${palette.name}" carregada!`);
  };

  const handleDeletePalette = (id: string) => {
    setSavedPalettes(prev => prev.filter(p => p.id !== id));
  };

  const activeColor = colors.find(c => c.id === activeId) || colors[0];

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-2 rounded-2xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-3 duration-200">
          {toastMessage}
        </div>
      )}

      {/* Top Header matching image.png with Light/Dark toggle */}
      <Header
        harmony={harmony}
        onSelectHarmony={handleHarmonyChange}
        onRandomize={handleRandomize}
        onSave={() => setIsSavedOpen(true)}
        onExport={() => setIsExportOpen(true)}
        onOpenSavedModal={() => setIsSavedOpen(true)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Main Studio Canvas Container */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        {/* Central Workspace Card matching image.png */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Interactive Color Wheel with shape buttons & image drop */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center">
              <ColorWheel
                colors={colors}
                activeId={activeId}
                harmony={harmony}
                brightness={brightness}
                wheelShape={wheelShape}
                onColorChange={handleColorChange}
                onBatchColorsChange={handleBatchColorsChange}
                onSelectCard={handleSelectCard}
                onBrightnessChange={handleBrightnessChange}
                onHarmonyChange={handleHarmonyChange}
                onWheelShapeChange={setWheelShape}
                onImageDropped={handleImageDropped}
              />
            </div>

            {/* Right Column: 5 Color Cards with individual auto-advancing RGB/CMYK */}
            <div className="lg:col-span-6 flex flex-col gap-3">
              {colors.map((color, index) => (
                <ColorCard
                  key={color.id}
                  color={color}
                  isActive={color.id === activeId}
                  index={index}
                  onSelect={() => handleSelectCard(color.id)}
                  onUpdate={handleColorChange}
                  onClear={() => handleClearCard(color.id)}
                  onToggleLock={() => handleToggleLock(color.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Palette Preview Bar */}
        <PalettePreview
          colors={colors}
          activeId={activeId}
          onSelectColor={handleSelectCard}
          onOpenFullPreview={() => setIsFullPreviewOpen(true)}
        />

        {/* Contraste & Escalas Section: Placed directly below the main workspace! */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                Contraste & Escalas Cromáticas
              </h2>
            </div>
            <button
              onClick={() => setShowContrastSection(!showContrastSection)}
              className="flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
            >
              <span>{showContrastSection ? 'Ocultar' : 'Expandir'}</span>
              {showContrastSection ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {showContrastSection && (
            <div className="flex justify-center">
              <ContrastView
                colors={colors.filter(c => !c.isEmpty)}
                activeColor={activeColor.isEmpty ? colors[0] : activeColor}
                onSelectColor={handleSelectCard}
                onUpdateColor={handleColorChange}
              />
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <FullStripPreviewModal
        colors={colors}
        paletteName={paletteName}
        isOpen={isFullPreviewOpen}
        onClose={() => setIsFullPreviewOpen(false)}
      />

      <ExportModal
        colors={colors}
        harmony={harmony}
        paletteName={paletteName}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      <SavedPalettesModal
        isOpen={isSavedOpen}
        onClose={() => setIsSavedOpen(false)}
        savedPalettes={savedPalettes}
        currentColors={colors}
        currentHarmony={harmony}
        paletteName={paletteName}
        onSaveCurrentPalette={handleSavePalette}
        onLoadPalette={handleLoadPalette}
        onDeletePalette={handleDeletePalette}
      />
    </div>
  );
}
