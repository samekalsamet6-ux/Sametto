// Balık yüzü (göz, ağız, solungaç kapağı) için ortak three.js oluşturucuları.
// Hem fish3d (betta, neon, corydoras, japon, pleko) hem de yanal-viewer (melek, diskus) bunları kullanır; ev sahibi
// (FaceHost) kendi yüzme gölgelendiricisini ve öznitelik ekleme biçimini verir.
// Göz: dokulu (iris lifleri, gözbebeği, limbus) ve camsı küre; gövdeye kısmen gömülü, çevresinde ince göz çukuru halkası.
// Ağız: gerçek dudak geometrisi (üst/alt dudak tüpleri) ve koyu iç boşluk; alt dudak menteşeli, yüzerken hafifçe açılıp kapanır.
import {
  BufferGeometry, CanvasTexture, CatmullRomCurve3, DoubleSide, Float32BufferAttribute, Group, Material, Matrix4, Mesh, MeshBasicMaterial,
  MeshPhysicalMaterial, MeshStandardMaterial, Color, Raycaster, SphereGeometry, SRGBColorSpace, Texture, Vector3,
} from 'three';
import { seg, tess } from './fishgroup';

type V3 = [number, number, number];

export interface FaceHost {
  /** Ağı (gerekirse yüzme özniteliğini ekleyerek) sahneye ekler */
  add(geo: BufferGeometry, mat: Material, order?: number): Mesh;
  /** Malzemeye yüzme gölgelendiricisini ekler */
  wrap<M extends Material>(m: M): M;
  textures: Texture[];
}

/** Canlandırma: her kare çağrılır; amp 0..1 = yüzme ağırlığı */
export interface FaceRig { anim: ((t: number, amp: number) => void)[]; update(t: number, amp: number): void }
export function createFaceRig(): FaceRig {
  const anim: FaceRig['anim'] = [];
  return { anim, update(t, amp) { for (const a of anim) a(t, amp); } };
}

const hex = (h: string): [number, number, number] => { const c = new Color(h); return [c.r, c.g, c.b]; };
const mix = (a: string, b: string, t: number): string => '#' + new Color(a).lerp(new Color(b), t).getHexString();
const sstep = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ------------------------------------------------------------------ göz

export interface EyeStyle {
  ball: string; iris: string; pupil: string;
  /** Gözbebeği ve iris açısal yarıçapları (rad; ön kutuptan) */
  pupilAngle?: number; irisAngle?: number;
  /** Omega (ters U) iris perdesi: Ancistrus gibi yassı baş balıklarında gözbebeğinin üstü sarkar */
  omega?: boolean;
  /** Göz çukuru halkası rengi */
  ring?: string;
  seed?: number;
}

