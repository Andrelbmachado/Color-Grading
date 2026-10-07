/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ColorItem, HarmonyType, WheelShape, VisionMode } from './types';
import {
  createColorItem,
  createColorFromHsv,
  generateHarmonicColors,
  getRandomHex,
} from './utils/colorConversions';
import {
  downloadPng,
  downloadSvg,
  downloadCsv,
  downloadCss,
  downloadJson,
  printOrDownloadPdf,
} from './utils/exportUtils';
import { Header } from './components/Header';
import { ColorWheel } from './components/ColorWheel';
import { ColorCard } from './components/ColorCard';
import { PalettePreview } from './components/PalettePreview';
import { FullStripPreviewModal } from './components/FullStripPreviewModal';
import { VisionFilterSvg } from './components/VisionFilterSvg';
import { Plus, Eye } from 'lucide-react';

export default function App() {
  // 5 cards initially (4 active + 1 empty card ready for selection):
  const [colors, setColors] = useState<ColorItem[]>(() => generateHarmonicColors(createColorItem(1, '#00E5FF'), 'triangular', [
    createColorItem(1, '#00E5FF'),
    createColorItem(2, '#FF6B6B'),
    createColorItem(3, '#5B2DFF'),
    createColorItem(4, '#FFAA00'),
    {
      ...createColorItem(5, '#CCCCCC'),
      isEmpty: true,
      hex: '#------',
    },
  ]));

  const [activeId, setActiveId] = useState<number>(1);
  const [harmony, setHarmony] = useState<HarmonyType>('triangular');
  const [brightness, setBrightness] = useState<number>(100);
  const [wheelShape, setWheelShape] = useState<WheelShape>('circle');
  const [visionMode, setVisionMode] = useState<VisionMode>('normal');
  const [paletteName] = useState<string>('Color Grading');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dark mode
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Modal
  const [isFullPreviewOpen, setIsFullPreviewOpen] = useState(false);

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

    const activeColor = colors.find(c => c.id === activeId) || colors[0];
    const baseColor = activeColor.isEmpty ? createColorItem(activeColor.id, '#00E5FF') : activeColor;

    setColors(prev => {
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

  // Card actions
  const handleSelectCard = (id: number) => {
    setActiveId(id);
    const target = colors.find(c => c.id === id);
    if (target && target.isEmpty) {
      const filled = createColorItem(id, getRandomHex());
      setColors(prev => prev.map(c => (c.id === id ? filled : c)));
    }
  };

  // Add an empty card (if user clicks "+ Adicionar Cor")
  const handleAddColor = () => {
    const newId = colors.length + 1;
    const newEmptyCard: ColorItem = {
      ...createColorItem(newId, '#CCCCCC'),
      isEmpty: true,
      hex: '#------',
    };
    setColors(prev => [...prev, newEmptyCard]);
    setActiveId(newId);
    showToast(`Card de cor 0${newId} adicionado!`);
  };

  // Image dropped directly on the wheel
  const handleImageDropped = (newColors: ColorItem[]) => {
    setColors(newColors);
    setActiveId(1);
    setHarmony('free');
    showToast('Cores extraídas da imagem com sucesso!');
  };

  // Only show Add Color button if there is NO empty card currently (only 1 empty card at a time automatically)
  const hasEmptyCard = colors.some(c => c.isEmpty);

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
      {/* Hardware-accelerated SVG Color Matrix Filters */}
      <VisionFilterSvg />

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-2 rounded-2xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-3 duration-200">
          {toastMessage}
        </div>
      )}

      {/* Top Header: Brand + High-Contrast Export Dropdown + Sun/Moon Switch */}
      <Header
        colors={colors}
        harmony={harmony}
        paletteName={paletteName}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onExportPng={() => downloadPng(colors, paletteName, harmony)}
        onExportSvg={() => downloadSvg(colors, paletteName, harmony)}
        onExportCsv={() => downloadCsv(colors, paletteName)}
        onExportCss={() => downloadCss(colors, paletteName)}
        onExportPdf={() => printOrDownloadPdf(colors, paletteName, harmony)}
        onExportJson={() => downloadJson(colors, paletteName, harmony)}
      />

      {/* Main Studio Canvas Container */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-4">
        {/* VISION CONDITION / DALTONISM TABS DIRECTLY ABOVE THE WORKSPACE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1 border-b border-neutral-200/80 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
              Simulador Visual:
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: 'normal', label: 'Visão Padrão' },
              { id: 'deuteranopia', label: 'Deuteranopia (Verde)' },
              { id: 'protanopia', label: 'Protanopia (Vermelho)' },
              { id: 'tritanopia', label: 'Tritanopia (Azul)' },
              { id: 'achromatopsia', label: 'Acromatopsia (Monocromático)' },
            ].map(tab => {
              const isSelected = visionMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setVisionMode(tab.id as VisionMode)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white border-2 border-blue-700 shadow-sm dark:bg-blue-600 dark:border-blue-400 font-extrabold'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-950 border-2 border-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-750 dark:text-white dark:border-neutral-700'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Central Workspace Card: Color Wheel on left & Scrollable Color Cards on right with generous spacing */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-6 lg:p-7 shadow-[0_2px_16px_rgba(0,0,0,0.02)]">
          <div className="studio-grid">
            {/* Left Column: Interactive Color Wheel positioned snugly higher up */}
            <div className="wheel-column">
              <ColorWheel
                colors={colors}
                activeId={activeId}
                harmony={harmony}
                wheelShape={wheelShape}
                visionMode={visionMode}
                onColorChange={handleColorChange}
                onBatchColorsChange={handleBatchColorsChange}
                onSelectCard={handleSelectCard}
                onHarmonyChange={handleHarmonyChange}
                onWheelShapeChange={setWheelShape}
                onImageDropped={handleImageDropped}
              />
            </div>

            {/* Right Column: Dynamic Color Cards with Vertical Scroll for infinite colors */}
            <div className="color-column">
              <div className="color-list custom-scrollbar">
                {colors.map((color, index) => (
                  <ColorCard
                    key={color.id}
                    color={color}
                    isActive={color.id === activeId}
                    index={index}
                    visionMode={visionMode}
                    onSelect={() => handleSelectCard(color.id)}
                    onUpdate={handleColorChange}
                  />
                ))}

                {/* Add More Color Button: Shows whenever all cards are filled, adding ONE empty card */}
                {!hasEmptyCard && (
                  <button
                    onClick={handleAddColor}
                    className="w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-blue-500 dark:hover:border-blue-400 bg-neutral-50/60 dark:bg-neutral-800/40 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 text-neutral-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-bold transition-all flex items-center justify-center gap-2 group cursor-pointer shadow-2xs mt-0.5"
                  >
                    <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Adicionar Mais Uma Cor (+ Cor {String(colors.length + 1).padStart(2, '0')})</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Palette Preview Bar (also applies vision mode) */}
        <div style={visionMode !== 'normal' ? { filter: `url(#${visionMode}-filter)` } : undefined}>
          <PalettePreview
            colors={colors}
            activeId={activeId}
            onSelectColor={handleSelectCard}
            onOpenFullPreview={() => setIsFullPreviewOpen(true)}
          />
        </div>
      </main>

      {/* Full Screen Column Preview Modal */}
      <FullStripPreviewModal
        colors={colors}
        paletteName={paletteName}
        isOpen={isFullPreviewOpen}
        onClose={() => setIsFullPreviewOpen(false)}
      />
    </div>
  );
}
