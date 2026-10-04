import { CMYK, ColorItem, HarmonyType, HSL, HSV, RGB } from '../types';

// Curated recognized color names table for accurate name matching
const COLOR_NAMES: { name: string; hex: string }[] = [
  { name: 'Branco Puro', hex: '#FFFFFF' },
  { name: 'Preto Absoluto', hex: '#000000' },
  { name: 'Cinza Carvão', hex: '#262626' },
  { name: 'Cinza Grafite', hex: '#424242' },
  { name: 'Cinza Médio', hex: '#808080' },
  { name: 'Cinza Prata', hex: '#CCCCCC' },
  { name: 'Cinza Claro', hex: '#F0F0F0' },
  { name: 'Azul Celeste', hex: '#00E5FF' },
  { name: 'Azul Elétrico', hex: '#0070F3' },
  { name: 'Azul Cobalto', hex: '#0047AB' },
  { name: 'Azul Safira', hex: '#0F52BA' },
  { name: 'Azul Marinho', hex: '#001F3F' },
  { name: 'Azul Petróleo', hex: '#004953' },
  { name: 'Azul Petróleo Escuro', hex: '#056C5C' },
  { name: 'Azul Turquesa', hex: '#40E0D0' },
  { name: 'Azul Oceano', hex: '#007791' },
  { name: 'Azul Anil', hex: '#4B0082' },
  { name: 'Azul Real', hex: '#4169E1' },
  { name: 'Azul Violeta', hex: '#5B2DFF' },
  { name: 'Violeta Neon', hex: '#7928CA' },
  { name: 'Roxo Profundo', hex: '#311B92' },
  { name: 'Lilás Suave', hex: '#C8B6FF' },
  { name: 'Magenta Vivo', hex: '#FF007F' },
  { name: 'Rosa Choque', hex: '#FF1493' },
  { name: 'Rosa Chiclete', hex: '#FF98BB' },
  { name: 'Rosa Claro', hex: '#FFB6C1' },
  { name: 'Vermelho Carmesim', hex: '#BA1650' },
  { name: 'Vermelho Rubi', hex: '#E0115F' },
  { name: 'Vermelho Coral', hex: '#FF6B6B' },
  { name: 'Vermelho Carmim', hex: '#DC143C' },
  { name: 'Vermelho Escarlate', hex: '#FF2400' },
  { name: 'Vermelho Tijolo', hex: '#B22222' },
  { name: 'Laranja Queimado', hex: '#CC5500' },
  { name: 'Laranja Solar', hex: '#FF7F00' },
  { name: 'Pêssego Dourado', hex: '#FFB347' },
  { name: 'Amarelo Mostarda', hex: '#FFDB58' },
  { name: 'Amarelo Ouro', hex: '#FFD700' },
  { name: 'Amarelo Canário', hex: '#FFEF00' },
  { name: 'Verde Lima', hex: '#32CD32' },
  { name: 'Verde Esmeralda', hex: '#50C878' },
  { name: 'Verde Menta', hex: '#98FF98' },
  { name: 'Verde Floresta', hex: '#228B22' },
  { name: 'Verde Oliva', hex: '#808000' },
  { name: 'Verde Musgo', hex: '#4A5D23' },
  { name: 'Marrom Café', hex: '#4B3621' },
  { name: 'Marrom Canela', hex: '#D2691E' },
  { name: 'Areia Neutra', hex: '#D2B48C' },
  { name: 'Bege Suave', hex: '#F5F5DC' },
];

export function hexToRgb(hex: string): RGB {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num) || clean.length !== 6) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToHsv({ r, g, b }: RGB): HSV {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rNorm) {
      h = ((gNorm - bNorm) / delta) % 6;
    } else if (max === gNorm) {
      h = (bNorm - rNorm) / delta + 2;
    } else {
      h = (rNorm - gNorm) / delta + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : Math.round((delta / max) * 100);
  const v = Math.round(max * 100);

  return { h, s, v };
}

