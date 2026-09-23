const noiseGLSL = /* glsl */ `
  float hash31(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }
  float noise3(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(mix(mix(hash31(i), hash31(i+vec3(1,0,0)), f.x),
                   mix(hash31(i+vec3(0,1,0)), hash31(i+vec3(1,1,0)), f.x), f.y),
               mix(mix(hash31(i+vec3(0,0,1)), hash31(i+vec3(1,0,1)), f.x),
                   mix(hash31(i+vec3(0,1,1)), hash31(i+vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) {
    float value = 0.0;
    value += noise3(p) * 0.54;
    value += noise3(p * 2.02 + 19.3) * 0.27;
    value += noise3(p * 4.03 + 43.7) * 0.13;
    value += noise3(p * 8.07 + 71.1) * 0.06;
    return value;
  }
`;

export const planetVertexShader = /* glsl */ `
  varying vec3 vSurface;
  varying vec3 vViewPosition;
  varying vec3 vViewNormal;
  uniform float uSeed;
  uniform float uFamily;
  uniform float uSurfaceScale;
  ${noiseGLSL}
  void main() {
    float terrain = fbm(position * 3.3 * uSurfaceScale + uSeed * 0.001);
    float detail = noise3(position * 13.0 * uSurfaceScale + uSeed * 0.002);
    float relief = (terrain - 0.5) * (uFamily == 3.0 || uFamily == 6.0 ? 0.11 : uFamily == 4.0 || uFamily == 5.0 ? 0.018 : 0.06);
    relief += (detail - 0.5) * 0.009;
    if (uFamily == 0.0) relief = floor(relief * 55.0) / 55.0;
    vec3 displaced = position + normal * relief;
    vec4 view = modelViewMatrix * vec4(displaced, 1.0);
    vSurface = normalize(displaced);
    vViewNormal = normalize(normalMatrix * normal);
    vViewPosition = view.xyz;
    gl_Position = projectionMatrix * view;
  }
`;

