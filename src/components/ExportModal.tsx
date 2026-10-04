import React, { useState } from 'react';
import { ColorItem, HarmonyType } from '../types';
import { X, Copy, Check, Download, Code, FileText, Image as ImageIcon } from 'lucide-react';

interface ExportModalProps {
  colors: ColorItem[];
  harmony: HarmonyType;
  paletteName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  colors,
  harmony,
  paletteName,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'png' | 'svg' | 'css' | 'tailwind' | 'json'>('png');
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  // Filter valid colors
  const validColors = colors.filter(c => !c.isEmpty);

  // CSS variables format
  const cssCode = `:root {\n${validColors
    .map((c, i) => `  --color-${i + 1}: ${c.hex}; /* ${c.name} */`)
    .join('\n')}\n}`;

  // Tailwind format
  const tailwindCode = `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${validColors
    .map((c, i) => `        'palette-${i + 1}': '${c.hex}', // ${c.name}`)
    .join('\n')}\n      }\n    }\n  }\n};`;

  // JSON format
  const jsonCode = JSON.stringify(
    {
      name: paletteName || 'Paleta Color Grading',
      harmony,
      createdAt: new Date().toISOString(),
      colors: validColors.map(c => ({
        id: c.id,
        hex: c.hex,
        rgb: c.rgb,
        cmyk: c.cmyk,
        name: c.name,
      })),
    },
    null,
    2
  );

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  };

  // Download SVG
  const handleDownloadSvg = () => {
    const width = 1000;
    const height = 400;
    const cardWidth = (width - 60) / validColors.length;

    const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="#FFFFFF" rx="20"/>
  <text x="30" y="50" font-family="system-ui, sans-serif" font-size="22" font-weight="bold" fill="#111827">${paletteName || 'Color Grading Palette'}</text>
  <text x="30" y="75" font-family="system-ui, sans-serif" font-size="14" fill="#6B7280">Harmony: ${harmony}</text>
  <g transform="translate(30, 100)">
    ${validColors
      .map(
        (c, idx) => `
    <g transform="translate(${idx * cardWidth}, 0)">
      <rect width="${cardWidth - 10}" height="180" rx="14" fill="${c.hex}"/>
      <text x="0" y="215" font-family="monospace" font-size="16" font-weight="bold" fill="#111827">${c.hex}</text>
      <text x="0" y="235" font-family="system-ui, sans-serif" font-size="12" fill="#6B7280">${c.name}</text>
      <text x="0" y="255" font-family="monospace" font-size="11" fill="#9CA3AF">RGB: ${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b}</text>
      <text x="0" y="272" font-family="monospace" font-size="11" fill="#9CA3AF">CMYK: ${c.cmyk.c}, ${c.cmyk.m}, ${c.cmyk.y}, ${c.cmyk.k}</text>
    </g>`
      )
      .join('')}
  </g>
</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(paletteName || 'palette').toLowerCase().replace(/\s+/g, '-')}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download PNG by rendering onto canvas
  const handleDownloadPng = () => {
    const canvas = document.createElement('canvas');
    const width = 1200;
    const height = 630;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Title & Brand
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 36px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(paletteName || 'Color Grading Palette', 60, 80);

    ctx.fillStyle = '#6B7280';
    ctx.font = '500 18px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(`Harmony: ${harmony.toUpperCase()} · 5 Colors`, 60, 115);

    // Color Swatches
    const paddingX = 60;
    const availableWidth = width - paddingX * 2;
    const cardWidth = (availableWidth - 20 * (validColors.length - 1)) / validColors.length;
    const cardHeight = 280;
    const startY = 160;

    validColors.forEach((color, idx) => {
      const x = paddingX + idx * (cardWidth + 20);

      // Swatch with rounded corners
      ctx.fillStyle = color.hex;
      ctx.beginPath();
      // round rect
      ctx.roundRect(x, startY, cardWidth, cardHeight, 16);
      ctx.fill();

      // Card details below
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 20px "JetBrains Mono", monospace';
      ctx.fillText(color.hex, x, startY + cardHeight + 40);

      ctx.fillStyle = '#4B5563';
      ctx.font = '500 14px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText(color.name, x, startY + cardHeight + 65);

      ctx.fillStyle = '#9CA3AF';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillText(`RGB: ${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}`, x, startY + cardHeight + 88);
      ctx.fillText(
        `CMYK: ${color.cmyk.c}, ${color.cmyk.m}, ${color.cmyk.y}, ${color.cmyk.k}`,
        x,
        startY + cardHeight + 106
      );
    });

    // Watermark
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '13px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('Generated with Color Grading Studio', 60, height - 30);

    // Export image
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(paletteName || 'palette').toLowerCase().replace(/\s+/g, '-')}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Exportar Paleta
            </h3>
            <span className="text-xs text-neutral-400">
              Escolha o formato desejado para salvar ou compartilhar
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div className="flex items-center gap-1 px-6 pt-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850/50">
          {[
            { id: 'png', label: 'Imagem PNG', icon: ImageIcon },
            { id: 'svg', label: 'Vetor SVG', icon: FileText },
            { id: 'css', label: 'CSS Variables', icon: Code },
            { id: 'tailwind', label: 'Tailwind CSS', icon: Code },
            { id: 'json', label: 'JSON', icon: FileText },
          ].map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
                  isSelected
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'png' && (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-full h-36 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 flex mb-4 shadow-sm">
                {validColors.map(c => (
                  <div
                    key={c.id}
                    className="flex-1 h-full flex flex-col justify-end p-2 text-center"
                    style={{ backgroundColor: c.hex }}
                  >
                    <span className="text-[10px] font-mono font-bold bg-black/40 text-white rounded px-1">
                      {c.hex}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-5 max-w-sm">
                Gera uma imagem de alta resolução (1200x630) com os cartões de cores, códigos HEX, RGB e CMYK.
              </p>
              <button
                onClick={handleDownloadPng}
                className="px-6 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold transition-all shadow-md flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Imagem PNG</span>
              </button>
            </div>
          )}

          {activeTab === 'svg' && (
            <div className="flex flex-col items-center text-center py-4">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-5 max-w-sm">
                Baixe um arquivo SVG vetorial ideal para importar no Figma, Illustrator, Sketch ou na web.
              </p>
              <button
                onClick={handleDownloadSvg}
                className="px-6 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold transition-all shadow-md flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Arquivo SVG</span>
              </button>
            </div>
          )}

          {(activeTab === 'css' || activeTab === 'tailwind' || activeTab === 'json') && (
            <div className="flex flex-col gap-3">
              <div className="relative">
                <pre className="p-4 rounded-2xl bg-neutral-950 text-neutral-100 font-mono text-xs overflow-x-auto max-h-64 leading-relaxed border border-neutral-800">
                  {activeTab === 'css' && cssCode}
                  {activeTab === 'tailwind' && tailwindCode}
                  {activeTab === 'json' && jsonCode}
                </pre>
                <button
                  onClick={() =>
                    handleCopyCode(
                      activeTab === 'css'
                        ? cssCode
                        : activeTab === 'tailwind'
                        ? tailwindCode
                        : jsonCode
                    )
                  }
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium flex items-center gap-1.5 shadow transition-colors"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Código</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
