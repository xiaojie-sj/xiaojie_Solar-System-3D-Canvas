import * as THREE from 'three';

/**
 * Procedural Dynamic Animated Sun Surface Shader:
 * Convective granulation cells, turbulent boiling plasma, solar flares.
 */
export function createSunSurfaceMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColorHot: { value: new THREE.Color('#fff7cc') }, // White-hot convective centers
      uColorMid: { value: new THREE.Color('#ff8800') }, // Fiery orange mid-temp
      uColorCool: { value: new THREE.Color('#b31b00') }, // Darker intergranular lanes
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColorHot;
      uniform vec3 uColorMid;
      uniform vec3 uColorCool;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;

      // GLSL Simplex Noise 3D
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0))
                  + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                  + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      void main() {
        // Multi-octave convective plasma
        vec3 p = normalize(vPosition) * 4.5;
        float speed = uTime * 0.18;
        
        float n1 = snoise(p + vec3(0.0, speed, 0.0));
        float n2 = snoise(p * 2.2 - vec3(speed * 0.7, 0.0, speed * 0.4)) * 0.5;
        float n3 = snoise(p * 4.4 + vec3(0.0, speed * 1.2, 0.0)) * 0.25;
        
        float plasma = (n1 + n2 + n3 + 1.75) * 0.35;
        plasma = clamp(plasma, 0.0, 1.0);

        // Limb darkening (edges of the sun appear slightly cooler and deeper orange)
        vec3 viewDir = normalize(cameraPosition - vPosition);
        float limb = dot(vNormal, viewDir);
        limb = clamp(limb, 0.1, 1.0);
        float limbFactor = pow(limb, 0.55);

        // Dynamic color mixing
        vec3 color = mix(uColorCool, uColorMid, smoothstep(0.15, 0.65, plasma));
        color = mix(color, uColorHot, smoothstep(0.65, 0.95, plasma));

        // Apply limb darkening and boost center radiance
        color *= (0.7 + 0.45 * limbFactor);

        gl_FragColor = vec4(color, 1.0);
      }
    `,
    side: THREE.FrontSide,
  });
}

/**
 * Advanced Earth Day/Night/Atmosphere/Specular Shader:
 * Sunlit day map + nighttime illuminated city lights + ocean specular reflection + clouds + sunset terminator.
 */
export function createEarthRealisticMaterial(
  dayMap: THREE.Texture,
  nightMap: THREE.Texture,
  cloudsMap: THREE.Texture,
  specularMap: THREE.Texture
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uDayMap: { value: dayMap },
      uNightMap: { value: nightMap },
      uCloudsMap: { value: cloudsMap },
      uSpecularMap: { value: specularMap },
      uSunDirection: { value: new THREE.Vector3(1, 0, 0) }, // Earth-to-Sun vector in local space
      uCloudsOffset: { value: 0 },
      uAtmosphereColor: { value: new THREE.Color('#3da5ff') },
      uSunsetGlowColor: { value: new THREE.Color('#ff7338') },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uDayMap;
      uniform sampler2D uNightMap;
      uniform sampler2D uCloudsMap;
      uniform sampler2D uSpecularMap;
      uniform vec3 uSunDirection;
      uniform float uCloudsOffset;
      uniform vec3 uAtmosphereColor;
      uniform vec3 uSunsetGlowColor;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);

        // Sun dot product gives day/night factor
        // uSunDirection passed in is normalized sun direction in view space
        float sunDot = dot(normal, uSunDirection);

        // Sample textures
        vec3 dayColor = texture2D(uDayMap, vUv).rgb;
        vec3 nightColor = texture2D(uNightMap, vUv).rgb;
        
        // Clouds with horizontal drift
        vec2 cloudUv = vec2(fract(vUv.x + uCloudsOffset), vUv.y);
        vec4 cloudTex = texture2D(uCloudsMap, cloudUv);
        float cloudDensity = cloudTex.a * 0.95;

        // Specular ocean mask
        float specMask = texture2D(uSpecularMap, vUv).r;

        // Specular sun reflection on water (Blinn-Phong)
        vec3 halfDir = normalize(uSunDirection + viewDir);
        float specAngle = max(dot(normal, halfDir), 0.0);
        float specular = pow(specAngle, 45.0) * specMask * (1.0 - cloudDensity * 0.8);
        vec3 sunGlint = vec3(1.0, 0.95, 0.85) * specular * 1.8 * max(sunDot, 0.0);

        // Day lighting with soft terminator transition (-0.15 to 0.25)
        float dayFactor = smoothstep(-0.10, 0.20, sunDot);

        // Sunset rim at terminator (warm orange twilight)
        float terminator = exp(-pow((sunDot - 0.05) * 6.5, 2.0));
        vec3 sunsetGlow = uSunsetGlowColor * terminator * 0.55;

        // Composite Day terrain + Sun Glint + Clouds (casting soft shadow on day)
        vec3 dayWithClouds = mix(dayColor + sunGlint, cloudTex.rgb * 1.1, cloudDensity);
        
        // Night side: dark terrain + illuminated city lights (dimmed under clouds)
        vec3 nightWithCities = nightColor * (1.0 - cloudDensity * 0.6) * 1.35;

        // Blend Day and Night
        vec3 finalTerrain = mix(nightWithCities, dayWithClouds + sunsetGlow, dayFactor);

        // Atmospheric Rayleigh limb scatter
        float fresnel = 1.0 - max(dot(normal, viewDir), 0.0);
        float atmosphereHaze = pow(fresnel, 3.2) * 0.85 * max(sunDot + 0.35, 0.1);
        finalTerrain += uAtmosphereColor * atmosphereHaze;

        gl_FragColor = vec4(finalTerrain, 1.0);
      }
    `,
  });
}

