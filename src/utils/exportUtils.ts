import { ColorItem, HarmonyType } from '../types';

export function downloadPng(colors: ColorItem[], paletteName: string, harmony: HarmonyType) {
  const validColors = colors.filter(c => !c.isEmpty);
  if (validColors.length === 0) return;

  const canvas = document.createElement('canvas');
  const width = Math.max(1200, validColors.length * 200 + 120);
  const height = 640;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Title & Header
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 36px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(paletteName || 'Color Grading Palette', 60, 75);

  ctx.fillStyle = '#64748B';
  ctx.font = '500 16px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(`Harmony: ${harmony.toUpperCase()} · ${validColors.length} Cores`, 60, 110);

  // Swatches
  const paddingX = 60;
  const availableWidth = width - paddingX * 2;
  const cardGap = 16;
  const cardWidth = (availableWidth - cardGap * (validColors.length - 1)) / validColors.length;
  const cardHeight = 260;
  const startY = 150;

  validColors.forEach((color, idx) => {
    const x = paddingX + idx * (cardWidth + cardGap);

    // Swatch
    ctx.fillStyle = color.hex;
    ctx.beginPath();
    ctx.roundRect(x, startY, cardWidth, cardHeight, 16);
    ctx.fill();

    // Details below
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.fillText(color.hex, x, startY + cardHeight + 40);

    ctx.fillStyle = '#334155';
    ctx.font = '600 14px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(color.name, x, startY + cardHeight + 66);

    ctx.fillStyle = '#64748B';
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText(`RGB: ${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}`, x, startY + cardHeight + 90);
    ctx.fillText(
      `CMYK: ${color.cmyk.c}, ${color.cmyk.m}, ${color.cmyk.y}, ${color.cmyk.k}`,
      x,
      startY + cardHeight + 110
    );
    ctx.fillText(
      `HSL: ${color.hsl.h}°, ${color.hsl.s}%, ${color.hsl.l}%`,
      x,
      startY + cardHeight + 130
    );
  });

  // Footer Watermark
  ctx.fillStyle = '#94A3B8';
  ctx.font = '12px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('Generated with Color Grading Studio', 60, height - 30);

  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(paletteName || 'palette').toLowerCase().replace(/\s+/g, '-')}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

export function downloadSvg(colors: ColorItem[], paletteName: string, harmony: HarmonyType) {
  const validColors = colors.filter(c => !c.isEmpty);
  const width = Math.max(1000, validColors.length * 180 + 80);
  const height = 440;
  const cardWidth = (width - 60) / validColors.length;

  const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="#FFFFFF" rx="20"/>
  <text x="30" y="50" font-family="system-ui, sans-serif" font-size="22" font-weight="bold" fill="#0F172A">${paletteName || 'Color Grading Palette'}</text>
  <text x="30" y="75" font-family="system-ui, sans-serif" font-size="14" fill="#64748B">Harmony: ${harmony}</text>
  <g transform="translate(30, 100)">
    ${validColors
      .map(
        (c, idx) => `
    <g transform="translate(${idx * cardWidth}, 0)">
      <rect width="${cardWidth - 12}" height="180" rx="14" fill="${c.hex}"/>
      <text x="0" y="215" font-family="monospace" font-size="16" font-weight="bold" fill="#0F172A">${c.hex}</text>
      <text x="0" y="238" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#334155">${c.name}</text>
      <text x="0" y="260" font-family="monospace" font-size="11" fill="#64748B">RGB: ${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b}</text>
      <text x="0" y="278" font-family="monospace" font-size="11" fill="#64748B">CMYK: ${c.cmyk.c}, ${c.cmyk.m}, ${c.cmyk.y}, ${c.cmyk.k}</text>
      <text x="0" y="296" font-family="monospace" font-size="11" fill="#64748B">HSL: ${c.hsl.h}, ${c.hsl.s}, ${c.hsl.l}</text>
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
}

export function downloadCsv(colors: ColorItem[], paletteName: string) {
  const validColors = colors.filter(c => !c.isEmpty);
  const headers = 'ID,Name,HEX,RGB_R,RGB_G,RGB_B,CMYK_C,CMYK_M,CMYK_Y,CMYK_K,HSL_H,HSL_S,HSL_L\n';
  const rows = validColors
    .map(
      (c, i) =>
        `${i + 1},"${c.name}",${c.hex},${c.rgb.r},${c.rgb.g},${c.rgb.b},${c.cmyk.c},${c.cmyk.m},${c.cmyk.y},${c.cmyk.k},${c.hsl.h},${c.hsl.s},${c.hsl.l}`
    )
    .join('\n');

  const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(paletteName || 'palette').toLowerCase().replace(/\s+/g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadCss(colors: ColorItem[], paletteName: string) {
  const validColors = colors.filter(c => !c.isEmpty);
  const content = `/* ${paletteName || 'Color Grading Palette'} */\n:root {\n${validColors
    .map((c, i) => `  --color-${i + 1}: ${c.hex}; /* ${c.name} */`)
    .join('\n')}\n}\n`;

  const blob = new Blob([content], { type: 'text/css;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(paletteName || 'palette').toLowerCase().replace(/\s+/g, '-')}.css`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadJson(colors: ColorItem[], paletteName: string, harmony: HarmonyType) {
  const validColors = colors.filter(c => !c.isEmpty);
  const data = {
    name: paletteName || 'Color Grading Palette',
    harmony,
    createdAt: new Date().toISOString(),
    colors: validColors.map((c, i) => ({
      id: i + 1,
      name: c.name,
      hex: c.hex,
      rgb: c.rgb,
      cmyk: c.cmyk,
      hsl: c.hsl,
    })),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(paletteName || 'palette').toLowerCase().replace(/\s+/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function printOrDownloadPdf(colors: ColorItem[], paletteName: string, harmony: HarmonyType) {
  const validColors = colors.filter(c => !c.isEmpty);
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${paletteName || 'Color Grading Palette'}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 40px; color: #0F172A; }
    h1 { font-size: 28px; margin-bottom: 4px; }
    p.meta { color: #64748B; font-size: 14px; margin-top: 0; margin-bottom: 30px; }
    .grid { display: flex; flex-wrap: wrap; gap: 20px; }
    .card { width: 180px; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; padding-bottom: 12px; }
    .swatch { height: 120px; width: 100%; }
    .info { padding: 10px; }
    .hex { font-family: monospace; font-size: 16px; font-weight: bold; margin: 0; }
    .name { font-size: 13px; color: #475569; margin: 4px 0 8px 0; }
    .val { font-family: monospace; font-size: 11px; color: #64748B; margin: 2px 0; }
  </style>
</head>
<body>
  <h1>${paletteName || 'Color Grading Palette'}</h1>
  <p class="meta">Harmonia: ${harmony} · Gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
  <div class="grid">
    ${validColors
      .map(
        c => `
      <div class="card">
        <div class="swatch" style="background-color: ${c.hex};"></div>
        <div class="info">
          <p class="hex">${c.hex}</p>
          <p class="name">${c.name}</p>
          <p class="val">RGB: ${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b}</p>
          <p class="val">CMYK: ${c.cmyk.c}, ${c.cmyk.m}, ${c.cmyk.y}, ${c.cmyk.k}</p>
          <p class="val">HSL: ${c.hsl.h}°, ${c.hsl.s}%, ${c.hsl.l}%</p>
        </div>
      </div>`
      )
      .join('')}
  </div>
  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