export const planetFragmentShader = /* glsl */ `
  varying vec3 vSurface;
  varying vec3 vViewPosition;
  varying vec3 vViewNormal;
  uniform float uSeed;
  uniform float uFamily;
  uniform float uActivity;
  uniform float uArchived;
  uniform float uRadius;
  uniform float uTime;
  uniform float uVisibility;
  uniform float uVariant;
  uniform float uSurfaceScale;
  uniform vec3 uShadow;
  uniform vec3 uMid;
  uniform vec3 uHighlight;
  uniform vec3 uEmission;
  ${noiseGLSL}
  void main() {
    vec3 p = normalize(vSurface);
    vec3 offset = vec3(uSeed * 0.001, uSeed * 0.0007, uSeed * 0.0013);
    float terrain = fbm(p * 3.5 * uSurfaceScale + offset);
    float detail = fbm(p * 11.0 * uSurfaceScale + offset * 1.4);
    float micro = noise3(p * 37.0 * uSurfaceScale + offset);
    vec3 base = vec3(0.18);
    vec3 emission = vec3(0.0);
    float relief = terrain;
    float gloss = 0.12;

    if (uFamily == 0.0) {
      // TypeScript: stepped crystalline plates and fine structural seams.
      float plates = floor(terrain * 7.0) / 7.0;
      vec3 grid = abs(fract(p * 14.0 + detail * 0.13) - 0.5);
      float seam = 1.0 - smoothstep(0.012, 0.038, min(grid.x, min(grid.y, grid.z)));
      base = mix(uShadow, uMid, smoothstep(0.19,0.78,plates));
      base = mix(base,uHighlight,seam*0.7 + smoothstep(0.66,0.85,terrain)*0.25);
      emission = uEmission * seam * 0.55;
      relief = plates * 0.7 + detail * 0.3;
      gloss = 0.54;
    } else if (uFamily == 1.0) {
      // JavaScript: ochre terrain crossed by luminous city circuits.
      float city = pow(1.0 - abs(sin((p.x + p.z) * 37.0 + detail * 4.0)), 28.0);
      city *= smoothstep(0.42, 0.65, terrain);
      base = mix(uShadow,uMid,smoothstep(0.27,0.68,terrain));
      base = mix(base,uHighlight,smoothstep(0.58,0.76,detail)*0.45);
      emission = uEmission * city * 1.05;
      relief = terrain * 0.7 + detail * 0.3;
      gloss = 0.24;
    } else if (uFamily == 2.0) {
      // Python: coastal water, forest canopy and high alpine regions.
      float coast = smoothstep(0.43, 0.55, terrain + (detail-0.5)*0.17);
      float canopy = smoothstep(0.43,0.76,detail);
      vec3 land = mix(uMid,uHighlight,canopy*0.64);
      base = mix(uShadow,land,coast);
      base = mix(base,uHighlight,smoothstep(0.7,0.84,terrain) * coast);
      relief = terrain * 0.75 + detail * coast * 0.25;
      gloss = mix(0.8,0.08,coast);
    } else if (uFamily == 3.0) {
      // Rust: dark iron with discontinuous molten fissures.
      float fissure = pow(1.0 - abs(sin((p.x+p.z)*27.0 + detail*8.0)), 16.0);
      fissure *= smoothstep(0.33,0.58,terrain);
      base = mix(uShadow,uMid,smoothstep(0.3,0.7,terrain));
      base = mix(base,uHighlight,smoothstep(0.69,0.82,detail)*0.4);
      emission = uEmission * fissure * 1.8;
      relief = terrain * 0.68 + detail * 0.32 - fissure * 0.16;
      gloss = 0.2;
    } else if (uFamily == 4.0) {
      // Go: reflective ocean and narrow flowing current bands.
      float current = sin(p.y*33.0 + terrain*14.0 + uTime*0.12);
      float islands = smoothstep(0.71,0.8,terrain);
      base = mix(uShadow,uMid,smoothstep(-0.8,0.9,current));
      base = mix(base,uHighlight,islands*0.82);
      base += uEmission * pow(max(current,0.0),10.0)*0.14;
      relief = detail * 0.3 + islands * terrain;
      gloss = mix(0.9,0.12,islands);
    } else if (uFamily == 5.0) {
      // Java: broad hot industrial belts and raised cooled ridges.
      float bands = sin(p.y*24.0 + terrain*8.0);
      float heat = smoothstep(-0.45,0.65,bands);
      base = mix(uShadow,uMid,heat);
      base = mix(base,uHighlight,smoothstep(0.68,0.82,detail)*0.48);
      emission = uEmission * pow(heat,9.0) * 0.35;
      relief = terrain*0.52 + bands*0.12 + detail*0.36;
      gloss = 0.34;
    } else {
      // Unmapped languages share mineral origins but gain one of five distinct topologies.
      float strata = smoothstep(0.37,0.61,terrain + (detail-0.5)*0.2);
      float crater = 1.0-smoothstep(0.16,0.3,micro);
      float bands = sin(p.y*19.0 + terrain*12.0 + detail*3.0);
      float veins = pow(1.0-abs(sin(p.x*30.0 + p.z*18.0 + detail*14.0)),22.0);
      if (uVariant < 0.5) {
        // Wide ochre mesas and dark impact basins.
        base = mix(uShadow,uMid,strata);
        base = mix(base,uHighlight,smoothstep(0.64,0.82,terrain)*0.73);
        base *= 1.0-crater*0.42;
        relief = terrain*0.77 + detail*0.23-crater*0.18;
        gloss = 0.12;
      } else if (uVariant < 1.5) {
        // Purple quartz plates split by brilliant mineral seams.
        float plate = floor((terrain+detail*0.2)*6.0)/6.0;
        base = mix(uShadow,uMid,smoothstep(0.18,0.72,plate));
        base = mix(base,uHighlight,veins*0.8);
        emission = uEmission*veins*0.55;
        relief = plate*0.75+detail*0.25;
        gloss = 0.46;
      } else if (uVariant < 2.5) {
        // Glacial shelves with cobalt crevasses and bright polar frost.
        float ice = smoothstep(0.4,0.62,terrain);
        float polar = smoothstep(0.45,0.82,abs(p.y)+detail*0.26);
        base = mix(uShadow,uMid,ice);
        base = mix(base,uHighlight,polar*0.88+veins*0.15);
        relief = terrain*0.46+detail*0.54;
        gloss = 0.56;
      } else if (uVariant < 3.5) {
        // Cobalt alloy with layered bright sediment.
        base = mix(uShadow,uMid,smoothstep(-0.63,0.7,bands));
        base = mix(base,uHighlight,smoothstep(0.61,0.79,detail)*0.55);
        emission = uEmission*veins*uActivity*0.3;
        relief = bands*0.18+terrain*0.57+detail*0.25;
        gloss = 0.32;
      } else {
        // Rose iron continents and porous pale ridges.
        float high = smoothstep(0.36,0.59,terrain+(detail-0.5)*0.3);
        base = mix(uShadow,uMid,high);
        base = mix(base,uHighlight,smoothstep(0.59,0.73,terrain)*0.64);
        base *= 1.0-crater*0.24;
        relief = terrain*0.63+detail*0.37-crater*0.13;
        gloss = 0.2;
      }
    }

    if (uArchived > 0.5) {
      float luminance = dot(base,vec3(0.299,0.587,0.114));
      base = mix(base,vec3(luminance)*vec3(0.68,0.78,0.93),0.82)*0.58;
      emission *= 0.06;
      gloss *= 0.45;
    }

    // Derivative-based bump shading keeps the silhouette smooth and the surface tactile.
    vec3 normal = normalize(vViewNormal);
    vec3 dx = dFdx(vViewPosition);
    vec3 dy = dFdy(vViewPosition);
    vec3 r1 = cross(dy,normal);
    vec3 r2 = cross(normal,dx);
    float determinant = dot(dx,r1);
    vec3 gradient = (r1*dFdx(relief) + r2*dFdy(relief)) / max(abs(determinant),0.0001);
    normal = normalize(normal - gradient*sign(determinant)*uRadius*0.055);

    vec3 light = normalize(vec3(-0.57,0.69,0.9));
    vec3 view = normalize(-vViewPosition);
    float diffuse = max(dot(normal,light),0.0);
    float highlight = pow(max(dot(reflect(-light,normal),view),0.0),mix(16.0,110.0,gloss));
    float rim = pow(1.0-max(dot(normal,view),0.0),3.0);
    vec3 color = base * (vec3(0.15,0.18,0.23) + vec3(1.1,1.01,0.9)*diffuse);
    color += vec3(0.62,0.82,0.97) * highlight * gloss * 0.62;
    color += base * rim * 0.15;
    float energyPulse = 0.72 + 0.28 * sin(uTime * (0.9 + uActivity * 2.4) + terrain * 15.0);
    float energyCurrent = pow(max(sin((p.y + terrain * 0.16) * 31.0 - uTime * (0.8 + uActivity * 1.7)), 0.0), 14.0);
    energyCurrent *= smoothstep(0.36, 0.68, detail) * uActivity * (1.0 - uArchived);
    color += emission * (0.38 + uActivity * 0.82 * energyPulse + energyCurrent * 0.34);
    color *= mix(0.11,1.0,uVisibility);
    gl_FragColor = vec4(color,1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const atmosphereVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-viewPos.xyz);
    gl_Position = projectionMatrix * viewPos;
  }
`;

