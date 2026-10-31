import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { SUN_CONFIG, PLANETS_CONFIG } from '../data/planets';
import { PlanetConfig } from '../types';
import {
  loadAllOfficialPlanetaryAssets,
  OfficialPlanetaryAssets,
} from '../utils/officialTextures';
import {
  createEarthRealisticMaterial,
  createSaturnRingMaterial,
  createAtmosphereMaterial,
  createOrbitLineMaterial,
} from '../utils/shaders';
import {
  createSolarAuraTexture,
  createGlowTexture,
} from '../utils/proceduralTextures';

export interface PlanetMeshObject {
  config: PlanetConfig;
  orbitGroup: THREE.Group;
  planetGroup: THREE.Group;
  axialGroup: THREE.Group;
  bodyMesh: THREE.Mesh;
  atmosphereMesh?: THREE.Mesh;
  cloudsMesh?: THREE.Mesh;
  ringsMesh?: THREE.Mesh;
  moonGroup?: THREE.Group;
  orbitLine: THREE.LineLoop;
  hitProxy: THREE.Mesh;
  currentAngle: number;
}

export interface SolarEngineOptions {
  container: HTMLDivElement;
  onSelectPlanet: (planet: PlanetConfig | null) => void;
  onHoverPlanet: (planet: PlanetConfig | null, screenPos?: { x: number; y: number }) => void;
}

export class SolarEngine {
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private isSoftwareGl: boolean;

  // Animation & Loop
  private animFrameId: number = 0;
  private clock: THREE.Clock = new THREE.Clock();
  public isPaused: boolean = false;
  public timeScale: number = 1.0;
  public realisticScale: boolean = false;
  public showOrbits: boolean = true;
  public showAtmospheres: boolean = true;
  public showAsteroidBelt: boolean = true;

  // Official Assets
  private assets: OfficialPlanetaryAssets;

  // Meshes & Shaders
  private sunGroup: THREE.Group;
  private earthMaterial: THREE.ShaderMaterial | null = null;
  private saturnRingMaterial: THREE.ShaderMaterial | null = null;
  private planets: Map<string, PlanetMeshObject> = new Map();
  private asteroidBeltInstanced: THREE.InstancedMesh | null = null;
  private asteroidCount = 1400;
  private starfield: THREE.Points | null = null;
  private skydome: THREE.Mesh | null = null;

  // Interaction
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();
  private hitMeshes: THREE.Mesh[] = [];
  public selectedPlanetId: string | null = null;
  private targetCameraPos: THREE.Vector3 = new THREE.Vector3();
  private targetLookAt: THREE.Vector3 = new THREE.Vector3();
  private isTransitioningCamera: boolean = false;

  // Callbacks
  private onSelectPlanetCallback: (planet: PlanetConfig | null) => void;
  private onHoverPlanetCallback: (planet: PlanetConfig | null, screenPos?: { x: number; y: number }) => void;

  // Scratch objects
  private _tempVec = new THREE.Vector3();
  private _tempVec2 = new THREE.Vector3();
  private _dummyMat = new THREE.Matrix4();
  private _dummyQuat = new THREE.Quaternion();
  private _dummyPos = new THREE.Vector3();
  private _dummyScale = new THREE.Vector3();

  constructor(options: SolarEngineOptions) {
    this.container = options.container;
    this.onSelectPlanetCallback = options.onSelectPlanet;
    this.onHoverPlanetCallback = options.onHoverPlanet;

    // 1. Detect software WebGL
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // 2. Initialize Three.js Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(this.renderer.domElement);

    // 3. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#010206');

    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.5, 6000);
    this.camera.position.set(0, 110, 210);

    // 4. Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 4.5;
    this.controls.maxDistance = 2000;
    this.controls.maxPolarAngle = Math.PI * 0.95;
    this.controls.target.set(0, 0, 0);

    this.controls.addEventListener('start', () => {
      this.isTransitioningCamera = false;
    });

    // 5. Environment Map & Lighting
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 6. Load official NASA planetary assets with max anisotropy
    const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
    this.assets = loadAllOfficialPlanetaryAssets(maxAnisotropy);

    this.setupLighting();

    // 7. Build Celestial System with Official Models
    this.sunGroup = new THREE.Group();

    this.buildDeepSpaceSkydome();
    this.buildSun();
    this.buildPlanets();
    this.buildAsteroidBelt();
    this.buildStarfield();