/**
 * Saturn Rings Shader with Saturn Globe Self-Shadowing:
 * Rings cast shadows, and Saturn globe casts an authentic shadow onto the rings!
 */
export function createSaturnRingMaterial(ringTexture: THREE.Texture): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uRingMap: { value: ringTexture },
      uSunDirection: { value: new THREE.Vector3(1, 0, 0) }, // in planet local space
      uSaturnRadius: { value: 5.8 },
      uRingInnerRadius: { value: 7.2 },
      uRingOuterRadius: { value: 13.5 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vLocalPos;
      varying vec3 vNormal;

      void main() {
        vUv = uv;
        vLocalPos = position;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uRingMap;
      uniform vec3 uSunDirection;
      uniform float uSaturnRadius;
      uniform float uRingInnerRadius;
      uniform float uRingOuterRadius;

      varying vec2 vUv;
      varying vec3 vLocalPos;
      varying vec3 vNormal;

      void main() {
        // Sample radial ring strip along UV
        // UV.x maps from inner radius to outer radius
        float r = length(vLocalPos.xz);
        float t = (r - uRingInnerRadius) / (uRingOuterRadius - uRingInnerRadius);
        vec4 texColor = texture2D(uRingMap, vec2(clamp(t, 0.0, 1.0), 0.5));

        if (texColor.a < 0.02) discard;

        // Shadow of Saturn globe onto rings:
        // Ray from ring point towards the Sun: does it intersect Saturn's central sphere?
        vec3 sunDir = normalize(uSunDirection);
        // Project ring position along -sunDir
        float dotSun = dot(vLocalPos, -sunDir);
        float inShadow = 0.0;
        if (dotSun > 0.0) { // Point is on the night side of Saturn
          // Distance from ray to Saturn center (origin)
          vec3 closestPoint = vLocalPos - sunDir * dot(vLocalPos, sunDir);
          float distToCenter = length(closestPoint);
          if (distToCenter < uSaturnRadius * 1.02) {
            inShadow = 1.0;
          }
        }

        // Lighting: diffuse lighting on ring particles + shadow factor
        float shadowFactor = 1.0 - inShadow * 0.92;
        vec3 litColor = texColor.rgb * shadowFactor;

        gl_FragColor = vec4(litColor, texColor.a);
      }
    `,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
  });
}

/**
 * Atmospheric Rim / Fresnel Glow Shader
 */
export function createAtmosphereMaterial(colorHex: string, intensity: number = 1.4, power: number = 3.2): THREE.ShaderMaterial {
  const color = new THREE.Color(colorHex);

  return new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: color },
      intensity: { value: intensity },
      power: { value: power },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      uniform float intensity;
      uniform float power;
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        vec3 viewDir = normalize(-vPosition);
        float vDotN = dot(viewDir, vNormal);
        float fresnel = clamp(1.0 - vDotN, 0.0, 1.0);
        float glow = pow(fresnel, power) * intensity;

        gl_FragColor = vec4(glowColor, glow);
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
    transparent: true,
    depthWrite: false,
  });
}

/**
 * Sun Corona Shader
 */
export function createSunCoronaMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      colorInner: { value: new THREE.Color('#ffe066') },
      colorOuter: { value: new THREE.Color('#ff3c00') },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 colorInner;
      uniform vec3 colorOuter;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;

      void main() {
        vec3 viewDir = normalize(-vPosition);
        float edge = clamp(1.0 - dot(viewDir, vNormal), 0.0, 1.0);

        // Dynamic solar pulse waves
        float pulse1 = sin(uTime * 2.2 + vUv.x * 24.0 + vUv.y * 18.0) * 0.15;
        float pulse2 = cos(uTime * 3.0 - vUv.y * 30.0) * 0.12;
        float wave = pulse1 + pulse2;

        float alpha = pow(edge, 1.8 + wave) * 1.5;
        vec3 col = mix(colorInner, colorOuter, pow(edge, 1.1));

        gl_FragColor = vec4(col, alpha);
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
  });
}

/**
 * Glowing Orbital Path Line Material
 */
export function createOrbitLineMaterial(colorHex: string = '#4d88ff', opacity: number = 0.32): THREE.LineBasicMaterial {
  return new THREE.LineBasicMaterial({
    color: new THREE.Color(colorHex),
    transparent: true,
    opacity: opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}
