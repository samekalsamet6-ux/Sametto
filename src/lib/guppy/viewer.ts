// three.js sahnesi: yalnızca 3B lepistes sayfasında, tembel (dynamic import) yüklenir.
import {
  BufferAttribute, BufferGeometry, CatmullRomCurve3, Color, DoubleSide,
  Float32BufferAttribute, Group, LineBasicMaterial, LineSegments, Material, Mesh, MeshPhysicalMaterial,
  MeshStandardMaterial, PerspectiveCamera, Scene, SRGBColorSpace, SphereGeometry, Vector3,
  WebGLRenderer, CanvasTexture, Box3, Texture, Sphere, Raycaster,
} from 'three';
import { applyLook, createFitter } from '../akvaryum/scene-look';
import { buildHead, type HeadParts } from '../livebearer/head';
import { mouthCutT } from '../livebearer/body';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  BODY, OPERCULUM_A, SWIM, analFin, bodySurfacePoint, dorsalFin, eyeSpec, gonopodium, mouthT0, operculumEdge, operculumEdgeT,
  operculumFront, pectoralFin, pelvicFin, swimOffsetZ, tailFin, type Fin, type FormId, type Sex, type Vec3,
} from './model';
import { partAnchors, partsFor, type Anchor, type PartId, type ViewId } from './parts';
import { paintBody } from './texture';
import { finColor, variantById, type FinKind, type RGBA } from './variants';

// ------------------------------------------------------------------ yüzme gölgelendirici eki

interface SwimUniforms {
  uTime: { value: number };
  uAmp: { value: number };
  uFlap: { value: number };
  uLen: { value: number };
}

const SWIM_PARS = `
uniform float uTime; uniform float uAmp; uniform float uFlap; uniform float uLen;
attribute vec4 aFlap;`;
const SWIM_VERT = `
#include <begin_vertex>
transformed += aFlap.xyz * sin(uTime * ${SWIM.flapSpeed.toFixed(1)} + aFlap.w) * uFlap;
float swW = clamp(transformed.x / uLen + 0.5, 0.0, 1.8);
transformed.z += uAmp * swW * swW * sin(transformed.x * ${SWIM.wavenumber.toFixed(2)} - uTime * ${SWIM.speed.toFixed(2)});`;