    // 8. Bind Events
    this.bindEvents();

    // 9. Pre-warm Shaders
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    // 10. Start Loop
    this.startLoop();
  }

  private setupLighting() {
    // 1. Central Sunlight (Warm, intense point light with natural distance falloff)
    const sunLight = new THREE.PointLight('#fffcf0', 5.8, 2000, 0.35);
    sunLight.position.set(0, 0, 0);
    this.scene.add(sunLight);

    // 2. Solar Inner Glow
    const sunWarmLight = new THREE.PointLight('#ff7b00', 3.0, 700, 0.45);
    sunWarmLight.position.set(0, 0, 0);
    this.scene.add(sunWarmLight);

    // 3. Starlight / Cosmic Fill Light (Keeps shadowed sides visible with realistic contrast)
    const hemiLight = new THREE.HemisphereLight('#253555', '#02040a', 0.5);
    this.scene.add(hemiLight);

    // 4. Subtle ambient for deep space
    const ambientLight = new THREE.AmbientLight('#0a1020', 0.22);
    this.scene.add(ambientLight);
  }

  /**
   * Deep Space Sky sphere with official NASA/ESA Milky Way Starfield
   */
  private buildDeepSpaceSkydome() {
    const skyGeo = new THREE.SphereGeometry(3200, 48, 36);
    const skyMat = new THREE.MeshBasicMaterial({
      map: this.assets.galaxy,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.85,
    });
    this.skydome = new THREE.Mesh(skyGeo, skyMat);
    // Align with galactic plane inclination (~63°)
    this.skydome.rotation.x = THREE.MathUtils.degToRad(63);
    this.scene.add(this.skydome);
  }

  /**
   * Sun: Official NASA SDO Photosphere + Soft Photorealistic Golden Solar Aura (Zero red ring, Zero cross axes)
   */
  private buildSun() {
    const sunRadius = SUN_CONFIG.radius;

    // 1. Primary Photosphere Sphere using official NASA SDO High-Resolution Map
    const coreGeo = new THREE.SphereGeometry(sunRadius, 64, 48);
    const coreMat = new THREE.MeshBasicMaterial({
      map: this.assets.sun,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    this.sunGroup.add(coreMesh);

    // 2. Soft Natural Solar Aura (Gentle Gaussian dissipation, no thick red ring, no cross axes)
    const auraTex = createSolarAuraTexture();
    const auraMat = new THREE.SpriteMaterial({
      map: auraTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.85,
      depthWrite: false,
    });
    const solarAura = new THREE.Sprite(auraMat);
    solarAura.scale.set(sunRadius * 2.9, sunRadius * 2.9, 1);
    this.sunGroup.add(solarAura);

    // 3. Hit Proxy for interaction
    const hitProxyGeo = new THREE.SphereGeometry(sunRadius * 1.35, 16, 16);
    const hitProxyMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitProxy = new THREE.Mesh(hitProxyGeo, hitProxyMat);
    hitProxy.userData = { id: 'sun', config: SUN_CONFIG };
    this.sunGroup.add(hitProxy);
    this.hitMeshes.push(hitProxy);

    this.scene.add(this.sunGroup);
  }

  /**
   * 8 Planets constructed with official NASA maps, bump/normal topography,
   * realistic specular oceans, dynamic clouds and ring systems
   */
  private buildPlanets() {
    PLANETS_CONFIG.forEach((planet, index) => {
      const orbitGroup = new THREE.Group();
      orbitGroup.name = `orbit_${planet.id}`;

      const planetGroup = new THREE.Group();
      planetGroup.name = `planetGroup_${planet.id}`;
      planetGroup.position.x = planet.distance;

      const axialGroup = new THREE.Group();
      axialGroup.rotation.z = THREE.MathUtils.degToRad(planet.axialTiltDeg);
      planetGroup.add(axialGroup);

      let bodyMesh: THREE.Mesh;
      let atmosphereMesh: THREE.Mesh | undefined;
      let cloudsMesh: THREE.Mesh | undefined;
      let ringsMesh: THREE.Mesh | undefined;
      let moonGroup: THREE.Group | undefined;

      // 1. Earth: Official NASA Blue Marble + Night Lights + Specular + Normal Elevation + Clouds
      if (planet.id === 'earth') {
        this.earthMaterial = createEarthRealisticMaterial(
          this.assets.earthDay,
          this.assets.earthNight,
          this.assets.earthClouds,
          this.assets.earthSpecular
        );
        const earthGeo = new THREE.SphereGeometry(planet.radius, 64, 48);
        bodyMesh = new THREE.Mesh(earthGeo, this.earthMaterial);
        axialGroup.add(bodyMesh);

        // Separate Cloud Mesh Layer for physical parallax depth
        const cloudGeo = new THREE.SphereGeometry(planet.radius * 1.015, 64, 48);
        const cloudMat = new THREE.MeshStandardMaterial({
          map: this.assets.earthClouds,
          transparent: true,
          opacity: 0.85,
          blending: THREE.NormalBlending,
          roughness: 0.95,
          depthWrite: false,
        });
        cloudsMesh = new THREE.Mesh(cloudGeo, cloudMat);
        axialGroup.add(cloudsMesh);

        // Atmosphere Rayleigh Scattering Rim
        const atmoGeo = new THREE.SphereGeometry(planet.radius * 1.048, 48, 36);
        const atmoMat = createAtmosphereMaterial('#3da8ff', 1.6, 2.7);
        atmosphereMesh = new THREE.Mesh(atmoGeo, atmoMat);
        axialGroup.add(atmosphereMesh);

        // Orbiting Moon with official NASA LRO texture
        moonGroup = new THREE.Group();
        const moonGeo = new THREE.SphereGeometry(0.78, 32, 24);
        const moonMat = new THREE.MeshStandardMaterial({
          map: this.assets.moon,
          roughness: 0.95,
          metalness: 0.05,
        });
        const moonMesh = new THREE.Mesh(moonGeo, moonMat);
        moonMesh.position.set(6.4, 0, 0);
        moonGroup.add(moonMesh);

        // Moon Orbit Line
        const moonOrbitGeo = new THREE.BufferGeometry();
        const moonPoints: number[] = [];
        for (let a = 0; a <= 64; a++) {
          const theta = (a / 64) * Math.PI * 2;
          moonPoints.push(Math.cos(theta) * 6.4, 0, Math.sin(theta) * 6.4);
        }
        moonOrbitGeo.setAttribute('position', new THREE.Float32BufferAttribute(moonPoints, 3));
        const moonOrbitLine = new THREE.LineLoop(
          moonOrbitGeo,
          new THREE.LineBasicMaterial({ color: 0x5577aa, transparent: true, opacity: 0.35 })
        );
        moonGroup.add(moonOrbitLine);
        planetGroup.add(moonGroup);
      } 
      // 2. Mercury: Official MESSENGER Map + Elevation Bump
      else if (planet.id === 'mercury') {
        const bodyGeo = new THREE.SphereGeometry(planet.radius, 64, 48);
        const bodyMat = new THREE.MeshStandardMaterial({
          map: this.assets.mercury,
          bumpMap: this.assets.mercuryBump,
          bumpScale: 0.08,
          roughness: 0.95,
          metalness: 0.05,
        });
        bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        axialGroup.add(bodyMesh);
      }
      // 3. Venus: Official Magellan Radar/Atmosphere Map + Elevation Bump
      else if (planet.id === 'venus') {
        const bodyGeo = new THREE.SphereGeometry(planet.radius, 64, 48);
        const bodyMat = new THREE.MeshStandardMaterial({
          map: this.assets.venus,
          bumpMap: this.assets.venusBump,
          bumpScale: 0.06,
          roughness: 0.4,
          metalness: 0.05,
        });
        bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        axialGroup.add(bodyMesh);

        const atmoGeo = new THREE.SphereGeometry(planet.radius * 1.055, 48, 36);
        const atmoMat = createAtmosphereMaterial('#ffc870', 1.4, 3.2);
        atmosphereMesh = new THREE.Mesh(atmoGeo, atmoMat);
        axialGroup.add(atmosphereMesh);
      }
      // 4. Mars: Official Viking/MGS Map + Olympus Mons/Valles Marineris Elevation Bump
      else if (planet.id === 'mars') {
        const bodyGeo = new THREE.SphereGeometry(planet.radius, 64, 48);
        const bodyMat = new THREE.MeshStandardMaterial({
          map: this.assets.mars,
          bumpMap: this.assets.marsBump,
          bumpScale: 0.12,
          roughness: 0.85,
          metalness: 0.05,
        });
        bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        axialGroup.add(bodyMesh);

        const atmoGeo = new THREE.SphereGeometry(planet.radius * 1.05, 48, 36);
        const atmoMat = createAtmosphereMaterial('#ffaa88', 1.2, 3.4);
        atmosphereMesh = new THREE.Mesh(atmoGeo, atmoMat);
        axialGroup.add(atmosphereMesh);
      }
      // 5. Jupiter: Official Cassini/Juno Cloud Belts & Great Red Spot
      else if (planet.id === 'jupiter') {
        const bodyGeo = new THREE.SphereGeometry(planet.radius, 64, 48);
        const bodyMat = new THREE.MeshStandardMaterial({
          map: this.assets.jupiter,
          roughness: 0.45,
          metalness: 0.05,
        });
        bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        axialGroup.add(bodyMesh);

        const atmoGeo = new THREE.SphereGeometry(planet.radius * 1.05, 48, 36);
        const atmoMat = createAtmosphereMaterial('#f4c390', 1.25, 3.2);
        atmosphereMesh = new THREE.Mesh(atmoGeo, atmoMat);
        axialGroup.add(atmosphereMesh);
      }
      // 6. Saturn: Official Cassini Map + Self-Shadowing Ring System
      else if (planet.id === 'saturn') {
        const bodyGeo = new THREE.SphereGeometry(planet.radius, 64, 48);
        const bodyMat = new THREE.MeshStandardMaterial({
          map: this.assets.saturn,
          roughness: 0.45,
          metalness: 0.05,
        });
        bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        axialGroup.add(bodyMesh);

        if (planet.ringsInnerRadius && planet.ringsOuterRadius) {
          const ringGeo = new THREE.RingGeometry(planet.ringsInnerRadius, planet.ringsOuterRadius, 96, 8);
          ringGeo.rotateX(-Math.PI / 2);

          this.saturnRingMaterial = createSaturnRingMaterial(this.assets.saturnRing);
          ringsMesh = new THREE.Mesh(ringGeo, this.saturnRingMaterial);
          axialGroup.add(ringsMesh);
        }

        const atmoGeo = new THREE.SphereGeometry(planet.radius * 1.05, 48, 36);
        const atmoMat = createAtmosphereMaterial('#edd8aa', 1.2, 3.2);
        atmosphereMesh = new THREE.Mesh(atmoGeo, atmoMat);
        axialGroup.add(atmosphereMesh);
      }
      // 7. Uranus: Official Voyager 2 Map + Ring
      else if (planet.id === 'uranus') {
        const bodyGeo = new THREE.SphereGeometry(planet.radius, 64, 48);
        const bodyMat = new THREE.MeshStandardMaterial({
          map: this.assets.uranus,
          roughness: 0.35,
          metalness: 0.05,
        });
        bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        axialGroup.add(bodyMesh);

        if (planet.ringsInnerRadius && planet.ringsOuterRadius) {
          const ringGeo = new THREE.RingGeometry(planet.ringsInnerRadius, planet.ringsOuterRadius, 64, 4);
          ringGeo.rotateX(-Math.PI / 2);
          const ringMat = new THREE.MeshStandardMaterial({
            map: this.assets.uranusRing,
            side: THREE.DoubleSide,
            transparent: true,
            roughness: 0.8,
            metalness: 0.1,
            depthWrite: false,
          });
          ringsMesh = new THREE.Mesh(ringGeo, ringMat);
          axialGroup.add(ringsMesh);
        }

        const atmoGeo = new THREE.SphereGeometry(planet.radius * 1.05, 48, 36);
        const atmoMat = createAtmosphereMaterial('#80e8df', 1.3, 3.2);
        atmosphereMesh = new THREE.Mesh(atmoGeo, atmoMat);
        axialGroup.add(atmosphereMesh);
      }
      // 8. Neptune: Official Voyager 2 Azure Map
      else if (planet.id === 'neptune') {
        const bodyGeo = new THREE.SphereGeometry(planet.radius, 64, 48);
        const bodyMat = new THREE.MeshStandardMaterial({
          map: this.assets.neptune,
          roughness: 0.35,
          metalness: 0.05,
        });
        bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        axialGroup.add(bodyMesh);

        const atmoGeo = new THREE.SphereGeometry(planet.radius * 1.05, 48, 36);
        const atmoMat = createAtmosphereMaterial('#5383d3', 1.4, 3.2);
        atmosphereMesh = new THREE.Mesh(atmoGeo, atmoMat);
        axialGroup.add(atmosphereMesh);
      } else {
        const bodyGeo = new THREE.SphereGeometry(planet.radius, 64, 48);
        bodyMesh = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial());
        axialGroup.add(bodyMesh);
      }

      // Orbital Path Line
      const orbitLineGeo = new THREE.BufferGeometry();
      const orbitPoints: number[] = [];
      const segments = 240;
      for (let s = 0; s <= segments; s++) {
        const theta = (s / segments) * Math.PI * 2;
        orbitPoints.push(Math.cos(theta) * planet.distance, 0, Math.sin(theta) * planet.distance);
      }
      orbitLineGeo.setAttribute('position', new THREE.Float32BufferAttribute(orbitPoints, 3));
      const orbitLine = new THREE.LineLoop(orbitLineGeo, createOrbitLineMaterial(planet.color, 0.32));
      this.scene.add(orbitLine);

      // Hit Proxy for interaction
      const hitRadius = Math.max(planet.radius * 1.5, 3.6);
      const hitGeo = new THREE.SphereGeometry(hitRadius, 16, 12);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitProxy = new THREE.Mesh(hitGeo, hitMat);
      hitProxy.userData = { id: planet.id, config: planet };
      planetGroup.add(hitProxy);
      this.hitMeshes.push(hitProxy);

      orbitGroup.add(planetGroup);
      this.scene.add(orbitGroup);

      const startAngle = (index * (Math.PI * 2 / 8)) + (index * 0.45);
      orbitGroup.rotation.y = startAngle;

      this.planets.set(planet.id, {
        config: planet,
        orbitGroup,
        planetGroup,
        axialGroup,
        bodyMesh,
        atmosphereMesh,
        cloudsMesh,
        ringsMesh,
        moonGroup,
        orbitLine,
        hitProxy,
        currentAngle: startAngle,
      });
    });
  }

  /**
   * Asteroid Belt between Mars and Jupiter (distance 68 - 76)
   */
  private buildAsteroidBelt() {
    const geo = new THREE.DodecahedronGeometry(0.38, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x8c8680,
      roughness: 0.95,
      metalness: 0.08,
    });

    this.asteroidBeltInstanced = new THREE.InstancedMesh(geo, mat, this.asteroidCount);
    this.asteroidBeltInstanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const minR = 68;
    const maxR = 76;

    for (let i = 0; i < this.asteroidCount; i++) {
      const angle = (i / this.asteroidCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.12;
      const radius = minR + Math.random() * (maxR - minR);
      const ySpread = (Math.random() - 0.5) * 3.8;

      this._dummyPos.set(Math.cos(angle) * radius, ySpread, Math.sin(angle) * radius);
      this._dummyQuat.setFromEuler(
        new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
      );
      const s = 0.22 + Math.random() * 0.55;
      this._dummyScale.set(s, s * (0.8 + Math.random() * 0.4), s);

      this._dummyMat.compose(this._dummyPos, this._dummyQuat, this._dummyScale);
      this.asteroidBeltInstanced.setMatrixAt(i, this._dummyMat);
    }

    this.asteroidBeltInstanced.instanceMatrix.needsUpdate = true;
    this.asteroidBeltInstanced.computeBoundingSphere();
    this.scene.add(this.asteroidBeltInstanced);
  }

  /**
   * Twinkling Starfield in Deep Space (3,500 stars)
   */
  private buildStarfield() {
    const starCount = 3500;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    const starPalettes = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#cbe3ff'),
      new THREE.Color('#fff2e0'),
      new THREE.Color('#ffd2b3'),
      new THREE.Color('#8fb3ff'),
    ];

    for (let i = 0; i < starCount; i++) {
      const r = 800 + Math.random() * 1800;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const color = starPalettes[Math.floor(Math.random() * starPalettes.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 2.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      map: createGlowTexture('#ffffff'),
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.starfield = new THREE.Points(geo, starMat);
    this.scene.add(this.starfield);
  }

  private bindEvents() {
    window.addEventListener('resize', this.onResize);
    this.container.addEventListener('pointerdown', this.onPointerDown);
    this.container.addEventListener('pointermove', this.onPointerMove);
  }

  private onResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private onPointerDown = (e: MouseEvent) => {
    if (e.button !== 0) return;

    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.hitMeshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const config: PlanetConfig = hit.userData.config;
      this.focusOnObject(config.id);
    }
  };

  private onPointerMove = (e: MouseEvent) => {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.hitMeshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      this.container.style.cursor = 'pointer';
      this.onHoverPlanetCallback(hit.userData.config, { x: e.clientX, y: e.clientY });
    } else {
      this.container.style.cursor = 'default';
      this.onHoverPlanetCallback(null);
    }
  };

  /**
   * Focus camera smoothly onto planet or Sun
   */
  public focusOnObject(id: string | null) {
    this.selectedPlanetId = id;

    if (!id) {
      this.targetLookAt.set(0, 0, 0);
      this.targetCameraPos.set(0, 110, 210);
      this.isTransitioningCamera = true;
      this.onSelectPlanetCallback(null);
      return;
    }

    if (id === 'sun') {
      this.targetLookAt.set(0, 0, 0);
      this.targetCameraPos.set(0, 15, 42);
      this.isTransitioningCamera = true;
      this.onSelectPlanetCallback(SUN_CONFIG);
      return;
    }

    const planetObj = this.planets.get(id);
    if (!planetObj) return;

    planetObj.planetGroup.getWorldPosition(this._tempVec);
    this.targetLookAt.copy(this._tempVec);

    const offsetDist = Math.max(planetObj.config.radius * 3.8, 9.0);
    this.targetCameraPos.set(
      this._tempVec.x + offsetDist * 0.85,
      this._tempVec.y + offsetDist * 0.4,
      this._tempVec.z + offsetDist * 0.85
    );

    this.isTransitioningCamera = true;
    this.onSelectPlanetCallback(planetObj.config);
  }

  public setViewPreset(preset: 'overview' | 'top' | 'ecliptic' | 'inner' | 'outer') {
    this.selectedPlanetId = null;
    this.onSelectPlanetCallback(null);
    this.isTransitioningCamera = true;

    switch (preset) {
      case 'overview':
        this.targetLookAt.set(0, 0, 0);
        this.targetCameraPos.set(0, 120, 230);
        break;
      case 'top':
        this.targetLookAt.set(0, 0, 0);
        this.targetCameraPos.set(0, 300, 0.1);
        break;
      case 'ecliptic':
        this.targetLookAt.set(0, 0, 0);
        this.targetCameraPos.set(0, 4, 220);
        break;
      case 'inner':
        this.targetLookAt.set(0, 0, 0);
        this.targetCameraPos.set(0, 50, 90);
        break;
      case 'outer':
        this.targetLookAt.set(0, 0, 0);
        this.targetCameraPos.set(0, 200, 350);
        break;
    }
  }

  public setOrbitsVisible(visible: boolean) {
    this.showOrbits = visible;
    this.planets.forEach(p => {
      p.orbitLine.visible = visible;
    });
  }

  public setAtmospheresVisible(visible: boolean) {
    this.showAtmospheres = visible;
    this.planets.forEach(p => {
      if (p.atmosphereMesh) {
        p.atmosphereMesh.visible = visible;
      }
    });
  }

  public setAsteroidBeltVisible(visible: boolean) {
    this.showAsteroidBelt = visible;
    if (this.asteroidBeltInstanced) {
      this.asteroidBeltInstanced.visible = visible;
    }
  }

  public setScaleMode(realistic: boolean) {
    this.realisticScale = realistic;

    PLANETS_CONFIG.forEach(planet => {
      const pObj = this.planets.get(planet.id);
      if (!pObj) return;

      const targetDist = realistic
        ? Math.max(16, planet.realDistanceAU * 18)
        : planet.distance;
      pObj.planetGroup.position.x = targetDist;

      const posAttr = pObj.orbitLine.geometry.attributes.position as THREE.BufferAttribute;
      const segments = 240;
      for (let s = 0; s <= segments; s++) {
        const theta = (s / segments) * Math.PI * 2;
        posAttr.setXYZ(s, Math.cos(theta) * targetDist, 0, Math.sin(theta) * targetDist);
      }
      posAttr.needsUpdate = true;
    });
  }

  /**
   * Main 60fps Animation Loop
   */
  private startLoop() {
    const tick = () => {
      const delta = Math.min(this.clock.getDelta(), 0.1);
      const elapsed = this.clock.getElapsedTime();
      const speedMult = this.isPaused ? 0 : this.timeScale;

      // 1. Sun Axial Rotation
      this.sunGroup.rotation.y += delta * 0.05 * speedMult;

      // 2. Animate Planets (Orbital Revolution & Axial Rotation)
      this.planets.forEach(p => {
        if (speedMult > 0 && p.config.orbitPeriodDays > 0) {
          const orbitSpeed = (2 * Math.PI / (p.config.orbitPeriodDays * 0.08)) * 0.015 * speedMult;
          p.orbitGroup.rotation.y += orbitSpeed * delta;
        }

        if (speedMult > 0 && p.config.rotationPeriodHours !== 0) {
          const rotSpeed = (2 * Math.PI / Math.abs(p.config.rotationPeriodHours)) * 0.4 * speedMult;
          const sign = p.config.rotationPeriodHours > 0 ? 1 : -1;
          p.bodyMesh.rotation.y += rotSpeed * sign * delta;

          if (p.cloudsMesh) {
            p.cloudsMesh.rotation.y += rotSpeed * 1.25 * delta;
          }

          if (p.moonGroup) {
            p.moonGroup.rotation.y += delta * 0.8 * speedMult;
          }
        }
      });

      // 3. Update Earth Realistic Shader (Calculate Sun Direction in view space)
      if (this.earthMaterial) {
        const earthObj = this.planets.get('earth');
        if (earthObj) {
          earthObj.planetGroup.getWorldPosition(this._tempVec);
          this._tempVec2.set(0, 0, 0).sub(this._tempVec).normalize();
          this._tempVec2.transformDirection(this.camera.matrixWorldInverse);
          this.earthMaterial.uniforms.uSunDirection.value.copy(this._tempVec2);

          if (speedMult > 0) {
            this.earthMaterial.uniforms.uCloudsOffset.value = (elapsed * 0.008 * speedMult) % 1.0;
          }
        }
      }

      // 4. Update Saturn Rings Shader (Sun Direction in Saturn local space for globe shadow)
      if (this.saturnRingMaterial) {
        const saturnObj = this.planets.get('saturn');
        if (saturnObj) {
          saturnObj.planetGroup.getWorldPosition(this._tempVec);
          this._tempVec2.set(0, 0, 0).sub(this._tempVec).normalize();
          saturnObj.axialGroup.worldToLocal(this._tempVec2);
          this.saturnRingMaterial.uniforms.uSunDirection.value.copy(this._tempVec2);
        }
      }

      // 5. Slowly rotate Asteroid Belt
      if (this.asteroidBeltInstanced && this.showAsteroidBelt && speedMult > 0) {
        this.asteroidBeltInstanced.rotation.y += delta * 0.02 * speedMult;
      }

      // 6. Camera Tracking or Damped Glide
      if (this.selectedPlanetId) {
        if (this.selectedPlanetId === 'sun') {
          this._tempVec.set(0, 0, 0);
        } else {
          const pObj = this.planets.get(this.selectedPlanetId);
          if (pObj) {
            pObj.planetGroup.getWorldPosition(this._tempVec);
          }
        }

        if (this.isTransitioningCamera) {
          this.controls.target.lerp(this._tempVec, 0.05);
          this.camera.position.lerp(this.targetCameraPos, 0.05);

          if (this.camera.position.distanceTo(this.targetCameraPos) < 0.5) {
            this.isTransitioningCamera = false;
          }
        } else {
          const prevTarget = this.controls.target.clone();
          this.controls.target.copy(this._tempVec);
          const deltaMove = this._tempVec.clone().sub(prevTarget);
          this.camera.position.add(deltaMove);
        }
      } else if (this.isTransitioningCamera) {
        this.controls.target.lerp(this.targetLookAt, 0.06);
        this.camera.position.lerp(this.targetCameraPos, 0.06);

        if (this.camera.position.distanceTo(this.targetCameraPos) < 1.0) {
          this.isTransitioningCamera = false;
        }
      }

      this.controls.update();
      this.renderer.render(this.scene, this.camera);

      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  public dispose() {
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.onResize);
    this.container.removeEventListener('pointerdown', this.onPointerDown);
    this.container.removeEventListener('pointermove', this.onPointerMove);
    this.controls.dispose();
    this.renderer.dispose();
  }
}