export function hsvToRgb({ h, s, v }: HSV): RGB {
  const sNorm = s / 100;
  const vNorm = v / 100;

  const c = vNorm * sNorm;
  const hPrime = ((h % 360) + 360) % 360 / 60;
  const x = c * (1 - Math.abs((hPrime % 2) - 1));
  const m = vNorm - c;

  let r1 = 0, g1 = 0, b1 = 0;
  if (hPrime >= 0 && hPrime < 1) {
    r1 = c; g1 = x; b1 = 0;
  } else if (hPrime >= 1 && hPrime < 2) {
    r1 = x; g1 = c; b1 = 0;
  } else if (hPrime >= 2 && hPrime < 3) {
    r1 = 0; g1 = c; b1 = x;
  } else if (hPrime >= 3 && hPrime < 4) {
    r1 = 0; g1 = x; b1 = c;
  } else if (hPrime >= 4 && hPrime < 5) {
    r1 = x; g1 = 0; b1 = c;
  } else if (hPrime >= 5 && hPrime < 6) {
    r1 = c; g1 = 0; b1 = x;
  }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rNorm) {
      h = ((gNorm - bNorm) / delta) % 6;
    } else if (max === gNorm) {
      h = (bNorm - rNorm) / delta + 2;
    } else {
      h = (rNorm - gNorm) / delta + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return {
    h,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const hPrime = ((h % 360) + 360) % 360 / 60;
  const x = c * (1 - Math.abs((hPrime % 2) - 1));
  const m = lNorm - c / 2;

  let r1 = 0, g1 = 0, b1 = 0;
  if (hPrime >= 0 && hPrime < 1) {
    r1 = c; g1 = x; b1 = 0;
  } else if (hPrime >= 1 && hPrime < 2) {
    r1 = x; g1 = c; b1 = 0;
  } else if (hPrime >= 2 && hPrime < 3) {
    r1 = 0; g1 = c; b1 = x;
  } else if (hPrime >= 3 && hPrime < 4) {
    r1 = 0; g1 = x; b1 = c;
  } else if (hPrime >= 4 && hPrime < 5) {
    r1 = x; g1 = 0; b1 = c;
  } else if (hPrime >= 5 && hPrime < 6) {
    r1 = c; g1 = 0; b1 = x;
  }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

export function rgbToCmyk({ r, g, b }: RGB): CMYK {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const kNorm = 1 - Math.max(rNorm, gNorm, bNorm);
  if (kNorm >= 0.999) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  const cNorm = (1 - rNorm - kNorm) / (1 - kNorm);
  const mNorm = (1 - gNorm - kNorm) / (1 - kNorm);
  const yNorm = (1 - bNorm - kNorm) / (1 - kNorm);

  return {
    c: Math.round(cNorm * 100),
    m: Math.round(mNorm * 100),
    y: Math.round(yNorm * 100),
    k: Math.round(kNorm * 100),
  };
}

export function cmykToRgb({ c, m, y, k }: CMYK): RGB {
  const cNorm = c / 100;
  const mNorm = m / 100;
  const yNorm = y / 100;
  const kNorm = k / 100;

  const r = Math.round(255 * (1 - cNorm) * (1 - kNorm));
  const g = Math.round(255 * (1 - mNorm) * (1 - kNorm));
  const b = Math.round(255 * (1 - yNorm) * (1 - kNorm));

  return {
    r: Math.max(0, Math.min(255, r)),
    g: Math.max(0, Math.min(255, g)),
    b: Math.max(0, Math.min(255, b)),
  };
}

export function getColorName(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  let bestDist = Infinity;
  let bestName = 'Cor Personalizada';

  for (const item of COLOR_NAMES) {
    const itemRgb = hexToRgb(item.hex);
    // Weighted Euclidean distance for human perception
    const dist =
      0.3 * Math.pow(r - itemRgb.r, 2) +
      0.59 * Math.pow(g - itemRgb.g, 2) +
      0.11 * Math.pow(b - itemRgb.b, 2);

    if (dist < bestDist) {
      bestDist = dist;
      bestName = item.name;
    }
  }

  return bestName;
}

export function createColorItem(id: number, hex: string, locked = false): ColorItem {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);
  const hsv = rgbToHsv(rgb);
  const cmyk = rgbToCmyk(rgb);
  const name = getColorName(hex);

  return {
    id,
    hex: hex.toUpperCase(),
    rgb,
    hsl,
    hsv,
    cmyk,
    name,
    locked,
    isEmpty: false,
  };
}

export function createColorFromHsl(id: number, hsl: HSL, locked = false): ColorItem {
  const rgb = hslToRgb(hsl);
  const hex = rgbToHex(rgb);
  const hsv = rgbToHsv(rgb);
  const cmyk = rgbToCmyk(rgb);
  const name = getColorName(hex);

  return {
    id,
    hex: hex.toUpperCase(),
    rgb,
    hsl,
    hsv,
    cmyk,
    name,
    locked,
    isEmpty: false,
  };
}

export function createColorFromHsv(id: number, hsv: HSV, locked = false): ColorItem {
  const rgb = hsvToRgb(hsv);
  const hex = rgbToHex(rgb);
  const hsl = rgbToHsl(rgb);
  const cmyk = rgbToCmyk(rgb);
  const name = getColorName(hex);

  return {
    id,
    hex: hex.toUpperCase(),
    rgb,
    hsl,
    hsv,
    cmyk,
    name,
    locked,
    isEmpty: false,
  };
}

// Relative luminance according to W3C
export function getRelativeLuminance({ r, g, b }: RGB): number {
  const transform = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
}

// WCAG Contrast Ratio
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getRelativeLuminance(hexToRgb(hex1));
  const lum2 = getRelativeLuminance(hexToRgb(hex2));
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return Number(((brightest + 0.05) / (darkest + 0.05)).toFixed(2));
}

