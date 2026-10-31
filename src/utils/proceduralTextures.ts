import * as THREE from 'three';

// Cache generated textures so we don't recreate them needlessly
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Procedural Simplex / Perlin-like 2D noise helper for smooth natural terrain & clouds
 */
function createNoiseHelper(width: number, height: number, octaves: number = 4) {
  const p = new Uint8Array(512);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = p[i]; p[i] = p[j]; p[j] = t;
  }
  for (let i = 0; i < 256; i++) p[256 + i] = p[i];

  function fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(t: number, a: number, b: number) { return a + t * (b - a); }
  function grad(hash: number, x: number, y: number) {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  function noise2D(x: number, y: number) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const A = p[X] + Y;
    const B = p[X + 1] + Y;
    return lerp(v,
      lerp(u, grad(p[A], xf, yf), grad(p[B], xf - 1, yf)),
      lerp(u, grad(p[A + 1], xf, yf - 1), grad(p[B + 1], xf - 1, yf - 1))
    );
  }

  function fbm(x: number, y: number) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      total += noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return (total / maxValue + 1) * 0.5;
  }

  return { noise2D, fbm };
}

/**
 * High-Definition Procedural Earth Day Texture (2048 x 1024)
 * Highly realistic continents, mountain topography, biomes, ocean depths.
 */