/** Küre için doku: dikey eksen ön kutuptan (üst satır) arka kutba açı; yatay eksen kutup çevresindeki açı. "Yukarı" u = 0.75. */
export function eyeTexture(st: EyeStyle): CanvasTexture {
  const W = tess.eye, H = tess.eye / 2, cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d')!;
  const img = ctx.createImageData(W, H), d = img.data;
  const th_p = st.pupilAngle ?? 0.5, th_i = st.irisAngle ?? 1.0, seed = (st.seed ?? 1) * 1.7;
  const ball = hex(st.ball), iris = hex(st.iris), pupil = hex(st.pupil);
  const limb = hex(mix(st.ball, '#000000', 0.55)), irisDark = hex(mix(st.iris, '#000000', 0.6)), irisLight = hex(mix(st.iris, '#ffffff', 0.35));
  for (let y = 0; y < H; y++) {
    const th = ((y + 0.5) / H) * Math.PI;
    for (let x = 0; x < W; x++) {
      const ph = ((x + 0.5) / W) * Math.PI * 2;
      const fib = 0.5 + 0.5 * (0.5 * Math.sin(ph * 23 + seed) + 0.3 * Math.sin(ph * 41 + seed * 2.1) + 0.2 * Math.sin(ph * 67 + seed * 0.7));
      let tp = th_p;
      if (st.omega) { let dd = Math.abs(ph - Math.PI * 1.5); dd = Math.min(dd, Math.PI * 2 - dd); tp = th_p * (1 - 0.55 * Math.exp(-(dd * dd) / 0.2)); }
      let c: [number, number, number];
      const edge = 0.025;
      if (th < tp - edge) c = pupil;
      else if (th < th_i) {
        const t = (th - tp) / (th_i - tp);
        const k = 0.62 + 0.62 * fib;
        const base = [0, 1, 2].map((i) => (iris[i] + (irisLight[i] - iris[i]) * (1 - t) * 0.6) * k);
        // iç halka (collarette) parlak, limbusa doğru koyulaşma
        const col = 0.12 * Math.exp(-Math.pow((t - 0.22) / 0.1, 2));
        const dk = sstep(0.62, 1.0, t);
        c = [0, 1, 2].map((i) => base[i] * (1 - dk) + irisDark[i] * dk + col) as [number, number, number];
        if (th < tp + edge) { const m = (th - (tp - edge)) / (2 * edge); c = [0, 1, 2].map((i) => pupil[i] * (1 - m) + c[i] * m) as [number, number, number]; }
      } else if (th < th_i + 0.12) {
        const m = sstep(th_i, th_i + 0.03, th) * (1 - sstep(th_i + 0.08, th_i + 0.12, th));
        c = [0, 1, 2].map((i) => ball[i] * (1 - m) + limb[i] * m) as [number, number, number];
      } else {
        const f = 1 - 0.45 * sstep(1.2, 2.4, th);
        c = [ball[0] * f, ball[1] * f, ball[2] * f];
      }
      const o = (y * W + x) * 4;
      d[o] = Math.min(255, Math.max(0, c[0] * 255)); d[o + 1] = Math.min(255, Math.max(0, c[1] * 255)); d[o + 2] = Math.min(255, Math.max(0, c[2] * 255)); d[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new CanvasTexture(cv);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export interface EyeSpec {
  /** Göz küresinin merkezi (z işareti yan için ayarlı), yarıçap ve dışa bakış yönü */
  center: V3; r: number; normal: V3;
  style: EyeStyle;
  /** Gövde yüzeyi (kaba ağ): göz çukuru halkasını gerçek kesişime oturtmak için; yoksa halka çizilmez */
  body?: BufferGeometry;
  /** Halka kalınlığı (r çarpanı) */
  rimK?: number;
}

const rotXHalfPi = () => new Matrix4().makeRotationX(Math.PI / 2);

/** Birim vektör eksen takımı: z = normal, y ≈ dünya "yukarı" */
function eyeBasis(n: Vector3): Matrix4 {
  const z = n.clone().normalize();
  let up = new Vector3(0, 1, 0);
  if (Math.abs(z.dot(up)) > 0.92) up = new Vector3(-1, 0, 0);
  const y = up.sub(z.clone().multiplyScalar(up.dot(z))).normalize();
  const x = new Vector3().crossVectors(y, z);
  return new Matrix4().makeBasis(x, y, z);
}

/** Küre ile gövde yüzeyinin kesişim eğrisi (gövde ağına ışın atarak); yoksa null */
function socketCurve(body: BufferGeometry, c: Vector3, n: Vector3, r: number, N = 40): Vector3[] | null {
  const m = new Mesh(body, new MeshBasicMaterial({ side: DoubleSide }));
  m.updateMatrixWorld(true);
  const ray = new Raycaster();
  const nn = n.clone().normalize();
  const B = eyeBasis(nn), u = new Vector3().setFromMatrixColumn(B, 0), w = new Vector3().setFromMatrixColumn(B, 1);
  const out: Vector3[] = [];
  const hb = (rho: number, d: Vector3): number => {
    const o = c.clone().addScaledVector(d, rho).addScaledVector(nn, 2 * r);
    ray.set(o, nn.clone().negate());
    ray.far = 4 * r;
    const hit = ray.intersectObject(m, false)[0];
    return hit ? 2 * r - hit.distance : -Infinity;
  };
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const d = u.clone().multiplyScalar(Math.cos(a)).addScaledVector(w, Math.sin(a));
    let lo = 0.1 * r, hi = 1.0 * r;
    const g = (rho: number) => hb(rho, d) - Math.sqrt(Math.max(0, r * r - rho * rho));
    if (g(hi * 0.999) < 0) { out.push(c.clone().addScaledVector(d, hi)); continue; }
    for (let k = 0; k < 9; k++) { const mid = (lo + hi) / 2; if (g(mid) < 0) lo = mid; else hi = mid; }
    const rho = (lo + hi) / 2;
    out.push(c.clone().addScaledVector(d, rho).addScaledVector(nn, Math.sqrt(Math.max(0, r * r - rho * rho))));
  }
  return out;
}

/** Kapalı/açık eğri boyunca değişken yarıçaplı tüp */
export function lipTube(points: V3[] | Vector3[], radii: number[], radial = 10, samples = 32, closed = false): BufferGeometry {
  radial = seg(radial, 4); samples = seg(samples, 8);
  const curve = new CatmullRomCurve3(points.map((p) => (p instanceof Vector3 ? p.clone() : new Vector3(...p))), closed);
  const frames = curve.computeFrenetFrames(samples, closed);
  const rAt = (u: number) => { if (radii.length === 1) return radii[0]; const f = u * (radii.length - 1); const i = Math.min(radii.length - 2, Math.floor(f)); return radii[i] + (radii[i + 1] - radii[i]) * (f - i); };
  const pos: number[] = [], idx: number[] = [];
  for (let i = 0; i <= samples; i++) {
    const u = i / samples, c = curve.getPointAt(u % 1 === 0 && i === samples && closed ? 0 : u), r = rAt(u);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const nrm = frames.normals[i].clone().multiplyScalar(Math.cos(a)).add(frames.binormals[i].clone().multiplyScalar(Math.sin(a)));
      pos.push(c.x + nrm.x * r, c.y + nrm.y * r, c.z + nrm.z * r);
    }
  }
  for (let i = 0; i < samples; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = a + radial + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Gerçekçi göz: dokulu, camsı küre + gövdeye oturan ince göz çukuru halkası */
export function addEye(host: FaceHost, spec: EyeSpec, tex?: Texture): Texture {
  const { r } = spec, c = new Vector3(...spec.center), n = new Vector3(...spec.normal).normalize();
  const t = tex ?? (() => { const x = eyeTexture(spec.style); host.textures.push(x); return x; })();
  const geo = new SphereGeometry(r, seg(44, 14), seg(30, 10));
  geo.applyMatrix4(rotXHalfPi());
  geo.applyMatrix4(eyeBasis(n));
  geo.translate(c.x, c.y, c.z);
  host.add(geo, host.wrap(new MeshPhysicalMaterial({
    map: t, roughness: 0.4, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.5, specularIntensity: 1,
  })));
  if (spec.body) {
    const curve = socketCurve(spec.body, c, n, r);
    if (curve) {
      const tr = r * (spec.rimK ?? 0.07);
      const pts = curve.map((p) => p.clone().addScaledVector(p.clone().sub(c).normalize(), tr * 0.25));
      host.add(lipTube(pts, [tr], 8, 56, true), host.wrap(new MeshStandardMaterial({ color: new Color(spec.style.ring ?? mix(spec.style.ball, '#000000', 0.3)), roughness: 0.55, metalness: 0.05 })));
    }
  }
  return t;
}

// ------------------------------------------------------------------ ağız

export interface MouthSpec {
  /** Açıklığın orta noktası (orta çizgi, z = 0) ve dışa bakan birim yön (xy düzleminde) */
  c: V3; dir: V3;
  /** Açıklığın yarı genişliği (z), dudak çizgileri arası yarı aralık, dudak tüp yarıçapı */
  hw: number; gap: number; lip: number;
  /** Üst/alt dudağın orta kısmının dışa çıkıntısı (alt çene öne çıkık için lower büyük) */
  upper?: number; lower?: number;
  /** En büyük çene düşmesi (dudak yarıçapı katı) */
  drop?: number;
  lipColor: string; innerColor: string;
  /** Alt dudak ayrı renk (varsayılan lipColor) */
  lowerColor?: string;
  /** Dudak kalınlığının uçlardaki oranı */
  corner?: number;
}

export interface MouthResult { corners: [V3, V3]; /** yerel -> dünya */ toWorld(lx: number, ly: number, lz: number): V3; ex: V3; ey: V3 }

export function addMouth(host: FaceHost, rig: FaceRig | null, m: MouthSpec): MouthResult {
  const c = new Vector3(...m.c), ex = new Vector3(...m.dir).setZ(0).normalize();
  let ey = new Vector3(-ex.y, ex.x, 0);
  let flipped = false;
  if (ey.y < 0 || (Math.abs(ey.y) < 1e-6 && ey.x < 0)) { ey.negate(); flipped = true; }
  const ez = new Vector3(0, 0, 1);
  const toW = (lx: number, ly: number, lz: number): V3 => { const p = c.clone().addScaledVector(ex, lx).addScaledVector(ey, ly).addScaledVector(ez, lz); return [p.x, p.y, p.z]; };
  const N = seg(22, 10), up = m.upper ?? m.lip * 0.4, lo = m.lower ?? m.lip * 0.4, cr = m.corner ?? 0.62;
  const arc = (sgn: 1 | -1, prot: number): { pts: V3[]; rad: number[] } => {
    const pts: V3[] = [], rad: number[] = [];
    for (let i = 0; i <= N; i++) {
      const psi = (i / N) * Math.PI, s = Math.sin(psi);
      pts.push(toW(prot * s - m.lip * 0.25 * (1 - s), sgn * m.gap * s, m.hw * Math.cos(psi)));
      rad.push(m.lip * (cr + (1 - cr) * Math.pow(s, 0.7)));
    }
    return { pts, rad };
  };
  const U = arc(1, up), L = arc(-1, lo);
  const lipMat = (col: string) => host.wrap(new MeshStandardMaterial({ color: new Color(col), roughness: 0.5, metalness: 0.02 }));

  // iç boşluk: koyu, kenarı kırmızımsı, ortası siyaha giden yassı yama (düz burun yüzünün hemen önünde; dudaklar kenarını örter)
  const cy = m.gap + m.lip * 0.9, ins = new Color(m.innerColor), blk = new Color('#050202');
  const pos: number[] = [], col: number[] = [], idx: number[] = [], R = 4, M = seg(28, 12);
  const lift = m.lip * 0.25;
  pos.push(...toW(lift, 0, 0)); col.push(blk.r, blk.g, blk.b);
  for (let k = 1; k <= R; k++) {
    const rho = k / R, cc = blk.clone().lerp(ins, Math.pow(rho, 1.5));
    for (let j = 0; j < M; j++) { const a = (j / M) * Math.PI * 2; pos.push(...toW(lift, cy * rho * Math.sin(a), m.hw * rho * Math.cos(a))); col.push(cc.r, cc.g, cc.b); }
  }
  for (let j = 0; j < M; j++) idx.push(0, 1 + j, 1 + ((j + 1) % M));
  for (let k = 1; k < R; k++) for (let j = 0; j < M; j++) {
    const a = 1 + (k - 1) * M + j, b = 1 + (k - 1) * M + ((j + 1) % M), cc = a + M, d = b + M;
    idx.push(a, cc, b, b, cc, d);
  }
  const cg = new BufferGeometry();
  cg.setAttribute('position', new Float32BufferAttribute(pos, 3));
  cg.setAttribute('color', new Float32BufferAttribute(col, 3));
  cg.setIndex(idx);
  cg.computeVertexNormals();
  host.add(cg, host.wrap(new MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: DoubleSide })), 0);

  host.add(lipTube(U.pts, U.rad, 10, 36), lipMat(m.lipColor));
  const lower = host.add(lipTube(L.pts, L.rad, 10, 36), lipMat(m.lowerColor ?? m.lipColor));

  // alt çene menteşesi: açıklığın gerisinde, z eksenine paralel; ağ dünya koordinatlarında kalır (yüzme gölgelendiricisiyle uyum için), matris ile döner
  const D = m.hw * 2.0, pivot = new Vector3(...toW(-D, 0, 0));
  const maxA = Math.asin(Math.min(0.9, ((m.drop ?? 1.4) * m.lip) / D));
  const sgn = flipped ? 1 : -1;
  lower.matrixAutoUpdate = false;
  const setOpen = (k: number) => {
    const a = sgn * maxA * k;
    lower.matrix.copy(new Matrix4().makeTranslation(pivot.x, pivot.y, pivot.z).multiply(new Matrix4().makeRotationZ(a)).multiply(new Matrix4().makeTranslation(-pivot.x, -pivot.y, -pivot.z)));
    lower.matrixWorldNeedsUpdate = true;
  };
  setOpen(0);
  rig?.anim.push((t, amp) => setOpen(amp * Math.pow(Math.max(0, Math.sin(t * 5.2)), 1.3)));
  return { corners: [toW(0, 0, m.hw), toW(0, 0, -m.hw)], toWorld: toW, ex: [ex.x, ex.y, 0], ey: [ey.x, ey.y, 0] };
}

/** Solungaç kapağı kenarını (tüp ağı) solunum ritmiyle hafifçe dışa iter (yan: +1 / -1) */
export function pulseGill(rig: FaceRig, mesh: Mesh, side: 1 | -1, k = 0.0022) {
  mesh.matrixAutoUpdate = false;
  rig.anim.push((t, amp) => {
    const p = amp * Math.pow(Math.max(0, Math.sin(t * 5.2 + Math.PI)), 1.3);
    mesh.matrix.makeTranslation(0, 0, side * k * p);
    mesh.matrixWorldNeedsUpdate = true;
  });
}

export const faceMix = mix;
export { Group };