export function getContrastTextColor(hex: string): '#FFFFFF' | '#000000' {
  const lum = getRelativeLuminance(hexToRgb(hex));
  return lum > 0.35 ? '#000000' : '#FFFFFF';
}

// Simulate Color Blindness (Deuteranopia, Protanopia, Tritanopia, Achromatopsia)
export function simulateColorBlindness(
  hex: string,
  type: 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia'
): string {
  if (type === 'normal') return hex;
  const { r, g, b } = hexToRgb(hex);

  let sr = r, sg = g, sb = b;

  if (type === 'protanopia') {
    sr = 0.56667 * r + 0.43333 * g;
    sg = 0.55833 * r + 0.44167 * g;
    sb = 0.24167 * g + 0.75833 * b;
  } else if (type === 'deuteranopia') {
    sr = 0.625 * r + 0.375 * g;
    sg = 0.7 * r + 0.3 * g;
    sb = 0.3 * g + 0.7 * b;
  } else if (type === 'tritanopia') {
    sr = 0.95 * r + 0.05 * g;
    sg = 0.43333 * g + 0.56667 * b;
    sb = 0.475 * g + 0.525 * b;
  } else if (type === 'achromatopsia') {
    const mono = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    sr = mono;
    sg = mono;
    sb = mono;
  }

  return rgbToHex({
    r: Math.min(255, Math.max(0, Math.round(sr))),
    g: Math.min(255, Math.max(0, Math.round(sg))),
    b: Math.min(255, Math.max(0, Math.round(sb))),
  });
}

// Helper to generate harmonious palette based on a base color item
export function generateHarmonicColors(
  baseColor: ColorItem,
  harmony: HarmonyType,
  currentColors: ColorItem[]
): ColorItem[] {
  const baseHsv = baseColor.hsv;
  const count = 5;
  const result: ColorItem[] = [];

  const mod360 = (h: number) => ((h % 360) + 360) % 360;

  for (let i = 0; i < count; i++) {
    const existing = currentColors[i];
    if (existing && existing.locked && existing.id !== baseColor.id) {
      result.push(existing);
      continue;
    }
    if (existing && existing.id === baseColor.id) {
      result.push({ ...baseColor, isEmpty: false });
      continue;
    }

    let h = baseHsv.h;
    let s = baseHsv.s;
    let v = baseHsv.v;
    let isEmpty = false;

    switch (harmony) {
      case 'monochromatic': {
        const satSteps = [100, 75, 55, 35, 20];
        const valSteps = [100, 85, 70, 50, 30];
        s = Math.max(15, Math.min(100, Math.round(baseHsv.s * (satSteps[i] / 100))));
        v = Math.max(0, Math.min(100, Math.round(baseHsv.v * (valSteps[i] / 100))));
        break;
      }
      case 'analogous': {
        // Equal spacing around the base hue
        const offsets = [-60, -30, 0, 30, 60];
        h = mod360(baseHsv.h + offsets[i]);
        s = baseHsv.s;
        v = baseHsv.v;
        break;
      }
      case 'complementary': {
        // Strict straight opposite diameter
        if (i === 0) {
          h = baseHsv.h;
        } else if (i === 1) {
          h = mod360(baseHsv.h + 180);
          s = baseHsv.s;
          v = baseHsv.v;
        } else if (i === 2) {
          h = baseHsv.h;
          s = Math.max(15, baseHsv.s - 35);
          v = Math.min(100, baseHsv.v + 10);
        } else if (i === 3) {
          h = mod360(baseHsv.h + 180);
          s = Math.max(15, baseHsv.s - 30);
          v = Math.min(100, baseHsv.v + 10);
        } else {
          isEmpty = existing?.isEmpty ?? true;
        }
        break;
      }
      case 'splitComplementary': {
        // Exact Y-shape: Base, Base + 150°, Base + 210° with matching saturation
        if (i === 0) {
          h = baseHsv.h;
        } else if (i === 1) {
          h = mod360(baseHsv.h + 150);
          s = baseHsv.s;
          v = baseHsv.v;
        } else if (i === 2) {
          h = mod360(baseHsv.h + 210);
          s = baseHsv.s;
          v = baseHsv.v;
        } else if (i === 3) {
          h = mod360(baseHsv.h + 150);
          s = Math.max(15, baseHsv.s - 35);
        } else {
          isEmpty = existing?.isEmpty ?? true;
        }
        break;
      }
      case 'triangular': {
        // Exact Equilateral Triangle: 0°, 120°, 240° with identical saturation/distance
        if (i === 0) {
          h = baseHsv.h;
        } else if (i === 1) {
          h = mod360(baseHsv.h + 120);
          s = baseHsv.s;
          v = baseHsv.v;
        } else if (i === 2) {
          h = mod360(baseHsv.h + 240);
          s = baseHsv.s;
          v = baseHsv.v;
        } else if (i === 3) {
          h = mod360(baseHsv.h + 120);
          s = Math.max(20, baseHsv.s - 30);
          v = Math.min(100, baseHsv.v + 15);
        } else {
          isEmpty = existing?.isEmpty ?? true;
        }
        break;
      }
      case 'quadratic': {
        // Exact Square: 0°, 90°, 180°, 270° with identical saturation/distance
        if (i === 0) {
          h = baseHsv.h;
        } else if (i === 1) {
          h = mod360(baseHsv.h + 90);
          s = baseHsv.s;
          v = baseHsv.v;
        } else if (i === 2) {
          h = mod360(baseHsv.h + 180);
          s = baseHsv.s;
          v = baseHsv.v;
        } else if (i === 3) {
          h = mod360(baseHsv.h + 270);
          s = baseHsv.s;
          v = baseHsv.v;
        } else {
          isEmpty = existing?.isEmpty ?? true;
        }
        break;
      }
      case 'free':
      default:
        if (existing) {
          result.push(existing);
          continue;
        }
        break;
    }

    const item = createColorFromHsv(i + 1, { h, s, v }, existing?.locked ?? false);
    if (isEmpty) {
      item.isEmpty = true;
      item.hex = '#------';
    }
    result.push(item);
  }

  return result;
}

