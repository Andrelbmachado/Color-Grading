export type HarmonyType = 
  | 'free'
  | 'monochromatic'
  | 'analogous'
  | 'complementary'
  | 'splitComplementary'
  | 'triangular'
  | 'quadratic';

export type WheelShape = 'circle' | 'triangle' | 'square';

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number; // 0 - 360
  s: number; // 0 - 100
  l: number; // 0 - 100
}

export interface HSV {
  h: number; // 0 - 360
  s: number; // 0 - 100
  v: number; // 0 - 100
}

export interface CMYK {
  c: number; // 0 - 100
  m: number; // 0 - 100
  y: number; // 0 - 100
  k: number; // 0 - 100
}

export interface ColorItem {
  id: number;
  hex: string;
  rgb: RGB;
  hsl: HSL;
  hsv: HSV;
  cmyk: CMYK;
  name: string;
  locked?: boolean;
  isEmpty?: boolean;
}

export interface SavedPalette {
  id: string;
  name: string;
  harmony: HarmonyType;
  colors: {
    hex: string;
    name: string;
    locked?: boolean;
  }[];
  createdAt: string;
}