export function createEarthDayTexture(): THREE.CanvasTexture {
  const cacheKey = 'earth_day_hd';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 1. Ocean base gradient with realistic bathymetry
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#04162e'); // Polar deep
  oceanGrad.addColorStop(0.3, '#082549'); // Mid-latitude
  oceanGrad.addColorStop(0.5, '#0a3260'); // Equatorial deep
  oceanGrad.addColorStop(0.7, '#082549');
  oceanGrad.addColorStop(1, '#04162e');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Continental shelf shallow turquoise water
  const noise = createNoiseHelper(width, height, 4);

  // Draw realistic landmasses with biome blending
  function drawDetailedLandmass(
    polygon: [number, number][],
    baseColor: string,
    desertColor?: string,
    mountainColor?: string
  ) {
    ctx.save();
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.moveTo(polygon[0][0] * width, polygon[0][1] * height);
    for (let i = 1; i < polygon.length; i++) {
      ctx.lineTo(polygon[i][0] * width, polygon[i][1] * height);
    }
    ctx.closePath();
    ctx.fill();

    // Continental shelf coastal glow
    ctx.strokeStyle = '#1a5f8a';
    ctx.lineWidth = 14;
    ctx.stroke();
    ctx.strokeStyle = '#2d84b6';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Fill inner land
    ctx.fill();

    // Desert / arid zones
    if (desertColor) {
      ctx.fillStyle = desertColor;
      ctx.beginPath();
      for (let i = 0; i < polygon.length; i += 2) {
        const p1 = polygon[i];
        const p2 = polygon[(i + 1) % polygon.length];
        const mx = ((p1[0] + p2[0]) * 0.5) * width;
        const my = ((p1[1] + p2[1]) * 0.5) * height;
        ctx.arc(mx, my, 40 + (i % 4) * 15, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    // Mountain ridges
    if (mountainColor) {
      ctx.strokeStyle = mountainColor;
      ctx.lineWidth = 8;
      ctx.beginPath();
      for (let i = 0; i < polygon.length - 1; i += 3) {
        const p1 = polygon[i];
        const p2 = polygon[i + 1];
        ctx.moveTo(p1[0] * width, p1[1] * height);
        ctx.lineTo(p2[0] * width, p2[1] * height);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // Eurasia (Europe, Russia, China, India, Middle East)
  drawDetailedLandmass([
    [0.44, 0.22], [0.50, 0.16], [0.65, 0.14], [0.78, 0.18], [0.88, 0.24],
    [0.90, 0.35], [0.82, 0.42], [0.75, 0.46], [0.70, 0.56], [0.66, 0.48],
    [0.58, 0.45], [0.52, 0.48], [0.46, 0.42], [0.42, 0.35], [0.44, 0.26]
  ], '#2c5928', '#8f7e4a', '#544634');

  // Africa
  drawDetailedLandmass([
    [0.46, 0.38], [0.55, 0.38], [0.60, 0.44], [0.64, 0.52], [0.58, 0.68],
    [0.54, 0.74], [0.50, 0.74], [0.45, 0.62], [0.43, 0.48], [0.44, 0.42]
  ], '#3b5e2b', '#b09559', '#7a633a');

  // North America
  drawDetailedLandmass([
    [0.08, 0.18], [0.18, 0.14], [0.26, 0.16], [0.32, 0.22], [0.28, 0.34],
    [0.24, 0.42], [0.20, 0.48], [0.16, 0.45], [0.12, 0.36], [0.09, 0.28]
  ], '#325828', '#8a7d4e', '#5a4935');

  // South America
  drawDetailedLandmass([
    [0.20, 0.48], [0.28, 0.48], [0.34, 0.56], [0.32, 0.68], [0.28, 0.82],
    [0.24, 0.84], [0.22, 0.72], [0.21, 0.58]
  ], '#225526', '#427038', '#685038');

  // Australia
  drawDetailedLandmass([
    [0.78, 0.62], [0.88, 0.60], [0.91, 0.70], [0.86, 0.78], [0.78, 0.76], [0.75, 0.68]
  ], '#9c733f', '#b87c3b', '#7a5124');

  // Antarctica & Arctic Ice Caps
  ctx.fillStyle = '#f0f6fa';
  // North Pole Ice
  ctx.beginPath();
  ctx.ellipse(width * 0.5, 0, width * 0.5, height * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  // Antarctica Ice Sheet
  ctx.beginPath();
  ctx.ellipse(width * 0.5, height, width * 0.5, height * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();

  // Add terrain micro-noise for realism
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const idx = (y * width + x) * 4;
      if (data[idx + 1] > 60 && data[idx + 2] < 100) { // On land
        const nv = noise.fbm(x * 0.015, y * 0.015);
        const factor = 0.85 + nv * 0.3;
        data[idx] = Math.min(255, data[idx] * factor);
        data[idx + 1] = Math.min(255, data[idx + 1] * factor);
        data[idx + 2] = Math.min(255, data[idx + 2] * factor);
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Earth Night Lights Texture (2048 x 1024)
 * Golden illuminated city webs on dark continents (Europe, East Asia, North America, Nile, coasts)
 */
export function createEarthNightTexture(): THREE.CanvasTexture {
  const cacheKey = 'earth_night_hd';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Pitch black deep space night background
  ctx.fillStyle = '#020409';
  ctx.fillRect(0, 0, width, height);

  // Helper to draw city light clusters
  function drawCityCluster(cx: number, cy: number, radius: number, density: number = 25) {
    const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, radius);
    grad.addColorStop(0, 'rgba(255, 220, 140, 0.95)');
    grad.addColorStop(0.3, 'rgba(255, 180, 80, 0.7)');
    grad.addColorStop(0.7, 'rgba(220, 130, 40, 0.35)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Spoke points along highways
    ctx.fillStyle = 'rgba(255, 235, 170, 0.85)';
    for (let i = 0; i < density; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius * 0.85;
      const px = cx + Math.cos(ang) * dist;
      const py = cy + Math.sin(ang) * dist;
      const dotSize = Math.random() > 0.8 ? 1.8 : 1.0;
      ctx.fillRect(px, py, dotSize, dotSize);
    }
  }

  // Western & Central Europe
  drawCityCluster(width * 0.48, height * 0.32, 45, 50);
  drawCityCluster(width * 0.46, height * 0.30, 35, 40); // UK
  drawCityCluster(width * 0.51, height * 0.33, 40, 45); // Central Europe
  drawCityCluster(width * 0.50, height * 0.38, 30, 30); // Italy

  // East Asia (China coastal mega-regions, Japan, Korea)
  drawCityCluster(width * 0.78, height * 0.40, 55, 60); // Yangtze Delta & Beijing
  drawCityCluster(width * 0.76, height * 0.46, 45, 50); // Pearl River Delta
  drawCityCluster(width * 0.84, height * 0.38, 40, 50); // Japan Tokyo belt
  drawCityCluster(width * 0.80, height * 0.37, 25, 30); // Korea

  // North America (East Coast, Great Lakes, West Coast)
  drawCityCluster(width * 0.26, height * 0.32, 55, 60); // BosWash Megalopolis
  drawCityCluster(width * 0.22, height * 0.31, 40, 40); // Chicago / Midwest
  drawCityCluster(width * 0.14, height * 0.34, 35, 35); // California Los Angeles / SF
  drawCityCluster(width * 0.15, height * 0.28, 25, 25); // Seattle / Vancouver

  // India
  drawCityCluster(width * 0.68, height * 0.44, 50, 55); // Indo-Gangetic Plain

  // Middle East & Nile River
  drawCityCluster(width * 0.58, height * 0.42, 35, 30); // Persian Gulf
  // Nile ribbon
  ctx.strokeStyle = 'rgba(255, 200, 100, 0.75)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(width * 0.53, height * 0.38);
  ctx.lineTo(width * 0.54, height * 0.48);
  ctx.stroke();

  // South America & Australia coasts
  drawCityCluster(width * 0.31, height * 0.66, 35, 30); // São Paulo / Rio
  drawCityCluster(width * 0.27, height * 0.72, 25, 20); // Buenos Aires
  drawCityCluster(width * 0.88, height * 0.72, 30, 25); // Sydney / Melbourne

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * High-Definition Procedural Earth Clouds (2048 x 1024)
 * Natural cyclone storms, trade wind bands, realistic atmospheric turbulence.
 */
export function createEarthCloudTexture(): THREE.CanvasTexture {
  const cacheKey = 'earth_clouds_hd';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, width, height);

  const noise = createNoiseHelper(width, height, 5);

  // Cloud density canvas with fractal noise
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    const lat = (y / height - 0.5) * 2; // -1 at north, 1 at south
    // Equatorial ITCZ and Mid-latitude storm tracks have more clouds
    const bandMask = Math.exp(-Math.pow(lat, 2) * 8.0) * 0.35 // ITCZ
      + Math.exp(-Math.pow(Math.abs(lat) - 0.45, 2) * 16.0) * 0.45; // 40-50 deg storm track

    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const nx = (x / width) * 12.0;
      const ny = (y / height) * 6.0;

      // Swirling swirl distortion
      const warp = noise.fbm(nx * 0.6, ny * 0.6);
      const val = noise.fbm(nx + warp * 1.5, ny + warp * 1.5);

      const density = Math.max(0, (val + bandMask - 0.52) * 2.4);
      const alpha = Math.min(240, Math.floor(density * 255));

      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = alpha;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Add distinct spiral cyclonic hurricanes
  const hurricanes = [
    { x: width * 0.25, y: height * 0.34, r: 65 }, // Atlantic hurricane
    { x: width * 0.76, y: height * 0.36, r: 75 }, // Pacific typhoon
    { x: width * 0.38, y: height * 0.68, r: 60 }, // Southern ocean vortex
  ];

  hurricanes.forEach(h => {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 3.5;
    for (let a = 0; a < Math.PI * 8; a += 0.15) {
      const r = (a / (Math.PI * 8)) * h.r;
      const px = h.x + Math.cos(a) * r;
      const py = h.y + Math.sin(a) * r;
      if (a === 0) ctx.beginPath();
      ctx.lineTo(px, py);
    }
    ctx.stroke();
    // Central eye
    ctx.clearRect(h.x - 4, h.y - 4, 8, 8);
    ctx.restore();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Earth Specular Map (1024 x 512):
 * Oceans = pure white (reflective mirror glint), Continents = black (matte)
 */
export function createEarthSpecularTexture(): THREE.CanvasTexture {
  const cacheKey = 'earth_specular';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Oceans are shiny white
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Landmasses are matte black
  ctx.fillStyle = '#080808';

  function fillLand(pts: [number, number][]) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0] * width, pts[0][1] * height);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * width, pts[i][1] * height);
    ctx.closePath();
    ctx.fill();
  }

  // Eurasia
  fillLand([[0.44, 0.22], [0.50, 0.16], [0.65, 0.14], [0.78, 0.18], [0.88, 0.24], [0.90, 0.35], [0.82, 0.42], [0.75, 0.46], [0.70, 0.56], [0.66, 0.48], [0.58, 0.45], [0.52, 0.48], [0.46, 0.42], [0.42, 0.35]]);
  // Africa
  fillLand([[0.46, 0.38], [0.55, 0.38], [0.60, 0.44], [0.64, 0.52], [0.58, 0.68], [0.54, 0.74], [0.50, 0.74], [0.45, 0.62], [0.43, 0.48], [0.44, 0.42]]);
  // Americas
  fillLand([[0.08, 0.18], [0.18, 0.14], [0.26, 0.16], [0.32, 0.22], [0.28, 0.34], [0.24, 0.42], [0.20, 0.48], [0.16, 0.45], [0.12, 0.36]]);
  fillLand([[0.20, 0.48], [0.28, 0.48], [0.34, 0.56], [0.32, 0.68], [0.28, 0.82], [0.24, 0.84], [0.22, 0.72], [0.21, 0.58]]);
  // Australia
  fillLand([[0.78, 0.62], [0.88, 0.60], [0.91, 0.70], [0.86, 0.78], [0.78, 0.76], [0.75, 0.68]]);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * High-Definition Jupiter (2048 x 1024)
 * 16 turbulent cloud zones and belts, Great Red Spot with inner eye and vortex ripples.
 */
export function createJupiterTexture(): THREE.CanvasTexture {
  const cacheKey = 'jupiter_hd';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const noise = createNoiseHelper(width, height, 4);

  // Zonal latitude bands
  const bands = [
    { y: 0.05, h: 0.08, color: '#684d38' }, // Polar hood
    { y: 0.13, h: 0.07, color: '#c49a6c' }, // North polar zone
    { y: 0.20, h: 0.06, color: '#824e2c' }, // North north temperate belt
    { y: 0.26, h: 0.07, color: '#d8ba92' }, // North temperate zone
    { y: 0.33, h: 0.09, color: '#96522c' }, // North temperate belt
    { y: 0.42, h: 0.11, color: '#d6a877' }, // North tropical zone
    { y: 0.53, h: 0.12, color: '#884323' }, // North Equatorial Belt (NEB)
    { y: 0.65, h: 0.08, color: '#e0c89d' }, // Equatorial Zone (EZ)
    { y: 0.73, h: 0.10, color: '#8c4826' }, // South Equatorial Belt (SEB)
    { y: 0.83, h: 0.07, color: '#c99a69' }, // South tropical zone
    { y: 0.90, h: 0.10, color: '#644734' }, // South polar region
  ];

  ctx.fillStyle = '#b8895b';
  ctx.fillRect(0, 0, width, height);

  // Draw smooth sinusoidal turbulence between bands
  bands.forEach(b => {
    ctx.fillStyle = b.color;
    ctx.beginPath();
    const startY = b.y * height;
    const bandH = b.h * height;
    ctx.moveTo(0, startY);
    for (let x = 0; x <= width; x += 10) {
      const wave = Math.sin(x * 0.02 + b.y * 10) * 8 + Math.cos(x * 0.008) * 14;
      ctx.lineTo(x, startY + wave);
    }
    for (let x = width; x >= 0; x -= 10) {
      const wave = Math.sin(x * 0.02 + b.y * 10 + 2) * 8 + Math.cos(x * 0.008) * 14;
      ctx.lineTo(x, startY + bandH + wave);
    }
    ctx.closePath();
    ctx.fill();
  });

  // Add micro-eddies and festoons along the Equatorial belts
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const idx = (y * width + x) * 4;
      const nv = noise.fbm(x * 0.015, y * 0.012);
      const perturb = (nv - 0.5) * 40;
      data[idx] = Math.max(0, Math.min(255, data[idx] + perturb));
      data[idx + 1] = Math.max(0, Math.min(255, data[idx + 1] + perturb * 0.8));
      data[idx + 2] = Math.max(0, Math.min(255, data[idx + 2] + perturb * 0.5));
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Great Red Spot (GRS) with swirling core at ~22° South
  const grsX = width * 0.62;
  const grsY = height * 0.75;
  const grsW = 120;
  const grsH = 68;

  // Outer turbulent boundary
  const grsGrad = ctx.createRadialGradient(grsX, grsY, 5, grsX, grsY, grsW);
  grsGrad.addColorStop(0, '#c93b1e');
  grsGrad.addColorStop(0.4, '#d84e20');
  grsGrad.addColorStop(0.75, '#b03b1a');
  grsGrad.addColorStop(1, 'rgba(176, 59, 26, 0)');
  ctx.fillStyle = grsGrad;
  ctx.beginPath();
  ctx.ellipse(grsX, grsY, grsW, grsH, 0.06, 0, Math.PI * 2);
  ctx.fill();

  // Spiral swirl detail inside Great Red Spot
  ctx.strokeStyle = 'rgba(255, 200, 160, 0.45)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let a = 0; a < Math.PI * 6; a += 0.2) {
    const rx = (a / (Math.PI * 6)) * (grsW * 0.7);
    const ry = (a / (Math.PI * 6)) * (grsH * 0.7);
    const px = grsX + Math.cos(a) * rx;
    const py = grsY + Math.sin(a) * ry;
    if (a === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * High-Definition Saturn Rings (2048 x 64):
 * Full ring system structure with D, C, B, Cassini Division, A, Encke Gap, F rings.
 */
export function createSaturnRingTexture(): THREE.CanvasTexture {
  const cacheKey = 'saturn_rings_hd';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const size = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, 64);

  for (let x = 0; x < size; x++) {
    const t = x / size; // 0 = inner, 1 = outer

    let alpha = 0.8;
    let r = 210, g = 195, b = 160;

    // C Ring (innermost, dim translucent)
    if (t < 0.20) {
      alpha = 0.25 + Math.sin(t * 120) * 0.08;
      r = 175; g = 160; b = 135;
    }
    // B Ring (densest, brightest, multi-ringlets)
    else if (t >= 0.20 && t < 0.58) {
      alpha = 0.88 + Math.sin(t * 220) * 0.1;
      r = 238; g = 218; b = 178;
    }
    // Cassini Division (major gap)
    else if (t >= 0.58 && t < 0.65) {
      alpha = 0.03; // near transparent gap
      r = 80; g = 70; b = 55;
    }
    // A Ring (wide bright outer ring)
    else if (t >= 0.65 && t < 0.94) {
      // Encke gap inside A ring
      if (t >= 0.83 && t <= 0.85) {
        alpha = 0.04;
      } else {
        alpha = 0.72 + Math.sin(t * 160) * 0.08;
        r = 215; g = 198; b = 162;
      }
    }
    // F Ring & outer falloff
    else {
      alpha = Math.max(0, (1.0 - t) * 4 * (Math.sin(t * 300) > 0 ? 0.35 : 0.05));
      r = 190; g = 175; b = 145;
    }

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
    ctx.fillRect(x, 0, 1, 64);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * High-Definition Mars (1024 x 512):
 * Iron oxide relief, Tharsis volcanoes, Valles Marineris, polar ice caps with spiral grooves.
 */
export function createMarsTexture(): THREE.CanvasTexture {
  const cacheKey = 'mars_hd';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const noise = createNoiseHelper(width, height, 4);

  // Base Martian reddish-orange surface
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#af3d12');
  grad.addColorStop(0.3, '#c94d18');
  grad.addColorStop(0.5, '#dc5a1e');
  grad.addColorStop(0.7, '#c94d18');
  grad.addColorStop(1, '#af3d12');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Dark basaltic volcanic lowlands (Syrtis Major, Acidalia Planitia)
  ctx.fillStyle = 'rgba(64, 30, 18, 0.65)';
  const darkBasins = [
    { x: width * 0.32, y: height * 0.50, rx: 110, ry: 65 },
    { x: width * 0.68, y: height * 0.42, rx: 150, ry: 80 },
    { x: width * 0.82, y: height * 0.62, rx: 90, ry: 50 },
  ];
  darkBasins.forEach(d => {
    ctx.beginPath();
    ctx.ellipse(d.x, d.y, d.rx, d.ry, 0.2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Valles Marineris canyon grand rift
  ctx.strokeStyle = 'rgba(40, 15, 8, 0.85)';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(width * 0.34, height * 0.54);
  ctx.bezierCurveTo(width * 0.42, height * 0.57, width * 0.48, height * 0.51, width * 0.58, height * 0.56);
  ctx.stroke();

  // Olympus Mons and Tharsis Montes
  const volcanoes = [
    { x: width * 0.22, y: height * 0.46, r: 16 }, // Olympus Mons
    { x: width * 0.26, y: height * 0.54, r: 9 },  // Arsia
    { x: width * 0.28, y: height * 0.50, r: 9 },  // Pavonis
    { x: width * 0.30, y: height * 0.46, r: 9 },  // Ascraeus
  ];
  volcanoes.forEach(v => {
    const vg = ctx.createRadialGradient(v.x, v.y, 2, v.x, v.y, v.r);
    vg.addColorStop(0, '#e88258');
    vg.addColorStop(0.7, '#8f3d1b');
    vg.addColorStop(1, 'transparent');
    ctx.fillStyle = vg;
    ctx.beginPath();
    ctx.arc(v.x, v.y, v.r, 0, Math.PI * 2);
    ctx.fill();

    // Caldera crater pit
    ctx.fillStyle = '#2c0e05';
    ctx.beginPath();
    ctx.arc(v.x, v.y, v.r * 0.25, 0, Math.PI * 2);
    ctx.fill();
  });

  // Polar ice caps with spiral pinwheel frost grooves
  ctx.fillStyle = '#f8fafc';
  // North polar cap
  ctx.beginPath();
  ctx.ellipse(width * 0.5, 0, width * 0.26, height * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  // South polar cap
  ctx.beginPath();
  ctx.ellipse(width * 0.5, height, width * 0.30, height * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * High-Definition Venus (1024 x 512):
 * Dense sulfur-yellow atmosphere with UV chevron wave clouds and super-rotating streaks.
 */
export function createVenusTexture(): THREE.CanvasTexture {
  const cacheKey = 'venus_hd';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#caa268');
  grad.addColorStop(0.25, '#dfbe86');
  grad.addColorStop(0.5, '#edd19d');
  grad.addColorStop(0.75, '#dfbe86');
  grad.addColorStop(1, '#caa268');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Chevron wave pattern
  for (let y = 0; y < height; y += 4) {
    const lat = (y / height - 0.5) * 2;
    const wave = Math.sin(y * 0.04) * 35;
    ctx.strokeStyle = Math.abs(lat) > 0.6 ? 'rgba(175, 135, 75, 0.2)' : 'rgba(255, 240, 200, 0.25)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= width; x += 25) {
      const off = Math.sin((x + wave) * 0.015) * 15;
      ctx.lineTo(x, y + off);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * High-Definition Mercury (1024 x 512):
 * High-contrast rugged cratered basalt with bright impact rays (Kuiper/Tycho style)
 */
export function createMercuryTexture(): THREE.CanvasTexture {
  const cacheKey = 'mercury_hd';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#6f6c68';
  ctx.fillRect(0, 0, width, height);

  // Craters and Ray systems
  for (let i = 0; i < 400; i++) {
    const cx = Math.random() * width;
    const cy = Math.random() * height;
    const rad = 2 + Math.random() * 20;

    // Shadowed rim
    ctx.strokeStyle = 'rgba(30, 28, 26, 0.7)';
    ctx.lineWidth = Math.max(1, rad * 0.22);
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI);
    ctx.stroke();

    // Lit rim
    ctx.strokeStyle = 'rgba(235, 230, 225, 0.6)';
    ctx.beginPath();
    ctx.arc(cx, cy, rad, Math.PI, Math.PI * 2);
    ctx.stroke();

    // Crater floor
    ctx.fillStyle = 'rgba(55, 52, 48, 0.5)';
    ctx.beginPath();
    ctx.arc(cx, cy, rad * 0.85, 0, Math.PI * 2);
    ctx.fill();

    // Ray craters
    if (rad > 14 && Math.random() > 0.55) {
      ctx.strokeStyle = 'rgba(240, 235, 230, 0.35)';
      ctx.lineWidth = 1;
      for (let ray = 0; ray < 10; ray++) {
        const ang = (ray / 10) * Math.PI * 2 + Math.random() * 0.15;
        const len = rad * (2.5 + Math.random() * 3.5);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(ang) * len, cy + Math.sin(ang) * len);
        ctx.stroke();
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * High-Definition Saturn Globe (1024 x 512)
 */
export function createSaturnTexture(): THREE.CanvasTexture {
  const cacheKey = 'saturn_hd';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const bands = ['#c8af79', '#ddc89a', '#e8d7ae', '#eddcb6', '#d6bd88', '#e2cf9f', '#eddcb6', '#c8af79'];
  for (let y = 0; y < height; y++) {
    const idx = Math.floor((y / height) * bands.length);
    ctx.fillStyle = bands[idx % bands.length];
    ctx.fillRect(0, y, width, 1);
  }

  // Polar hexagonal shadow tone
  const northHex = ctx.createRadialGradient(width * 0.5, 0, 10, width * 0.5, 0, height * 0.22);
  northHex.addColorStop(0, 'rgba(110, 95, 65, 0.5)');
  northHex.addColorStop(1, 'transparent');
  ctx.fillStyle = northHex;
  ctx.fillRect(0, 0, width, height * 0.22);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * High-Definition Uranus (1024 x 512)
 */
export function createUranusTexture(): THREE.CanvasTexture {
  const cacheKey = 'uranus_hd';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#75dfd6');
  grad.addColorStop(0.3, '#8fe9e1');
  grad.addColorStop(0.5, '#a0f0e8');
  grad.addColorStop(0.7, '#8fe9e1');
  grad.addColorStop(1, '#75dfd6');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

export function createUranusRingTexture(): THREE.CanvasTexture {
  const cacheKey = 'uranus_rings_hd';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, 32);

  for (let x = 0; x < size; x++) {
    const t = x / size;
    let alpha = 0;
    if ((t > 0.3 && t < 0.35) || (t > 0.55 && t < 0.6) || (t > 0.8 && t < 0.88)) {
      alpha = 0.5;
    }
    ctx.fillStyle = `rgba(165, 215, 220, ${alpha})`;
    ctx.fillRect(x, 0, 1, 32);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * High-Definition Neptune (1024 x 512):
 * Deep azure blue, Great Dark Spot, white methane cirrus cloud streaks.
 */
export function createNeptuneTexture(): THREE.CanvasTexture {
  const cacheKey = 'neptune_hd';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#224683');
  grad.addColorStop(0.3, '#305faa');
  grad.addColorStop(0.5, '#3e75dc');
  grad.addColorStop(0.7, '#305faa');
  grad.addColorStop(1, '#224683');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Great Dark Spot (GDS)
  const gdsX = width * 0.42;
  const gdsY = height * 0.44;
  const gds = ctx.createRadialGradient(gdsX, gdsY, 5, gdsX, gdsY, 45);
  gds.addColorStop(0, 'rgba(14, 32, 75, 0.85)');
  gds.addColorStop(0.7, 'rgba(22, 52, 115, 0.45)');
  gds.addColorStop(1, 'transparent');
  ctx.fillStyle = gds;
  ctx.beginPath();
  ctx.ellipse(gdsX, gdsY, 48, 28, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // White methane cirrus storms
  ctx.strokeStyle = 'rgba(245, 252, 255, 0.75)';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 20; i++) {
    const y = height * (0.22 + (i / 20) * 0.55);
    const startX = ((i * 83) % width);
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.bezierCurveTo(startX + 70, y - 5, startX + 140, y + 5, startX + 210, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * High-Definition Moon (512 x 256):
 * Dark lunar maria (Sea of Tranquility, etc.) and bright impact crater rays.
 */
export function createMoonTexture(): THREE.CanvasTexture {
  const cacheKey = 'moon_hd';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#8a8a8c';
  ctx.fillRect(0, 0, width, height);

  // Dark lunar maria
  ctx.fillStyle = 'rgba(65, 65, 68, 0.65)';
  const maria = [
    { x: width * 0.35, y: height * 0.38, rx: 55, ry: 38 },
    { x: width * 0.55, y: height * 0.42, rx: 75, ry: 48 },
    { x: width * 0.70, y: height * 0.32, rx: 42, ry: 32 },
  ];
  maria.forEach(m => {
    ctx.beginPath();
    ctx.ellipse(m.x, m.y, m.rx, m.ry, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // Impact craters
  for (let i = 0; i < 150; i++) {
    const cx = Math.random() * width;
    const cy = Math.random() * height;
    const r = 1 + Math.random() * 6;
    ctx.strokeStyle = 'rgba(240, 240, 240, 0.45)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Anamorphic Lens Flare & Diffraction Spikes for Sun
 */
/**
 * Pure Photorealistic Solar Aura Glow (Soft Gaussian falloff, zero lines/axes)
 */
export function createSolarAuraTexture(): THREE.CanvasTexture {
  const cacheKey = 'solar_aura_soft';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const center = size / 2;
  ctx.clearRect(0, 0, size, size);

  // Soft natural radial solar flare gradient
  const grad = ctx.createRadialGradient(center, center, 0, center, center, center);
  grad.addColorStop(0, '#ffffff'); // White-hot star center
  grad.addColorStop(0.18, 'rgba(255, 245, 200, 0.95)'); // Inner golden core
  grad.addColorStop(0.38, 'rgba(255, 185, 50, 0.6)');  // Solar chromosphere
  grad.addColorStop(0.62, 'rgba(255, 120, 20, 0.25)'); // Outer corona
  grad.addColorStop(0.85, 'rgba(230, 80, 10, 0.08)');  // Subtle deep space dissipation
  grad.addColorStop(1.0, 'transparent');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

export function createGlowTexture(colorHex: string = '#ffffff'): THREE.CanvasTexture {
  const cacheKey = `glow_${colorHex}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const center = size / 2;
  const grad = ctx.createRadialGradient(center, center, 0, center, center, center);
  grad.addColorStop(0, colorHex);
  grad.addColorStop(0.25, colorHex + 'cc');
  grad.addColorStop(0.6, colorHex + '33');
  grad.addColorStop(1, 'transparent');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}