export function extractPaletteFromImageFile(
  file: File,
  callback: (colors: ColorItem[]) => void
) {
  if (!file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = e => {
    const src = e.target?.result as string;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const maxDim = 150;
      const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

      const buckets: { [key: string]: { r: number; g: number; b: number; count: number } } = {};
      for (let i = 0; i < data.length; i += 16) {
        if (data[i + 3] < 128) continue;
        const r = Math.round(data[i] / 32) * 32;
        const g = Math.round(data[i + 1] / 32) * 32;
        const b = Math.round(data[i + 2] / 32) * 32;
        const k = `${r},${g},${b}`;
        if (!buckets[k]) buckets[k] = { r: data[i], g: data[i + 1], b: data[i + 2], count: 0 };
        buckets[k].count++;
      }

      const sorted = Object.values(buckets).sort((a, b) => b.count - a.count);
      const selected: string[] = [];
      for (const item of sorted) {
        const hex = rgbToHex(item);
        const distinct = selected.every(s => {
          const sRgb = hexToRgb(s);
          return Math.hypot(item.r - sRgb.r, item.g - sRgb.g, item.b - sRgb.b) > 50;
        });
        if (distinct) selected.push(hex);
        if (selected.length === 5) break;
      }
      while (selected.length < 5) {
        selected.push(sorted[selected.length] ? rgbToHex(sorted[selected.length]) : '#808080');
      }
      callback(selected.map((h, idx) => createColorItem(idx + 1, h)));
    };
    img.src = src;
  };
  reader.readAsDataURL(file);
}

export function parseHexInput(input: string): string | null {
  let clean = input.replace('#', '').trim();
  if (/^[0-9A-Fa-f]{6}$/.test(clean)) {
    return `#${clean.toUpperCase()}`;
  }
  if (/^[0-9A-Fa-f]{3}$/.test(clean)) {
    return `#${clean.split('').map(c => c + c).join('').toUpperCase()}`;
  }
  return null;
}

export function parseRgbInput(input: string): RGB | null {
  const match = input.match(/\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*/);
  if (match) {
    const r = Math.min(255, Math.max(0, parseInt(match[1], 10)));
    const g = Math.min(255, Math.max(0, parseInt(match[2], 10)));
    const b = Math.min(255, Math.max(0, parseInt(match[3], 10)));
    return { r, g, b };
  }
  return null;
}

export function parseCmykInput(input: string): CMYK | null {
  const match = input.match(/\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?\s*/);
  if (match) {
    const c = Math.min(100, Math.max(0, parseInt(match[1], 10)));
    const m = Math.min(100, Math.max(0, parseInt(match[2], 10)));
    const y = Math.min(100, Math.max(0, parseInt(match[3], 10)));
    const k = Math.min(100, Math.max(0, parseInt(match[4], 10)));
    return { c, m, y, k };
  }
  return null;
}

export function getRandomHex(): string {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
