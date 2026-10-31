export interface PlanetConfig {
  id: string;
  name: string;
  nameEn: string;
  color: string;
  radius: number; // relative display radius
  realRadiusKm: number;
  distance: number; // relative display distance from Sun
  realDistanceAU: number; // in AU
  orbitPeriodDays: number; // days for full orbit
  rotationPeriodHours: number; // hours for full rotation
  axialTiltDeg: number; // degrees
  textureType: 'sun' | 'mercury' | 'venus' | 'earth' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'moon';
  hasAtmosphere?: boolean;
  atmosphereColor?: string;
  hasRings?: boolean;
  ringsInnerRadius?: number;
  ringsOuterRadius?: number;
  hasClouds?: boolean;
  description: string;
  type: '恒星' | '类地行星' | '气态巨行星' | '冰巨星';
  temperature: string;
  moonsCount: number;
  gravity: string; // m/s²
  facts: string[];
}

export interface ViewPreset {
  id: string;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
}