export const atmosphereFragmentShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uTime;
  uniform float uActivity;
  uniform float uVisibility;
  void main() {
    float edge = pow(1.0-max(dot(normalize(vNormal),normalize(vView)),0.0),3.2);
    float daylight = 0.38 + max(dot(normalize(vNormal),normalize(vec3(-0.57,0.69,0.9))),0.0)*0.62;
    float pulse = 0.92 + sin(uTime * (0.65 + uActivity * 2.2)) * (0.015 + uActivity * 0.16);
    pulse += pow(max(sin(vNormal.y * 23.0 - uTime * (0.8 + uActivity * 1.5)), 0.0), 14.0) * uActivity * 0.12;
    gl_FragColor = vec4(uColor,edge*uIntensity*daylight*pulse*uVisibility*0.75);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const moonVertexShader = /* glsl */ `
  varying vec3 vSurface;
  varying vec3 vNormal;
  varying vec3 vToStar;
  varying vec3 vToView;
  varying vec3 vTint;
  void main() {
    vec4 worldPosition = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vSurface = position;
    vNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
    vToStar = normalize(-worldPosition.xyz);
    vToView = normalize(cameraPosition - worldPosition.xyz);
    vTint = instanceColor;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const moonFragmentShader = /* glsl */ `
  varying vec3 vSurface;
  varying vec3 vNormal;
  varying vec3 vToStar;
  varying vec3 vToView;
  varying vec3 vTint;
  uniform float uSeed;
  uniform float uOpacity;
  ${noiseGLSL}
  void main() {
    vec3 p = normalize(vSurface);
    vec3 offset = vec3(uSeed * 0.001, uSeed * 0.0017, uSeed * 0.0006);
    float stone = fbm(p * 6.0 + offset);
    float grain = noise3(p * 25.0 + offset * 1.6);
    float pits = 1.0 - smoothstep(0.12, 0.24, abs(noise3(p * 13.0 + offset * 1.2) - 0.49));
    vec3 mineral = mix(vTint * 0.44, vTint * 1.48, smoothstep(0.24, 0.76, stone));
    mineral *= 0.84 + grain * 0.25 - pits * 0.2;
    float lit = max(dot(normalize(vNormal), normalize(vToStar)), 0.0);
    float rim = pow(1.0 - max(dot(normalize(vNormal), normalize(vToView)), 0.0), 2.0);
    vec3 color = mineral * (0.36 + lit * 0.95) + vTint * rim * 0.04;
    gl_FragColor = vec4(color, uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const activityLightVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;

export const activityLightFragmentShader = /* glsl */ `
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() {
    float radius = length(vUv * 2.0 - 1.0);
    float core = 1.0 - smoothstep(0.04, 0.28, radius);
    float halo = pow(1.0 - smoothstep(0.16, 1.0, radius), 2.0) * 0.24;
    float alpha = (core + halo) * uOpacity;
    if (alpha < 0.008) discard;
    gl_FragColor = vec4(uColor * (0.82 + core * 0.42), alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const ringVertexShader = /* glsl */ `
  varying float vRadius;
  varying float vAngle;
  void main() {
    vRadius = length(position.xy);
    vAngle = atan(position.y,position.x);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
  }
`;

export const ringFragmentShader = /* glsl */ `
  varying float vRadius;
  varying float vAngle;
  uniform float uInner;
  uniform float uOuter;
  uniform float uSeed;
  uniform float uOpacity;
  uniform float uVisibility;
  uniform vec3 uColor;
  uniform vec3 uAccent;
  ${noiseGLSL}
  void main() {
    float radial = clamp((vRadius-uInner)/(uOuter-uInner),0.0,1.0);
    float dust = noise3(vec3(radial*28.0,cos(vAngle)*2.0+uSeed,sin(vAngle)*2.0));
    float band = sin(radial*115.0+uSeed*4.0+dust*2.5);
    float fine = sin(radial*390.0+uSeed*1.7);
    float broad = sin(radial*21.0+uSeed*2.0);
    float lane = smoothstep(-0.72,0.42,broad)*0.44+smoothstep(-0.75,0.5,band)*0.4+smoothstep(-0.7,0.6,fine)*0.16;
    float gap = 1.0-smoothstep(0.55,0.83,sin(radial*46.0+uSeed*3.0))*0.9;
    float edge = smoothstep(0.0,0.055,radial)*(1.0-smoothstep(0.94,1.0,radial));
    float alpha = edge*lane*gap*uOpacity*uVisibility;
    if (alpha < 0.012) discard;
    vec3 color = mix(uColor,uAccent,smoothstep(0.1,0.9,radial)*0.55+dust*0.14);
    color *= 0.72+lane*0.5;
    gl_FragColor = vec4(color,alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
