// three.js sahnesi: yalnızca 3B vatoz sayfasında, tembel (dynamic import) yüklenir.
import {
  ACESFilmicToneMapping, AmbientLight, BufferAttribute, BufferGeometry, CanvasTexture, Color, DirectionalLight, DoubleSide,
  Float32BufferAttribute, Group, HemisphereLight, Material, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, PerspectiveCamera,
  PMREMGenerator, Quaternion, Raycaster, Scene, SRGBColorSpace, SphereGeometry, Vector3, WebGLRenderer, Box3, Texture, Sphere, CatmullRomCurve3, TubeGeometry,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  SPINE, SPINE_U, SWIM, clasper, discPoint, discRho, discWaveY, eyeSpec, gillSlits, mouthLine, naresRing, nasalCurtain, pelvicSpec,
  spineProfile, spineSpec, spiracleRing, spiracleSpec, surfaceY, tailPoint, tailRadii, tailSwayZ, texUV, type Face, type Sex, type Vec3,
} from './model';
import { partAnchors, partsFor, type Anchor, type PartId, type ViewId } from './parts';
import { paintBody } from './texture';
import { hexToRgb, tailColor, variantById, mixRgb } from './variants';

// ------------------------------------------------------------------ yüzme gölgelendirici eki

interface SwimUniforms { uTime: { value: number }; uAmp: { value: number } }

const SWIM_PARS = `
uniform float uTime; uniform float uAmp;
attribute vec2 aSwim;`;
const SWIM_VERT = `
#include <begin_vertex>
float swW = pow(clamp(aSwim.x, 0.0, 1.0), ${SWIM.power.toFixed(2)});
transformed.y += uAmp * swW * sin(transformed.x * ${SWIM.wavenumber.toFixed(2)} - uTime * ${SWIM.speed.toFixed(2)});
transformed.z += uAmp * ${SWIM.tailAmp.toFixed(2)} * aSwim.y * aSwim.y * sin(uTime * ${(SWIM.speed * 0.9).toFixed(3)} - aSwim.y * 3.2);`;

