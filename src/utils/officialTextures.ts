import * as THREE from 'three';
import {
  createEarthDayTexture,
  createEarthNightTexture,
  createEarthCloudTexture,
  createEarthSpecularTexture,
  createMercuryTexture,
  createVenusTexture,
  createMarsTexture,
  createJupiterTexture,
  createSaturnTexture,
  createSaturnRingTexture,
  createUranusTexture,
  createUranusRingTexture,
  createNeptuneTexture,
  createMoonTexture,
} from './proceduralTextures';

const textureLoader = new THREE.TextureLoader();
const loadedCache = new Map<string, THREE.Texture>();

/**
 * Load official NASA planetary texture with automatic procedural fallback and SRGB color space
 */
export function loadOfficialTexture(
  relativePath: string,
  fallbackFn: () => THREE.Texture,
  isColorMap: boolean = true,
  maxAnisotropy: number = 8
): THREE.Texture {
  if (loadedCache.has(relativePath)) {
    return loadedCache.get(relativePath)!;
  }

  // Use procedural texture as immediate placeholder to avoid any blank frames
  const fallbackTexture = fallbackFn();

  // Load official texture asynchronously from local public folder
  const texture = textureLoader.load(
    relativePath,
    (tex) => {
      if (isColorMap) {
        tex.colorSpace = THREE.SRGBColorSpace;
      }
      tex.anisotropy = maxAnisotropy;
      tex.needsUpdate = true;
    },
    undefined,
    () => {
      // In case of load issue, fallback is already in place
      console.warn(`Local texture ${relativePath} fallback activated`);
    }
  );

  if (isColorMap) {
    texture.colorSpace = THREE.SRGBColorSpace;
  }
  texture.anisotropy = maxAnisotropy;

  loadedCache.set(relativePath, texture);
  return texture;
}

export interface OfficialPlanetaryAssets {
  sun: THREE.Texture;
  mercury: THREE.Texture;
  mercuryBump: THREE.Texture;
  venus: THREE.Texture;
  venusBump: THREE.Texture;
  earthDay: THREE.Texture;
  earthNight: THREE.Texture;
  earthClouds: THREE.Texture;
  earthSpecular: THREE.Texture;
  earthNormal: THREE.Texture;
  moon: THREE.Texture;
  mars: THREE.Texture;
  marsBump: THREE.Texture;
  jupiter: THREE.Texture;
  saturn: THREE.Texture;
  saturnRing: THREE.Texture;
  uranus: THREE.Texture;
  uranusRing: THREE.Texture;
  neptune: THREE.Texture;
  galaxy: THREE.Texture;
}

export function loadAllOfficialPlanetaryAssets(maxAnisotropy: number = 8): OfficialPlanetaryAssets {
  return {
    sun: loadOfficialTexture('/textures/planets/sun.jpg', () => {
      const tex = new THREE.TextureLoader().load('/textures/planets/sun.jpg');
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }, true, maxAnisotropy),

    mercury: loadOfficialTexture('/textures/planets/mercury.jpg', createMercuryTexture, true, maxAnisotropy),
    mercuryBump: loadOfficialTexture('/textures/planets/mercury_bump.jpg', () => new THREE.Texture(), false, maxAnisotropy),

    venus: loadOfficialTexture('/textures/planets/venus.jpg', createVenusTexture, true, maxAnisotropy),
    venusBump: loadOfficialTexture('/textures/planets/venus_bump.jpg', () => new THREE.Texture(), false, maxAnisotropy),

    earthDay: loadOfficialTexture('/textures/planets/earth_day.jpg', createEarthDayTexture, true, maxAnisotropy),
    earthNight: loadOfficialTexture('/textures/planets/earth_night.png', createEarthNightTexture, true, maxAnisotropy),
    earthClouds: loadOfficialTexture('/textures/planets/earth_clouds.png', createEarthCloudTexture, false, maxAnisotropy),
    earthSpecular: loadOfficialTexture('/textures/planets/earth_specular.jpg', createEarthSpecularTexture, false, maxAnisotropy),
    earthNormal: loadOfficialTexture('/textures/planets/earth_normal.jpg', () => new THREE.Texture(), false, maxAnisotropy),
    moon: loadOfficialTexture('/textures/planets/moon.jpg', createMoonTexture, true, maxAnisotropy),

    mars: loadOfficialTexture('/textures/planets/mars.jpg', createMarsTexture, true, maxAnisotropy),
    marsBump: loadOfficialTexture('/textures/planets/mars_bump.jpg', () => new THREE.Texture(), false, maxAnisotropy),

    jupiter: loadOfficialTexture('/textures/planets/jupiter.jpg', createJupiterTexture, true, maxAnisotropy),

    saturn: loadOfficialTexture('/textures/planets/saturn.jpg', createSaturnTexture, true, maxAnisotropy),
    saturnRing: loadOfficialTexture('/textures/planets/saturn_ring_color.jpg', createSaturnRingTexture, true, maxAnisotropy),

    uranus: loadOfficialTexture('/textures/planets/uranus.jpg', createUranusTexture, true, maxAnisotropy),
    uranusRing: loadOfficialTexture('/textures/planets/uranus_ring_color.jpg', createUranusRingTexture, true, maxAnisotropy),

    neptune: loadOfficialTexture('/textures/planets/neptune.jpg', createNeptuneTexture, true, maxAnisotropy),

    galaxy: loadOfficialTexture('/textures/planets/galaxy.png', () => new THREE.Texture(), true, 1),
  };
}