function swimify<M extends Material>(m: M, u: SwimUniforms): M {
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = u.uTime;
    shader.uniforms.uAmp = u.uAmp;
    shader.uniforms.uFlap = u.uFlap;
    shader.uniforms.uLen = u.uLen;
    shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>\n${SWIM_PARS}`).replace('#include <begin_vertex>', SWIM_VERT);
  };
  m.customProgramCacheKey = () => 'guppy-swim';
  return m;
}

// ------------------------------------------------------------------ geometri yardımcıları

type FlapFn = (i: number, u: number, p: Vec3) => [number, number, number, number];

function withFlap(g: BufferGeometry, flap?: Float32Array): BufferGeometry {
  const n = g.getAttribute('position').count;
  g.setAttribute('aFlap', new BufferAttribute(flap ?? new Float32Array(n * 4), 4));
  return g;
}

function bodyGeometry(sex: Sex): BufferGeometry {
  const NT = 88, NA = 44, t0 = mouthT0(sex);
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i <= NT; i++) {
    const u = 0.5 * (1 - Math.cos((Math.PI * i) / NT));
    for (let j = 0; j <= NA; j++) {
      const a = (j / NA) * Math.PI * 2;
      const tc = mouthCutT(t0, a), t = tc + (1 - tc) * u; // gövde burunda eğik ağız halkasında başlar
      pos.push(...bodySurfacePoint(sex, t, a));
      uv.push(t, a / (Math.PI * 2));
    }
  }
  for (let i = 0; i < NT; i++) {
    for (let j = 0; j < NA; j++) {
      const v00 = i * (NA + 1) + j, v01 = v00 + 1, v10 = v00 + NA + 1, v11 = v10 + 1;
      idx.push(v00, v10, v01, v01, v10, v11);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const n = g.getAttribute('normal') as BufferAttribute;
  for (let i = 0; i <= NT; i++) {
    const a = i * (NA + 1), b = a + NA;
    const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b);
    const l = Math.hypot(x, y, z) || 1;
    n.setXYZ(a, x / l, y / l, z / l);
    n.setXYZ(b, x / l, y / l, z / l);
  }
  return withFlap(g);
}

/** Yüzgeç zarı: ışınlar arasındaki şerit (sub kat ara ışınla bölünür); köşe başına RGBA ve çırpma özniteliği */
function finMembrane(fin: Fin, color: (s: number, u: number) => RGBA, flap: FlapFn, sub = 1, ripple = 0.01): BufferGeometry {
  const R0 = fin.rays.length, P = fin.rays[0].length;
  const R = (R0 - 1) * sub + 1;
  const pos = new Float32Array(R * P * 3), col = new Float32Array(R * P * 4), fl = new Float32Array(R * P * 4);
  for (let i = 0; i < R; i++) {
    const f = i / sub, i0 = Math.min(R0 - 2, Math.floor(f)), w = f - i0;
    for (let k = 0; k < P; k++) {
      const u = k / (P - 1);
      const a = fin.rays[i0][k], b = fin.rays[Math.min(R0 - 1, i0 + 1)][k];
      const p: Vec3 = [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w, a[2] + (b[2] - a[2]) * w];
      const o = i * P + k;
      pos[o * 3] = p[0]; pos[o * 3 + 1] = p[1]; pos[o * 3 + 2] = p[2] + (Math.abs(f - Math.round(f)) < 1e-6 ? (Math.round(f) % 2 ? 1 : -1) : 0) * ripple * u;
      col.set(color(i / (R - 1), u), o * 4);
      fl.set(flap(f, u, p), o * 4);
    }
  }
  const idx: number[] = [];
  for (let i = 0; i < R - 1; i++) {
    for (let k = 0; k < P - 1; k++) {
      const a = i * P + k, b = a + 1, c = (i + 1) * P + k, d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3));
  g.setAttribute('color', new BufferAttribute(col, 4));
  g.setAttribute('aFlap', new BufferAttribute(fl, 4));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function finLines(fin: Fin, color: (i: number, u: number) => RGBA, flap: FlapFn): BufferGeometry {
  const pos: number[] = [], col: number[] = [], fl: number[] = [];
  const push = (p: Vec3, i: number, u: number) => { pos.push(...p); col.push(...color(i, u)); fl.push(...flap(i, u, p)); };
  fin.rays.forEach((r, i) => {
    for (let k = 0; k < r.length - 1; k++) { push(r[k], i, k / (r.length - 1)); push(r[k + 1], i, (k + 1) / (r.length - 1)); }
  });
  fin.branches.forEach((r, j) => {
    const i = Math.min(fin.rays.length - 1, Math.floor(j / 2));
    for (let k = 0; k < r.length - 1; k++) { push(r[k], i, 0.7 + 0.3 * (k / (r.length - 1))); push(r[k + 1], i, 0.7 + 0.3 * ((k + 1) / (r.length - 1))); }
  });
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new Float32BufferAttribute(col, 4));
  g.setAttribute('aFlap', new Float32BufferAttribute(fl, 4));
  return g;
}

function taperedTube(points: Vec3[], radii: number[], radial = 12, samples = 30): BufferGeometry {
  const curve = new CatmullRomCurve3(points.map((p) => new Vector3(...p)));
  const frames = curve.computeFrenetFrames(samples, false);
  const pos: number[] = [];
  const idx: number[] = [];
  const rAt = (u: number) => {
    const f = u * (radii.length - 1);
    const i = Math.min(radii.length - 2, Math.floor(f));
    return radii[i] + (radii[i + 1] - radii[i]) * (f - i);
  };
  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const c = curve.getPointAt(u);
    const r = rAt(u) * (i === samples ? 0.35 : 1);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const n = frames.normals[i].clone().multiplyScalar(Math.cos(a)).add(frames.binormals[i].clone().multiplyScalar(Math.sin(a)));
      pos.push(c.x + n.x * r, c.y + n.y * r, c.z + n.z * r);
    }
  }
  for (let i = 0; i < samples; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j, b = a + radial + 1;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return withFlap(g);
}

// ------------------------------------------------------------------ balığı kur

/**
 * Kameradan hedef noktaya çizilen ışın, hedefe varmadan `occluder` ağını kesiyorsa nokta gizlidir.
 * `tol`: hedefin kendi yüzeyinde olması durumunda yanlış gizlemeyi önleyen pay (dünya birimi).
 */
export function isOccluded(occluder: Mesh, from: Vector3, to: Vector3, tol: number, rc = new Raycaster()): boolean {
  const dir = to.clone().sub(from);
  const dist = dir.length();
  if (dist <= tol) return false;
  rc.set(from, dir.divideScalar(dist));
  rc.near = 0; rc.far = dist - tol;
  return rc.intersectObject(occluder, false).length > 0;
}

interface Built {
  body: Mesh;
  group: Group;
  anchors: Partial<Record<PartId, Anchor>>;
  textures: Texture[];
  head: HeadParts;
  bounds: Sphere;
  center: Vector3;
}

const darker = (c: RGBA, f: number, a: number): RGBA => [c[0] * f, c[1] * f, c[2] * f, Math.min(1, c[3] * a + 0.1)];

export function buildFish(sex: Sex, variantId: string, u: SwimUniforms, texW: number, form: FormId = 'standart', reducedMotion = false): Built {
  const variant = variantById(variantId);
  const pal = variant[sex];
  const group = new Group();
  const textures: Texture[] = [];
  const add = (geo: BufferGeometry, mat: Material, kind: 'mesh' | 'lines' = 'mesh', order = 0): Mesh | LineSegments => {
    const o = kind === 'mesh' ? new Mesh(geo, mat) : new LineSegments(geo, mat as LineBasicMaterial);
    o.renderOrder = order;
    group.add(o);
    return o;
  };

  // gövde
  const tex = paintBody(variant, sex, texW);
  const map = new CanvasTexture(tex.map);
  map.colorSpace = SRGBColorSpace; map.anisotropy = 4; map.flipY = false;
  const bump = new CanvasTexture(tex.bump);
  bump.anisotropy = 4; bump.flipY = false;
  textures.push(map, bump);
  const body = swimify(new MeshPhysicalMaterial({
    map, bumpMap: bump, bumpScale: 1.6, roughness: 0.34 - 0.14 * (variant.metal ?? 0), metalness: 0.08 + 0.5 * (variant.metal ?? 0),
    clearcoat: 0.4, clearcoatRoughness: 0.3, iridescence: 0.25 + 0.3 * (variant.metal ?? 0), iridescenceIOR: 1.35, envMapIntensity: 0.55,
  }), u);
  const bodyMesh = add(bodyGeometry(sex), body) as Mesh;

  // baş: gözler, ağız (iki dudak + iç boşluk), solungaç kapakları
  const head = buildHead({
    bsp: (t, a, off) => bodySurfacePoint(sex, t, a, off), eye: eyeSpec(sex), goz: variant.goz, mouthT0: mouthT0(sex), sirt: pal.sirt, yan: pal.yan,
    bodyMat: body, swim: (m) => swimify(m, u), reducedMotion,
    gill: { front: operculumFront, edgeT: operculumEdgeT, edge: () => operculumEdge(16), a0: OPERCULUM_A[0], a1: OPERCULUM_A[1] },
  });
  group.add(head.group);
  textures.push(...head.textures);

  // yüzgeçler
  const finMat = () => swimify(new MeshStandardMaterial({
    vertexColors: true, transparent: true, side: DoubleSide, depthWrite: false, roughness: 1, metalness: 0, envMapIntensity: 0.25,
  }), u);
  const lineMat = () => swimify(new LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false }), u);
  const addFin = (fin: Fin, kind: FinKind, flap: FlapFn, order: number, ripple = 0.01, sub = 1) => {
    const R2 = fin.rays.length;
    const col = (s: number, uu: number): RGBA => finColor(variant, sex, kind, uu, s);
    const lcol = (i: number, uu: number): RGBA => darker(col(i / (R2 - 1), uu), 0.8, 0.8);
    add(finMembrane(fin, col, flap, sub, ripple), finMat(), 'mesh', order);
    add(finLines(fin, lcol, flap), lineMat(), 'lines', order + 0.5);
  };
  const waveFlap = (amp: number, phase = 0.5, power = 1.4): FlapFn => (i, uu) => [0, 0, amp * Math.pow(uu, power), i * phase + uu * 3];
  addFin(tailFin(sex, form), 'kuyruk', waveFlap(0.055), 1, 0.01, 3);
  addFin(dorsalFin(sex, form), 'sirt', waveFlap(0.04, 0.45), 2, 0.01, 3);
  const anal = analFin(sex);
  if (anal) addFin(anal, 'anal', waveFlap(0.025, 0.4), 2);
  for (const side of [1, -1] as const) {
    addFin(pectoralFin(sex, side, form), 'gogus', (_i, uu) => [0, 0.5 * 0.05 * uu, side * 0.075 * uu, 0], 4, 0.006);
    addFin(pelvicFin(sex, side), 'karin', (_i, uu) => [0, 0, side * 0.035 * uu, 1.2], 4, 0.005);
  }

  // gonopodium
  const g = gonopodium(sex);
  if (g) {
    const gm = new Color(pal.yan).lerp(new Color('#6b4a38'), 0.55);
    add(taperedTube(g.path, g.radii), swimify(new MeshStandardMaterial({ color: gm, roughness: 0.5 }), u));
    // kanca ucu
    const tip = g.path[g.path.length - 1];
    const hook = new SphereGeometry(0.012, 10, 8);
    hook.translate(tip[0] + 0.012, tip[1] + 0.012, 0);
    add(withFlap(hook), swimify(new MeshStandardMaterial({ color: 0x2a1a14, roughness: 0.4 }), u));
  }

  const box = new Box3().setFromObject(group);
  const bounds = new Sphere();
  box.getBoundingSphere(bounds);
  return { body: bodyMesh, group, anchors: partAnchors(sex, form), textures, head, bounds, center: box.getCenter(new Vector3()) };
}

function disposeGroup(g: Group, textures: Texture[]) {
  g.traverse((o) => {
    const m = o as Mesh;
    if (m.geometry) m.geometry.dispose();
    const mat = m.material as Material | Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose()); else mat?.dispose();
  });
  textures.forEach((t) => t.dispose());
}

// ------------------------------------------------------------------ görüntüleyici

const VIEW_ANGLES: Record<ViewId, [number, number]> = {
  yan: [0, Math.PI / 2],
  capraz: [0.62, 1.28],
  ust: [0, 0.03],
  alt: [0, Math.PI - 0.03],
  on: [-Math.PI / 2, Math.PI / 2],
  arka: [Math.PI / 2, Math.PI / 2],
};

export interface ViewerOptions {
  canvas: HTMLCanvasElement;
  overlay: HTMLElement;
  sex: Sex;
  variant: string;
  form?: string;
  reducedMotion: boolean;
  onSelect: (id: PartId | null, fromUser: boolean) => void;
}

export interface Viewer {
  setSex(s: Sex): void;
  setVariant(v: string): void;
  setForm(f: string): void;
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
  dispose(): void;
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function createViewer(opts: ViewerOptions): Viewer {
  const { canvas, overlay } = opts;
  const small = matchMedia('(max-width: 700px)').matches || navigator.maxTouchPoints > 0;
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));

  const scene = new Scene();
  const look = applyLook(renderer, scene);
  const fitter = createFitter();

  const camera = new PerspectiveCamera(30, 1, 0.1, 100);
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;
  controls.enableDamping = !opts.reducedMotion;
  controls.dampingFactor = 0.09;
  controls.rotateSpeed = 0.8;
  controls.autoRotateSpeed = 2.2;

  const uniforms: SwimUniforms = { uTime: { value: 0 }, uAmp: { value: 0 }, uFlap: { value: 0 }, uLen: { value: BODY[opts.sex].length } };
  let sex = opts.sex, variant = opts.variant, form: string = opts.form ?? 'standart';
  let built: Built | null = null;
  let swimOn = false, selected: PartId | null = null;
  let radius = 3, visible = true, raf = 0, last = 0, disposed = false;
  let tween: { from: [number, number, number]; to: [number, number, number]; t0: number; dur: number } | null = null;
  let texW = small ? 512 : 1024;

  let hotspotsOn = true;
  const hotspots = new Map<PartId, HTMLButtonElement>();
  const rebuildHotspots = () => {
    overlay.textContent = '';
    hotspots.clear();
    partsFor(sex, form).forEach((p, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'g3-hot';
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
  /** Kamera uzaklığı: (th, ph) açısından modelin gerçek izdüşümünü kadrajın ~%78'ine sığdırır (verilmezse mevcut açı). */
  const fitDistance = (th?: number, ph?: number) => {
    const s = th === undefined || ph === undefined ? spherical() : [th, ph];
    return fitter.distance(camera, s[0], s[1]);
  };
  const limits = () => { const [lo, hi] = fitter.range(camera); controls.minDistance = lo; controls.maxDistance = hi; };

  const load = (first: boolean, refit = false) => {
    const old = built;
    if (old) { scene.remove(old.group); disposeGroup(old.group, old.textures); }
    uniforms.uLen.value = BODY[sex].length;
    built = buildFish(sex, variant, uniforms, texW, form, opts.reducedMotion);
    scene.add(built.group);
    radius = built.bounds.radius;
    const prevTarget = controls.target.clone();
    controls.target.copy(built.center);
    fitter.measure(built.group, controls.target);
    if (first) {
      place(0.62, 1.28, fitDistance(0.62, 1.28));
    } else {
      camera.position.add(controls.target.clone().sub(prevTarget));
      if (refit) { const sp = spherical(); place(sp[0], sp[1], fitDistance()); }
    }
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

  const tmp = new Vector3();
  const rc = new Raycaster();
  const occ = new Map<PartId, boolean>();
  let occKey = '', occAt = 0;
  const updateHotspots = () => {
    if (!built) return;
    // gizlenme (occlusion) hesabı yalnızca kamera/model değişince yenilenir
    const cp = camera.position;
    const key = `${cp.x.toFixed(3)},${cp.y.toFixed(3)},${cp.z.toFixed(3)}|${sex}|${variant}|${form}`;
    const nowMs = performance.now();
    // kamera sürekli dönerken (otomatik döndürme/sürükleme) en fazla ~8 Hz yenile; durunca son konumda kesin hesapla
    let recompute = false;
    if (key !== occKey) {
      if (nowMs - occAt > 120) { recompute = true; occKey = key; occAt = nowMs; built.group.updateMatrixWorld(true); }
      else invalidate(); // son konumda kesin hesap için bir kare daha iste
    }
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const side = camera.position.z >= 0 ? 1 : -1;
    const ampNow = uniforms.uAmp.value;
    for (const [id, btn] of hotspots) {
      const a = built.anchors[id];
      if (!hotspotsOn) { btn.hidden = true; btn.setAttribute('aria-hidden', 'true'); continue; }
      if (!a) { btn.hidden = true; continue; }
      const mirror = a.mirror && side < 0;
      const z = (mirror ? -a.pos[2] : a.pos[2]) + swimOffsetZ(a.pos[0], BODY[sex].length, uniforms.uTime.value, ampNow);
      tmp.set(a.pos[0], a.pos[1], z);
      let facing = true;
      if (a.normal) {
        const n = new Vector3(a.normal[0], a.normal[1], mirror ? -a.normal[2] : a.normal[2]);
        facing = n.dot(camera.position.clone().sub(tmp).normalize()) > 0;
      }
      if (recompute && !facing) occ.set(id, false);
      if (facing && recompute) {
        // yüzeydeki/yüzeye yakın çapa gövdenin arkasında kalıyorsa gizle (yüzme sapması yok sayılır)
        occ.set(id, isOccluded(built.body, camera.position, new Vector3(a.pos[0], a.pos[1], mirror ? -a.pos[2] : a.pos[2]), radius * 0.045, rc));
      }
      if (facing && occ.get(id)) facing = false;
      tmp.project(camera);
      const onScreen = tmp.z < 1 && Math.abs(tmp.x) < 1.02 && Math.abs(tmp.y) < 1.02;
      btn.hidden = !(facing && onScreen);
      btn.setAttribute('aria-hidden', 'true');
      if (!btn.hidden) btn.style.transform = `translate(${((tmp.x * 0.5 + 0.5) * w).toFixed(1)}px, ${((-tmp.y * 0.5 + 0.5) * h).toFixed(1)}px) translate(-50%, -50%)`;
    }
  };

  const frame = (now: number) => {
    raf = 0;
    if (disposed) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    let busy = false;

    const targetAmp = swimOn ? SWIM.amp : 0, targetFlap = swimOn ? 1 : 0;
    const k = 1 - Math.exp(-dt * 5);
    uniforms.uAmp.value += (targetAmp - uniforms.uAmp.value) * k;
    uniforms.uFlap.value += (targetFlap - uniforms.uFlap.value) * k;
    if (swimOn || uniforms.uAmp.value > 0.0015 || uniforms.uFlap.value > 0.01) { uniforms.uTime.value += dt; busy = true; }
    else { uniforms.uAmp.value = 0; uniforms.uFlap.value = 0; }

    if (tween) {
      const p = tween.dur <= 0 ? 1 : Math.min(1, (now - tween.t0) / tween.dur);
      const e = easeInOut(p);
      const f = tween.from, t = tween.to;
      place(f[0] + (t[0] - f[0]) * e, f[1] + (t[1] - f[1]) * e, f[2] + (t[2] - f[2]) * e);
      if (p >= 1) tween = null; else busy = true;
    }
    if (controls.autoRotate) busy = true;
    if (controls.update(dt)) busy = true;

    look.sync(camera, controls.target);
    fitter.center(camera, controls.target);
    built?.head.update(uniforms.uTime.value, uniforms.uFlap.value);
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
    // en kısa açı farkı
    let dth = th - from[0];
    dth = Math.atan2(Math.sin(dth), Math.cos(dth));
    tween = { from, to: [from[0] + dth, ph, r], t0: performance.now(), dur: opts.reducedMotion ? 0 : 650 };
    invalidate();
  };

  const api: Viewer = {
    setSex(s) { if (s !== sex) { sex = s; if (selected && !partsFor(sex, form).some((p) => p.id === selected)) { selected = null; opts.onSelect(null, false); } load(false); } },
    setVariant(v) { if (v !== variant) { variant = v; load(false); } },
    setForm(f) {
      if (f === form) return;
      form = f;
      if (selected && !partsFor(sex, form).some((p) => p.id === selected)) { selected = null; opts.onSelect(null, false); }
      load(false, true);
    },
    setAutoRotate(on) { controls.autoRotate = on; invalidate(); },
    setSwim(on) { swimOn = on; invalidate(); },
    setHotspots(on) { hotspotsOn = on; overlay.dataset.off = on ? '' : 'true'; if (!on) for (const b of hotspots.values()) { b.hidden = true; b.setAttribute('aria-hidden', 'true'); } occKey = ''; occAt = 0; invalidate(); },
    setView(v) { const [th, ph] = VIEW_ANGLES[v]; go(th, ph, fitDistance(th, ph)); },
    zoom(f) { const s = spherical(); const r = Math.min(controls.maxDistance, Math.max(controls.minDistance, s[2] * f)); place(s[0], s[1], r); controls.update(); invalidate(); },
    rotate(dTh, dPh) { const s = spherical(); place(s[0] + dTh, Math.min(Math.PI - 0.03, Math.max(0.03, s[1] + dPh)), s[2]); controls.update(); invalidate(); },
    reset() { go(0.62, 1.28, fitDistance(0.62, 1.28)); },
    select(id) {
      selected = id;
      for (const [pid, b] of hotspots) b.classList.toggle('on', pid === id);
      invalidate();
    },
    isPartVisible(id) { const b = hotspots.get(id); return !!b && !b.hidden; },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      controls.dispose();
      if (built) disposeGroup(built.group, built.textures);
      look.dispose(); renderer.dispose();
    },
  };
  return api;
}