function swimify<M extends Material>(m: M, u: SwimUniforms): M {
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = u.uTime;
    shader.uniforms.uAmp = u.uAmp;
    shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>\n${SWIM_PARS}`).replace('#include <begin_vertex>', SWIM_VERT);
  };
  m.customProgramCacheKey = () => 'vatoz-swim';
  return m;
}

// ------------------------------------------------------------------ geometri yardımcıları

/** Köşe başına dalga özniteliği: rho (disk dalgası ağırlığı) ve u (kuyruk sallanması) */
function swimAttr(g: BufferGeometry, fn: (x: number, y: number, z: number) => [number, number]): BufferGeometry {
  const p = g.getAttribute('position');
  const a = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { const [r, u] = fn(p.getX(i), p.getY(i), p.getZ(i)); a[i * 2] = r; a[i * 2 + 1] = u; }
  g.setAttribute('aSwim', new BufferAttribute(a, 2));
  return g;
}
const onDiscSwim = (sex: Sex) => (x: number, _y: number, z: number): [number, number] => [Math.min(1, discRho(sex, x, z)), 0];

const lin = (c: [number, number, number]): [number, number, number] => c.map((x) => Math.pow(x, 2.2)) as [number, number, number];
const ringRho = (i: number, nr: number) => 1 - Math.pow(1 - i / nr, 1.6);

interface DiscMeshData { geo: BufferGeometry; base: Float32Array; rho: Float32Array }

function discGeometry(sex: Sex, face: Face, NR = 44, NS = 120): DiscMeshData {
  const pos: number[] = [], uv: number[] = [], rho: number[] = [], idx: number[] = [];
  for (let i = 0; i <= NR; i++) {
    const r = ringRho(i, NR);
    for (let j = 0; j <= NS; j++) {
      const [x, z] = discPoint(sex, r, (j / NS) * Math.PI * 2);
      const y = i === NR ? 0 : surfaceY(sex, face, x, z);
      pos.push(x, y, z);
      uv.push(...texUV(x, z));
      rho.push(r);
    }
  }
  for (let i = 0; i < NR; i++) {
    for (let j = 0; j < NS; j++) {
      const a = i * (NS + 1) + j, b = a + 1, c = a + NS + 1, d = c + 1;
      if (face === 'ust') idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const n = g.getAttribute('normal') as BufferAttribute;
  // dikiş ve kutup düzeltmesi
  for (let i = 0; i <= NR; i++) {
    const a = i * (NS + 1), b = a + NS;
    const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b);
    const l = Math.hypot(x, y, z) || 1;
    n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l);
  }
  for (let j = 0; j <= NS; j++) n.setXYZ(j, 0, face === 'ust' ? 1 : -1, 0);
  g.setAttribute('aSwim', new BufferAttribute(Float32Array.from(rho.flatMap((r) => [r, 0])), 2));
  return { geo: g, base: Float32Array.from(pos), rho: Float32Array.from(rho) };
}

function tubeFrom(points: Vec3[], radius: number, segs = 24, closed = false): BufferGeometry {
  const curve = new CatmullRomCurve3(points.map((p) => new Vector3(...p)), closed);
  return new TubeGeometry(curve, segs, radius, 6, closed);
}

function taperedTube(points: Vec3[], radii: number[], radial = 12, samples = 30): BufferGeometry {
  const curve = new CatmullRomCurve3(points.map((p) => new Vector3(...p)));
  const frames = curve.computeFrenetFrames(samples, false);
  const pos: number[] = [], idx: number[] = [];
  const rAt = (u: number) => { const f = u * (radii.length - 1); const i = Math.min(radii.length - 2, Math.floor(f)); return radii[i] + (radii[i + 1] - radii[i]) * (f - i); };
  for (let i = 0; i <= samples; i++) {
    const u = i / samples, c = curve.getPointAt(u), r = rAt(u) * (i === samples ? 0.4 : 1);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const n = frames.normals[i].clone().multiplyScalar(Math.cos(a)).add(frames.binormals[i].clone().multiplyScalar(Math.sin(a)));
      pos.push(c.x + n.x * r, c.y + n.y * r, c.z + n.z * r);
    }
  }
  for (let i = 0; i < samples; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = a + radial + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Kuyruk: dibi geniş-yassı, ucu ince; köşe rengi variant'tan */
function tailGeometry(sex: Sex, variantId: string): BufferGeometry {
  const v = variantById(variantId);
  const NU = 56, NA = 16;
  const pos: number[] = [], col: number[] = [], sw: number[] = [], idx: number[] = [];
  for (let i = 0; i <= NU; i++) {
    const u = i / NU, c = tailPoint(sex, u), r = tailRadii(u);
    const k = i === NU ? 0.3 : 1;
    const color = tailColor(v, u);
    for (let j = 0; j <= NA; j++) {
      const a = (j / NA) * Math.PI * 2;
      pos.push(c[0], c[1] + Math.cos(a) * r.ry * k, c[2] + Math.sin(a) * r.rz * k);
      // alt yüz açık (karın rengi), üst yüz variant rengi
      const belly = Math.max(0, -Math.cos(a)) * 0.55;
      const cc = mixRgb(color, hexToRgb(v.karin.orta), belly * (1 - u * 0.5));
      col.push(...lin(cc));
      sw.push(Math.max(0, 0.9 * (1 - 2 * u)), u);
    }
  }
  for (let i = 0; i < NU; i++) for (let j = 0; j < NA; j++) { const a = i * (NA + 1) + j, b = a + NA + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new Float32BufferAttribute(col, 3));
  g.setAttribute('aSwim', new Float32BufferAttribute(sw, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function spineGeometry(sex: Sex): BufferGeometry {
  const sp = spineSpec(sex), prof = spineProfile();
  const nx = -sp.dir[1], ny = sp.dir[0];
  const pos: number[] = [], idx: number[] = [];
  for (const { s, w } of prof) {
    const cx = sp.base[0] + sp.dir[0] * sp.length * s, cy = sp.base[1] + sp.dir[1] * sp.length * s, cz = sp.base[2];
    const t = SPINE.thickness * (1 - s * 0.6);
    pos.push(cx, cy, cz + t, cx, cy, cz - t, cx + nx * w, cy + ny * w, cz, cx - nx * w, cy - ny * w, cz);
  }
  for (let i = 0; i < prof.length - 1; i++) {
    const a = i * 4, b = a + 4;
    // [mid+, mid-, up, low]
    for (const [p, q] of [[0, 2], [0, 3], [1, 2], [1, 3]]) idx.push(a + p, a + q, b + p, a + q, b + q, b + p);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return swimAttr(g, () => [Math.max(0, 0.9 * (1 - 2 * SPINE_U)), SPINE_U]);
}

function lobeGeometry(sex: Sex, side: 1 | -1, upper: boolean, edgeCol: [number, number, number], midCol: [number, number, number]): BufferGeometry {
  const s = pelvicSpec(sex, side);
  const NR = 6, NS = 32;
  const pos: number[] = [], col: number[] = [], idx: number[] = [];
  for (let i = 0; i <= NR; i++) {
    const r = i / NR;
    for (let j = 0; j <= NS; j++) {
      const a = (j / NS) * Math.PI * 2;
      const ex = Math.cos(a) * s.rx * r, ez = Math.sin(a) * s.rz * r;
      const x = s.cx + ex * Math.cos(s.rot) - ez * Math.sin(s.rot), z = s.cz + ex * Math.sin(s.rot) + ez * Math.cos(s.rot);
      const y = -0.017 - 0.012 * r * r + (upper ? 0.004 : -0.004) * (1 - r * r) + (upper ? 0.0035 : 0);
      pos.push(x, y, z);
      col.push(...lin(mixRgb(midCol, edgeCol, Math.pow(r, 3))));
    }
  }
  for (let i = 0; i < NR; i++) for (let j = 0; j < NS; j++) {
    const a = i * (NS + 1) + j, b = a + 1, c = a + NS + 1, d = c + 1;
    if (upper) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return swimAttr(g, (x, _y, z) => [Math.min(1, Math.max(0.6, discRho(sex, x, z))), 0]);
}

// ------------------------------------------------------------------ vatozu kur

interface Built {
  group: Group;
  anchors: Partial<Record<PartId, Anchor>>;
  textures: Texture[];
  bounds: Sphere;
  center: Vector3;
  proxy: Mesh[];
  proxyData: { geo: BufferGeometry; base: Float32Array; rho: Float32Array }[];
}

export function buildRay(sex: Sex, variantId: string, u: SwimUniforms, texW: number): Built {
  const variant = variantById(variantId);
  const group = new Group();
  const textures: Texture[] = [];
  const add = (geo: BufferGeometry, mat: Material) => { const m = new Mesh(geo, mat); group.add(m); return m; };
  const std = (color: string | Color | number, rough = 0.6, extra: Record<string, unknown> = {}) => swimify(new MeshStandardMaterial({ color: new Color(color as string), roughness: rough, ...extra }), u);
  const shine = variant.parlak ?? 0;

  // ---- disk
  const tex = paintBody(variant, sex, texW);
  const mk = (c: HTMLCanvasElement, srgb: boolean) => { const t = new CanvasTexture(c); if (srgb) t.colorSpace = SRGBColorSpace; t.anisotropy = 4; t.flipY = false; textures.push(t); return t; };
  const bump = mk(tex.bump, false);
  const skin = (map: Texture) => swimify(new MeshPhysicalMaterial({
    map, bumpMap: bump, bumpScale: 0.8, roughness: 0.62 - 0.2 * shine, metalness: 0, clearcoat: 0.18 + 0.2 * shine, clearcoatRoughness: 0.45,
    sheen: 0.3, sheenColor: new Color('#d8e4ea'), sheenRoughness: 0.6, envMapIntensity: 0.5, side: DoubleSide,
  }), u);
  const top = discGeometry(sex, 'ust'), bot = discGeometry(sex, 'alt');
  add(top.geo, skin(mk(tex.dorsal, true)));
  add(bot.geo, skin(mk(tex.ventral, true)));

  // ---- koyu kenar çizgisi yok; kenar iki yüzün birleşmesiyle oluşur.

  // ---- gözler (üstte)
  const eyeMat = {
    ball: std(new Color(variant.goz.halka).multiplyScalar(0.6), 0.4),
    iris: swimify(new MeshStandardMaterial({ color: new Color(variant.goz.iris), roughness: 0.28, metalness: 0.5, polygonOffset: true, polygonOffsetFactor: -1 }), u),
    pupil: swimify(new MeshStandardMaterial({ color: new Color(variant.goz.pupil), roughness: 0.15, polygonOffset: true, polygonOffsetFactor: -2 }), u),
    mound: swimify(new MeshStandardMaterial({ color: new Color(variant.sirt.merkez), roughness: 0.65 }), u),
  };
  for (const side of [1, -1] as const) {
    const eye = eyeSpec(sex, side);
    const R = eye.radius;
    const q = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), new Vector3(...eye.normal));
    const part = (geo: BufferGeometry, mat: Material, scale = 1) => {
      geo.rotateX(Math.PI / 2); geo.scale(scale, scale, scale); geo.applyQuaternion(q); geo.translate(...eye.center);
      add(swimAttr(geo, onDiscSwim(sex)), mat);
    };
    // göz çukuru çevresi: deri yükseltisi
    const mound = new SphereGeometry(R * 1.45, 24, 12);
    mound.scale(1, 0.55, 1);
    mound.translate(eye.center[0], eye.center[1] - R * 0.55, eye.center[2]);
    add(swimAttr(mound, onDiscSwim(sex)), eyeMat.mound);
    part(new SphereGeometry(R, 28, 18), eyeMat.ball);
    part(new SphereGeometry(R, 28, 10, 0, Math.PI * 2, 0, 0.95), eyeMat.iris, 1.01);
    part(new SphereGeometry(R, 28, 8, 0, Math.PI * 2, 0, 0.5), eyeMat.pupil, 1.02);
  }

  // ---- spirakül
  const dark = new Color(variant.sirt.merkez).multiplyScalar(0.22);
  for (const side of [1, -1] as const) {
    const ring = spiracleRing(sex, side, 28, 1);
    add(swimAttr(tubeFrom(ring, 0.0085, 40, true), onDiscSwim(sex)), std(new Color(variant.sirt.kenar).multiplyScalar(0.8), 0.6));
    const sc = spiracleSpec(sex, side);
    const inner = spiracleRing(sex, side, 28, 0.82);
    const pos: number[] = [...sc.center], idx: number[] = [];
    pos[1] += 0.004;
    inner.forEach((p) => pos.push(p[0], p[1] - 0.001, p[2]));
    for (let i = 0; i < 28; i++) { const a = 1 + i, b = 1 + ((i + 1) % 28); idx.push(0, side > 0 ? b : a, side > 0 ? a : b); }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const m = add(swimAttr(g, onDiscSwim(sex)), swimify(new MeshStandardMaterial({ color: dark, roughness: 0.8, side: DoubleSide }), u));
    m.renderOrder = 1;
  }

  // ---- alt yüz ayrıntıları
  const lineDark = new Color(variant.karin.kenar).multiplyScalar(0.18);
  add(swimAttr(tubeFrom(mouthLine(sex), 0.015, 30), onDiscSwim(sex)), std(lineDark, 0.6));
  for (const side of [1, -1] as const) {
    add(swimAttr(tubeFrom(naresRing(sex, side), 0.009, 24, true), onDiscSwim(sex)), std(lineDark, 0.6));
    for (const slit of gillSlits(sex, side)) add(swimAttr(tubeFrom(slit, 0.0095, 12), onDiscSwim(sex)), std(lineDark, 0.6));
  }
  add(swimAttr(tubeFrom(nasalCurtain(sex), 0.0085, 16), onDiscSwim(sex)), std(new Color(variant.karin.kenar).multiplyScalar(0.85), 0.55));

  // ---- pelvik yüzgeçler
  const dc = hexToRgb(variant.sirt.kenar), vc = hexToRgb(variant.karin.orta), ve = hexToRgb(variant.karin.kenar);
  const lobeMat = () => swimify(new MeshStandardMaterial({ vertexColors: true, roughness: 0.65, side: DoubleSide }), u);
  for (const side of [1, -1] as const) {
    add(lobeGeometry(sex, side, true, dc, mixRgb(dc, hexToRgb(variant.sirt.merkez), 0.5)), lobeMat());
    add(lobeGeometry(sex, side, false, mixRgb(ve, dc, 0.5), vc), lobeMat());
    const c = clasper(sex, side);
    if (c) {
      const col = mixRgb(vc, hexToRgb('#a8725f'), 0.65);
      const m = add(swimAttr(taperedTube(c.path, c.radii, 12, 20), () => [1, 0]), std(new Color(...col), 0.55));
      m.renderOrder = 2;
    }
  }

  // ---- kuyruk ve diken
  add(tailGeometry(sex, variantId), swimify(new MeshStandardMaterial({ vertexColors: true, roughness: 0.6 }), u));
  add(spineGeometry(sex), swimify(new MeshStandardMaterial({ color: new Color(variant.diken).multiplyScalar(0.72), roughness: 0.4, metalness: 0.05, side: DoubleSide, emissive: new Color('#3a1a10'), emissiveIntensity: 0.3 }), u));

  // ---- görünürlük sınaması için kaba vekil yüzeyler (görüntülenmez)
  const proxy: Mesh[] = [], proxyData: Built['proxyData'] = [];
  for (const face of ['ust', 'alt'] as const) {
    const d = discGeometry(sex, face, 22, 60);
    d.geo.computeBoundingSphere();
    const m = new Mesh(d.geo, new MeshStandardMaterial({ side: DoubleSide }));
    proxy.push(m); proxyData.push(d);
  }

  const box = new Box3().setFromObject(group);
  const bounds = new Sphere();
  box.getBoundingSphere(bounds);
  return { group, anchors: partAnchors(sex), textures, bounds, center: box.getCenter(new Vector3()), proxy, proxyData };
}

function disposeGroup(g: Group, textures: Texture[], proxy: Mesh[]) {
  g.traverse((o) => {
    const m = o as Mesh;
    if (m.geometry) m.geometry.dispose();
    const mat = m.material as Material | Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose()); else mat?.dispose();
  });
  proxy.forEach((p) => { p.geometry.dispose(); (p.material as Material).dispose(); });
  textures.forEach((t) => t.dispose());
}

// ------------------------------------------------------------------ görüntüleyici

// Kamera açıları [yatay (theta), düşey (phi)]. Üst ve alt görünümlerde burun yukarıda durur.
const VIEW_ANGLES: Record<ViewId, [number, number]> = {
  yan: [0, Math.PI / 2 - 0.05],
  capraz: [-0.8, 0.95],
  ust: [Math.PI / 2, 0.03],
  alt: [-Math.PI / 2, Math.PI - 0.03],
  on: [-Math.PI / 2, Math.PI / 2 - 0.05],
  arka: [Math.PI / 2, Math.PI / 2 - 0.05],
};

export interface ViewerOptions {
  canvas: HTMLCanvasElement;
  overlay: HTMLElement;
  sex: Sex;
  variant: string;
  reducedMotion: boolean;
  onSelect: (id: PartId | null, fromUser: boolean) => void;
}

export interface Viewer {
  setSex(s: Sex): void;
  setVariant(v: string): void;
  setAutoRotate(on: boolean): void;
  setSwim(on: boolean): void;
  /** Numaralı noktaları aç/kapat; kapalıyken gizli, aria-hidden ve tıklanamaz (parça listesi çalışır). */
  setHotspots(on: boolean): void;
  setView(v: ViewId): void;
  zoom(factor: number): void;
  rotate(dTheta: number, dPhi: number): void;
  reset(): void;
  select(id: PartId | null): void;
  isPartVisible(id: PartId): boolean;
  visibleParts(): PartId[];
  dispose(): void;
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function createViewer(opts: ViewerOptions): Viewer {
  const { canvas, overlay } = opts;
  const small = matchMedia('(max-width: 700px)').matches || navigator.maxTouchPoints > 0;
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.45;
  scene.add(new HemisphereLight(0xcfe8ff, 0x3a3326, 0.55));
  scene.add(new AmbientLight(0xffffff, 0.2));
  const key = new DirectionalLight(0xffffff, 1.6);
  key.position.set(2, 6, 3);
  scene.add(key);
  const under = new DirectionalLight(0xffe8c8, 0.9);
  under.position.set(-1, -5, 2);
  scene.add(under);
  const rim = new DirectionalLight(0x9fd8ff, 0.8);
  rim.position.set(-4, 2, -4);
  scene.add(rim);

  const camera = new PerspectiveCamera(30, 1, 0.1, 100);
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;
  controls.enableDamping = !opts.reducedMotion;
  controls.dampingFactor = 0.09;
  controls.rotateSpeed = 0.8;
  controls.autoRotateSpeed = 2.2;

  const uniforms: SwimUniforms = { uTime: { value: 0 }, uAmp: { value: 0 } };
  let sex = opts.sex, variant = opts.variant;
  let built: Built | null = null;
  let swimOn = false, selected: PartId | null = null;
  let radius = 3, visible = true, raf = 0, last = 0, disposed = false;
  let tween: { from: [number, number, number]; to: [number, number, number]; t0: number; dur: number } | null = null;
  const texW = small ? 512 : 1024;
  const ray = new Raycaster();

  let hotspotsOn = true;
  const hotspots = new Map<PartId, HTMLButtonElement>();
  const rebuildHotspots = () => {
    overlay.textContent = '';
    hotspots.clear();
    partsFor(sex).forEach((p, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'v3-hot';
      b.tabIndex = -1; // klavye kullanıcıları için eşdeğer: sayfadaki parça listesi
      b.setAttribute('aria-hidden', 'true');
      b.dataset.part = p.id;
      b.dataset.label = p.ad;
      b.textContent = String(i + 1);
      b.addEventListener('click', () => opts.onSelect(selected === p.id ? null : p.id, true));
      overlay.appendChild(b);
      hotspots.set(p.id, b);
    });
    for (const [id, b] of hotspots) b.classList.toggle('on', id === selected);
  };

  const spherical = (): [number, number, number] => {
    const o = camera.position.clone().sub(controls.target);
    const r = o.length();
    return [Math.atan2(o.x, o.z), Math.acos(Math.min(1, Math.max(-1, o.y / r))), r];
  };
  const place = (th: number, ph: number, r: number) => {
    const sp = Math.sin(ph);
    camera.position.set(controls.target.x + r * sp * Math.sin(th), controls.target.y + r * Math.cos(ph), controls.target.z + r * sp * Math.cos(th));
    camera.lookAt(controls.target);
  };
  const fitDistance = () => {
    const vf = (camera.fov * Math.PI) / 180;
    const hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
    return (radius * 1.08) / Math.sin(Math.min(vf, hf) / 2);
  };
  const limits = () => { controls.minDistance = fitDistance() * 0.3; controls.maxDistance = fitDistance() * 1.9; };

  const load = (first: boolean) => {
    const old = built;
    if (old) { scene.remove(old.group); disposeGroup(old.group, old.textures, old.proxy); }
    built = buildRay(sex, variant, uniforms, texW);
    scene.add(built.group);
    radius = built.bounds.radius;
    const prevTarget = controls.target.clone();
    controls.target.copy(built.center);
    if (first) place(...VIEW_ANGLES.capraz, fitDistance() * 0.8);
    else camera.position.add(controls.target.clone().sub(prevTarget));
    limits();
    rebuildHotspots();
    controls.update();
    invalidate();
  };

  const resize = () => {
    const w = canvas.clientWidth || 300, h = canvas.clientHeight || 300;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    limits();
    invalidate();
  };

  /** Vekil yüzeyleri o anki dalgaya göre güncelle (gizlenme sınaması gerçek görüntüyle uyumlu olsun) */
  const updateProxy = () => {
    if (!built) return;
    const t = uniforms.uTime.value, amp = uniforms.uAmp.value;
    built.proxy.forEach((m, k) => {
      const d = built!.proxyData[k];
      const p = m.geometry.getAttribute('position') as BufferAttribute;
      for (let i = 0; i < p.count; i++) p.setY(i, d.base[i * 3 + 1] + discWaveY(d.base[i * 3], d.rho[i], t, amp));
      p.needsUpdate = true;
      m.geometry.computeBoundingSphere();
    });
  };

  const tmp = new Vector3(), world = new Vector3(), nrm = new Vector3(), toCam = new Vector3(), dir = new Vector3();
  const updateHotspots = () => {
    if (!built) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const side = camera.position.z >= 0 ? 1 : -1;
    const t = uniforms.uTime.value, amp = uniforms.uAmp.value;
    updateProxy();
    for (const [id, btn] of hotspots) {
      const a = built.anchors[id];
      if (!hotspotsOn) { btn.hidden = true; btn.setAttribute('aria-hidden', 'true'); continue; }
      if (!a) { btn.hidden = true; continue; }
      const mirror = a.mirror && side < 0;
      const px = a.pos[0];
      const py = a.pos[1] + discWaveY(px, a.rho, t, amp);
      const pz = (mirror ? -a.pos[2] : a.pos[2]) + (a.tailU !== undefined ? tailSwayZ(a.tailU, t, amp) : 0);
      world.set(px, py, pz);
      toCam.copy(camera.position).sub(world);
      const dist = toCam.length();
      toCam.divideScalar(dist);
      let shown = true;
      // 1) yüzeyin kameraya bakıp bakmadığı
      if (a.normal) {
        nrm.set(a.normal[0], a.normal[1], mirror ? -a.normal[2] : a.normal[2]);
        shown = nrm.dot(toCam) > 0.06;
      }
      // 2) gövde tarafından örtülme: kameradan noktaya ışın at, vekil disk yüzeylerine çarparsa gizle
      if (shown) {
        const target = nrm.lengthSq() > 0 && a.normal ? world.clone().addScaledVector(nrm, 0.045) : world.clone();
        dir.copy(target).sub(camera.position);
        const dd = dir.length();
        dir.divideScalar(dd);
        ray.set(camera.position, dir);
        ray.far = dd - 0.01;
        const hit = ray.intersectObjects(built.proxy, false);
        if (hit.length > 0) shown = false;
      }
      tmp.copy(world).project(camera);
      const onScreen = tmp.z < 1 && Math.abs(tmp.x) < 1.02 && Math.abs(tmp.y) < 1.02;
      btn.hidden = !(shown && onScreen);
      if (!btn.hidden) btn.style.transform = `translate(${((tmp.x * 0.5 + 0.5) * w).toFixed(1)}px, ${((-tmp.y * 0.5 + 0.5) * h).toFixed(1)}px) translate(-50%, -50%)`;
    }
  };

  const frame = (now: number) => {
    raf = 0;
    if (disposed) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    let busy = false;

    const targetAmp = swimOn ? SWIM.amp : 0;
    const k = 1 - Math.exp(-dt * 5);
    uniforms.uAmp.value += (targetAmp - uniforms.uAmp.value) * k;
    if (swimOn || uniforms.uAmp.value > 0.0015) { uniforms.uTime.value += dt; busy = true; }
    else uniforms.uAmp.value = 0;

    if (tween) {
      const p = tween.dur <= 0 ? 1 : Math.min(1, (now - tween.t0) / tween.dur);
      const e = easeInOut(p);
      const f = tween.from, t = tween.to;
      place(f[0] + (t[0] - f[0]) * e, f[1] + (t[1] - f[1]) * e, f[2] + (t[2] - f[2]) * e);
      if (p >= 1) tween = null; else busy = true;
    }
    if (controls.autoRotate) busy = true;
    if (controls.update(dt)) busy = true;

    renderer.render(scene, camera);
    updateHotspots();
    canvas.dataset.frames = String((Number(canvas.dataset.frames) || 0) + 1);
    if (!canvas.parentElement?.hasAttribute('data-ready')) canvas.parentElement?.setAttribute('data-ready', 'true');
    if (busy && visible && !document.hidden) invalidate();
    else last = 0;
  };
  function invalidate() { if (!raf && !disposed && visible && !document.hidden) raf = requestAnimationFrame(frame); }

  controls.addEventListener('change', invalidate);
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  const io = new IntersectionObserver((e) => { visible = e[0]?.isIntersecting ?? true; if (visible) invalidate(); });
  io.observe(canvas);
  const onVis = () => { if (!document.hidden) invalidate(); };
  document.addEventListener('visibilitychange', onVis);
  canvas.addEventListener('webglcontextlost', (e) => e.preventDefault());
  canvas.addEventListener('webglcontextrestored', () => load(false));

  resize();
  load(true);

  const go = (th: number, ph: number, r: number) => {
    const from = spherical();
    let dth = th - from[0];
    dth = Math.atan2(Math.sin(dth), Math.cos(dth));
    tween = { from, to: [from[0] + dth, ph, r], t0: performance.now(), dur: opts.reducedMotion ? 0 : 650 };
    invalidate();
  };

  const api: Viewer = {
    setSex(s) { if (s !== sex) { sex = s; if (selected && !partsFor(sex).some((p) => p.id === selected)) { selected = null; opts.onSelect(null, false); } load(false); } },
    setVariant(v) { if (v !== variant) { variant = v; load(false); } },
    setAutoRotate(on) { controls.autoRotate = on; invalidate(); },
    setSwim(on) { swimOn = on; invalidate(); },
    setHotspots(on) { hotspotsOn = on; overlay.dataset.off = on ? '' : 'true'; if (!on) for (const b of hotspots.values()) { b.hidden = true; b.setAttribute('aria-hidden', 'true'); } invalidate(); },
    setView(v) { const [th, ph] = VIEW_ANGLES[v]; go(th, ph, fitDistance()); },
    zoom(f) { const s = spherical(); const r = Math.min(controls.maxDistance, Math.max(controls.minDistance, s[2] * f)); place(s[0], s[1], r); controls.update(); invalidate(); },
    rotate(dTh, dPh) { const s = spherical(); place(s[0] + dTh, Math.min(Math.PI - 0.03, Math.max(0.03, s[1] + dPh)), s[2]); controls.update(); invalidate(); },
    reset() { go(...VIEW_ANGLES.capraz, fitDistance() * 0.8); },
    select(id) {
      selected = id;
      for (const [pid, b] of hotspots) b.classList.toggle('on', pid === id);
      invalidate();
    },
    isPartVisible(id) { const b = hotspots.get(id); return !!b && !b.hidden; },
    visibleParts() { return [...hotspots].filter(([, b]) => !b.hidden).map(([id]) => id); },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      controls.dispose();
      if (built) disposeGroup(built.group, built.textures, built.proxy);
      envTex.dispose(); pmrem.dispose(); renderer.dispose();
    },
  };
  return api;
}
