export type VizType = 'wave' | 'bars' | 'circle' | 'sunburst' | 'stardust';

export interface ColorPalette {
  name: string;
  background: string;
  primary: string;
  secondary: string;
  accent: string;
}

export interface AudioData {
  timeData: Uint8Array;
  freqData: Uint8Array;
}

export interface AIThemeResponse {
  palette: ColorPalette;
  recommendedVizType: VizType;
  description: string;
}