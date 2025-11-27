import { ColorPalette } from './types';
import { Activity, Circle, BarChart2, Sun, Sparkles } from 'lucide-react';

export const DEFAULT_PALETTES: ColorPalette[] = [
  {
    name: 'Neon Cyber',
    background: '#050505',
    primary: '#00f2ff',
    secondary: '#bc13fe',
    accent: '#ffffff'
  },
  {
    name: 'Sunset Vibe',
    background: '#1a0b0b',
    primary: '#ff9a9e',
    secondary: '#fecfef',
    accent: '#ffecd2'
  },
  {
    name: 'Matrix',
    background: '#000000',
    primary: '#00ff41',
    secondary: '#008f11',
    accent: '#e0ffe0'
  },
  {
    name: 'Ocean Deep',
    background: '#001e2b',
    primary: '#00b4d8',
    secondary: '#90e0ef',
    accent: '#caf0f8'
  },
  {
    name: 'Royal Gold',
    background: '#120f00',
    primary: '#ffd700',
    secondary: '#ffaa00',
    accent: '#ffffff'
  }
];

export const VIZ_TYPES = [
  { id: 'wave', label: 'Flow Wave', icon: Activity },
  { id: 'bars', label: 'Linear Cava', icon: BarChart2 },
  { id: 'circle', label: 'Orbit Loop', icon: Circle },
  { id: 'sunburst', label: 'Radial Bars', icon: Sun },
  { id: 'stardust', label: 'Stardust', icon: Sparkles },
] as const;