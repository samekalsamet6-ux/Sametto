// Canlı doğuran balıkların (lepistes, molly, plati) baş parçaları: göz, ağız ve solungaç kapağı (three.js; yalnızca görüntüleyicide).
// Göz: yüzeye gömülü küre + göz çukuru halkası; iris ışınsal dokulu, siyah göz bebeği, parlak (clearcoat) kornea.
// Ağız: gövde kesiti burunda eğik bir halkada kesilir; üst ve alt dudak bu halkaya oturan iki 3B dudaktır, içi koyu boşluktur.
// Canlılık (yüzme açıkken): alt çene hafifçe açılıp kapanır, solungaç kapağı nabız gibi kabarır.
import {
  BufferAttribute, BufferGeometry, CanvasTexture, Color, DoubleSide, Float32BufferAttribute, Group, Material, Mesh,
  MeshPhysicalMaterial, MeshStandardMaterial, Quaternion, SRGBColorSpace, SphereGeometry, TorusGeometry, Vector3, Texture,
} from 'three';
import { mouthCutT } from './body';
import { EYE_DEPTH, type Vec3 } from './model';

type Surf = (t: number, a: number, off?: number) => Vec3;
export interface GozRenk { iris: string; halka: string; pupil: string }

export interface HeadDeps {
  /** Gövde yüzeyi: (t, a, offset) */
  bsp: Surf;
  eye: { center: Vec3; normal: Vec3; radius: number };
  goz: GozRenk;
  /** Ağız halkasının orta konumu (t) */
  mouthT0: number;
  /** Renkler: gövde sırt/yan rengi (dudak ve çukur tonları için) */
  sirt: string;
  yan: string;
  karin: string;
  /** Gövde malzemesi (ağız kapaklarının derisi gövde dokusunu paylaşır) */
  bodyMat: Material;
  /** Yüzme dalgası gölgelendiricisi eki */
  swim: <M extends Material>(m: M) => M;
  /** Solungaç kapağı */
  gill: { front: (a: number) => number; edgeT: (a: number) => number; edge: () => [number, number][]; a0: number; a1: number };
  /** Hareket azaltma tercihi: açıksa ağız/solungaç animasyonu yok */
  reducedMotion: boolean;
}

export interface HeadParts {
  group: Group;
  textures: Texture[];
  /** time: yüzme zamanı (s); k: yüzme ağırlığı 0..1 (kapanırken 0'a iner) */
  update(time: number, k: number): void;
}

const PI2 = Math.PI * 2;

function plain(g: BufferGeometry): BufferGeometry {
  g.setAttribute('aFlap', new BufferAttribute(new Float32Array(g.getAttribute('position').count * 4), 4));
  return g;
}

/**
 * Dönen parça (alt çene, solungaç kapağı): köşeler DÜNYA koordinatlarında tutulur (yüzme gölgelendiricisi x'e göre çalıştığı için
 * grup dönüşümü kullanılmaz); açı değişince taban köşeler eksen etrafında CPU'da döndürülür.
 */
class Rig {
  private base: Float32Array;
  private baseN: Float32Array;
  private last = NaN;
  constructor(readonly geo: BufferGeometry, private pivot: Vector3, private axis: 'y' | 'z') {
    this.base = (geo.getAttribute('position').array as Float32Array).slice();
    this.baseN = (geo.getAttribute('normal').array as Float32Array).slice();
  }
  set(angle: number) {
    if (Math.abs(angle - this.last) < 2e-4) return;
    this.last = angle;
    const c = Math.cos(angle), s = Math.sin(angle), p = this.geo.getAttribute('position') as BufferAttribute, n = this.geo.getAttribute('normal') as BufferAttribute;
    const rot = (x: number, y: number, z: number): [number, number, number] => (this.axis === 'z' ? [x * c - y * s, x * s + y * c, z] : [x * c + z * s, y, -x * s + z * c]);
    for (let i = 0; i < p.count; i++) {
      const b = i * 3, q = rot(this.base[b] - this.pivot.x, this.base[b + 1] - this.pivot.y, this.base[b + 2] - this.pivot.z);
      p.setXYZ(i, q[0] + this.pivot.x, q[1] + this.pivot.y, q[2] + this.pivot.z);
      const m = rot(this.baseN[b], this.baseN[b + 1], this.baseN[b + 2]);
      n.setXYZ(i, m[0], m[1], m[2]);
    }
    p.needsUpdate = true; n.needsUpdate = true;
  }
}

// ------------------------------------------------------------------ göz

/** Göz küresi dokusu: dik eksen = kutuptan açı (0..π), yatay eksen = boylam. Dikey çizgiler = ışınsal iris lifleri. */
function eyeTexture(goz: GozRenk): HTMLCanvasElement {
  const W = 512, H = 256;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  const iris = new Color(goz.iris), halka = new Color(goz.halka), pupil = new Color(goz.pupil);
  const css = (col: Color) => `#${col.getHexString()}`;
  const mix = (a: Color, b: Color, f: number) => a.clone().lerp(b, f);
  const y = (th: number) => (th / Math.PI) * H;
  const thP = 0.32, thI = 0.7, thL = 0.8;
  const sclera = mix(halka.clone().multiplyScalar(0.22), new Color('#0a0a0c'), 0.35);
  const grad = g.createLinearGradient(0, 0, 0, H);
  const stop = (th: number, col: Color) => grad.addColorStop(Math.min(1, th / Math.PI), css(col));
  stop(0, pupil); stop(thP - 0.025, pupil); stop(thP + 0.025, mix(iris, new Color('#000000'), 0.55));
  stop(thP + 0.1, mix(iris, new Color('#ffffff'), 0.28)); // iris iç halkası (kolaret) daha açık
  stop(0.52, iris); stop(0.62, mix(iris, halka, 0.55)); stop(thI, mix(halka, new Color('#000000'), 0.45));
  stop(thL, mix(sclera, new Color('#000000'), 0.3)); stop(thL + 0.18, sclera); stop(Math.PI, sclera);
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  // ışınsal lifler
  let s = 12345;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  for (let i = 0; i < 360; i++) {
    const x = rnd() * W, y0 = y(thP + 0.035 + rnd() * 0.05), y1 = y(thI - 0.02 + rnd() * 0.05);
    const light = rnd() < 0.5;
    g.strokeStyle = light ? `rgba(255,244,215,${0.05 + rnd() * 0.12})` : `rgba(0,0,0,${0.14 + rnd() * 0.24})`;
    g.lineWidth = 0.8 + rnd() * 2.2;
    g.beginPath(); g.moveTo(x, y0); g.lineTo(x + (rnd() - 0.5) * 3, y1); g.stroke();
  }
  // göz bebeği çevresinde ince koyu halka
  g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, y(thP - 0.005), W, y(0.04));
  return c;
}

function buildEye(D: HeadDeps, side: 1 | -1, mats: { ball: Material; ring: Material }): Group {
  const R = D.eye.radius;
  const n = new Vector3(D.eye.normal[0], D.eye.normal[1], D.eye.normal[2] * side);
  const q = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), n);
  const c = D.eye.center;
  // köşeler dünya koordinatlarında (yüzme gölgelendiricisi gövdeyle aynı dalgayı uygulasın diye grup dönüşümü kullanılmaz)
  const place = (g: BufferGeometry) => { g.applyQuaternion(q); g.translate(c[0], c[1], c[2] * side); return plain(g); };
  const grp = new Group();
  const ballGeo = new SphereGeometry(R, 44, 30);
  ballGeo.rotateX(Math.PI / 2); // kutup +z
  grp.add(new Mesh(place(ballGeo), mats.ball));
  // göz çukuru kenarı: gözün yüzeyle kesiştiği yerde yassı halka
  const d = EYE_DEPTH * R, rr = Math.sqrt(R * R - d * d);
  const ringGeo = new TorusGeometry(rr, 0.085 * R, 8, 40);
  ringGeo.scale(1, 1, 0.55);
  ringGeo.translate(0, 0, d * 0.97);
  grp.add(new Mesh(place(ringGeo), mats.ring));
  return grp;
}

// ------------------------------------------------------------------ dudak yardımcıları

/** Yarıçapı uçlara doğru incelen, uçları kapalı tüp. */
function lipTube(points: Vec3[], rMid: number, rEnd: number, radial = 9): BufferGeometry {
  const N = points.length;
  const P = points.map((p) => new Vector3(...p));
  const pos: number[] = [], idx: number[] = [];
  const nrm = new Vector3();
  for (let i = 0; i < N; i++) {
    const tan = P[Math.min(N - 1, i + 1)].clone().sub(P[Math.max(0, i - 1)]).normalize();
    // dışa bakan yön: halka merkezinden noktaya
    const out = nrm.copy(P[i]).sub(new Vector3((P[0].x + P[N - 1].x) / 2 + 0.03, (P[0].y + P[N - 1].y) / 2, 0)).normalize();
    const bin = new Vector3().crossVectors(tan, out).normalize();
    const nn = new Vector3().crossVectors(bin, tan).normalize();
    const u = i / (N - 1);
    const r = rEnd + (rMid - rEnd) * Math.pow(Math.sin(Math.PI * u), 0.6);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * PI2;
      pos.push(P[i].x + (nn.x * Math.cos(a) + bin.x * Math.sin(a)) * r, P[i].y + (nn.y * Math.cos(a) + bin.y * Math.sin(a)) * r, P[i].z + (nn.z * Math.cos(a) + bin.z * Math.sin(a)) * r * 0.9);
    }
  }
  for (let i = 0; i < N - 1; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = a + radial + 1;
    idx.push(a, a + 1, b, a + 1, b + 1, b);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return plain(g);
}

function buildMouth(D: HeadDeps) {
  const { bsp, mouthT0: t0 } = D;
  const NA = 56;
  const rim = (a: number, off = 0): Vec3 => bsp(mouthCutT(t0, a), a, off);
  const aC = 0.34; // ağız köşelerinin ekvatorun hafif üstünde olması: alt çene daha geniş, ağız yukarı-öne bakar
  const A1 = Math.PI / 2 + aC, A2 = (3 * Math.PI) / 2 - aC;
  const w = rim(Math.PI / 2)[2]; // ağız yarı genişliği
  const lipCol = new Color(D.yan).lerp(new Color(D.karin), 0.25).lerp(new Color(D.sirt), 0.3).lerp(new Color('#e8b5a5'), 0.1);
  const lipMat = (f: number) => D.swim(new MeshStandardMaterial({ color: lipCol.clone().multiplyScalar(f), roughness: 0.5, metalness: 0.02 }));
  const inside = D.swim(new MeshStandardMaterial({ color: 0x1a0909, roughness: 0.85, side: DoubleSide }));
  const root = new Group();

  // koyu ağız boşluğu: halkadan içeri doğru daralan fincan
  {
    const rings = 5, pos: number[] = [], idx: number[] = [];
    const ctr = new Vector3();
    for (let j = 0; j < NA; j++) ctr.add(new Vector3(...rim((j / NA) * PI2)));
    ctr.multiplyScalar(1 / NA);
    for (let r = 0; r < rings; r++) {
      const k = r / (rings - 1);
      for (let j = 0; j <= NA; j++) {
        const q = new Vector3(...rim((j / NA) * PI2)).lerp(ctr, 0.15 + 0.85 * k * k);
        q.x += 0.9 * w * Math.sin(k * Math.PI * 0.5);
        pos.push(q.x, q.y, q.z);
      }
    }
    for (let r = 0; r < rings - 1; r++) for (let j = 0; j < NA; j++) {
      const a = r * (NA + 1) + j, b = a + NA + 1;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(pos, 3));
    g.setIndex(idx); g.computeVertexNormals();
    root.add(new Mesh(plain(g), inside));
  }

  const C1 = new Vector3(...rim(A1)), C2 = new Vector3(...rim(A2));
  // halka kesitinin elipsi: kapaklar bu elips üzerinde yuvarlak (kubbe) bir burun oluşturur, düz levha olmaz
  let ymin = Infinity, ymax = -Infinity, zmax = 0;
  for (let j = 0; j < 48; j++) { const q = rim((j / 48) * PI2); ymin = Math.min(ymin, q[1]); ymax = Math.max(ymax, q[1]); zmax = Math.max(zmax, Math.abs(q[2])); }
  const cy = (ymin + ymax) / 2, hy = (ymax - ymin) / 2 || 1, hz = zmax || 1;
  const bulge = (y: number, z: number): number => Math.sqrt(Math.max(0, 1 - ((y - cy) / hy) ** 2 - (z / hz) ** 2));
  /** Dudak kapağı: halka yayından köşeleri birleştiren yarığa uzanan, öne hafif kubbeli deri yüzeyi (gövde dokusunu kullanır). */
  const cap = (from: number, to: number, c0: Vector3, c1: Vector3, dome: number): BufferGeometry => {
    const NU = 28, NV = 7, pos: number[] = [], uv: number[] = [], idx: number[] = [];
    for (let i = 0; i <= NU; i++) {
      const a = from + ((to - from) * i) / NU, u = i / NU;
      const r = new Vector3(...rim(a)), ch = c0.clone().lerp(c1, u);
      for (let v = 0; v <= NV; v++) {
        const k = v / NV, p = r.clone().lerp(ch, k);
        p.x -= dome * w * bulge(p.y, p.z);
        pos.push(p.x, p.y, p.z);
        uv.push(mouthCutT(t0, a), (a % PI2) / PI2);
      }
    }
    for (let i = 0; i < NU; i++) for (let v = 0; v < NV; v++) {
      const a = i * (NV + 1) + v, b = a + NV + 1;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    // yüzey dışa (öne, -x) bakmalı; ters ise sarım yönünü çevir
    const nx = g.getAttribute('normal');
    let sum = 0;
    for (let i = 0; i < nx.count; i++) sum += nx.getX(i);
    if (sum > 0) {
      for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
      g.setIndex(idx); g.computeVertexNormals();
    }
    return plain(g);
  };
  const lipLine = (c0: Vector3, c1: Vector3, dome: number, sag: number): Vec3[] => {
    const out: Vec3[] = [];
    for (let i = 0; i <= 20; i++) {
      const u = i / 20, p = c0.clone().lerp(c1, u);
      p.y += sag * Math.sin(Math.PI * u);
      p.x -= dome * w * bulge(p.y, p.z);
      out.push([p.x, p.y, p.z]);
    }
    return out;
  };
  const rUp = 0.17 * w, rLo = 0.21 * w;
  const gap = 0.3 * w;
  const dUp = 0.34, dLo = 0.42;
  // üst çene (sabit)
  root.add(new Mesh(cap(A1, A2, C1, C2, dUp), lipMat(0.98)));
  const up1 = C1.clone().add(new Vector3(0, gap * 0.4, 0)), up2 = C2.clone().add(new Vector3(0, gap * 0.4, 0));
  root.add(new Mesh(lipTube(lipLine(up1, up2, dUp, 0.2 * w * 0.2), rUp, rUp * 0.45), lipMat(1.03)));
  // alt çene: köşe ekseni etrafında dönen grup
  const pivot = C1.clone().add(C2).multiplyScalar(0.5);
  const lowCap = cap(A2, A1 + PI2, C2, C1, dLo);
  root.add(new Mesh(lowCap, lipMat(0.96)));
  const lo1 = C2.clone().add(new Vector3(0, -gap * 0.4, 0)), lo2 = C1.clone().add(new Vector3(0, -gap * 0.4, 0));
  const lowLip = lipTube(lipLine(lo1, lo2, dLo, -0.2 * w * 0.2), rLo, rLo * 0.45);
  root.add(new Mesh(lowLip, lipMat(0.97)));
  const rigs = [new Rig(lowCap, pivot, 'z'), new Rig(lowLip, pivot, 'z')];
  return { root, jaw: { set: (a: number) => rigs.forEach((r) => r.set(a)) } };
}

// ------------------------------------------------------------------ solungaç kapağı

function buildGill(D: HeadDeps, side: 1 | -1) {
  const { bsp, gill } = D;
  const NA = 18, NC = 6;
  const aOf = (a: number) => (side > 0 ? a : PI2 - a);
  const am = (gill.a0 + gill.a1) / 2;
  const P0 = new Vector3(...bsp(gill.front(am), aOf(am), 0.007));
  const pos: number[] = [], idx: number[] = [];
  for (let i = 0; i <= NA; i++) {
    const a = gill.a0 + ((gill.a1 - gill.a0) * i) / NA;
    const t0 = gill.front(a), t1 = gill.edgeT(a);
    for (let k = 0; k <= NC; k++) { const p = bsp(t0 + ((t1 - t0) * k) / NC, aOf(a), 0.007); pos.push(p[0], p[1], p[2]); }
  }
  for (let i = 0; i < NA; i++) for (let k = 0; k < NC; k++) {
    const a = i * (NC + 1) + k, b = a + 1, c = a + NC + 1, d = c + 1;
    if (side > 0) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const patch = new Mesh(plain(g), D.swim(new MeshPhysicalMaterial({
    color: new Color(D.yan).lerp(new Color('#ffffff'), 0.4), transparent: true, opacity: 0.34, roughness: 0.2, metalness: 0.1,
    iridescence: 0.9, iridescenceIOR: 1.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1,
  })));
  patch.renderOrder = 3;
  // arka kenar çizgisi (tüp)
  const edgePts = gill.edge().map(([t, a]) => bsp(t, aOf(a), 0.011));
  const eg = lipTubeFlat(edgePts, 0.0045);
  const edge = new Mesh(eg, D.swim(new MeshStandardMaterial({ color: new Color(D.yan).multiplyScalar(0.5), roughness: 0.5 })));
  const grp = new Group();
  grp.add(patch, edge);
  const rigs = [new Rig(g, P0, 'y'), new Rig(eg, P0, 'y')];
  return { grp, set: (a: number) => rigs.forEach((r) => r.set(a)) };
}

function lipTubeFlat(points: Vec3[], r: number): BufferGeometry {
  return lipTube(points, r, r, 6);
}

// ------------------------------------------------------------------ toplu kurulum

export function buildHead(D: HeadDeps): HeadParts {
  const group = new Group();
  const textures: Texture[] = [];

  // gözler (iki yan)
  const eyeTex = new CanvasTexture(eyeTexture(D.goz));
  eyeTex.colorSpace = SRGBColorSpace; eyeTex.anisotropy = 4;
  textures.push(eyeTex);
  const ball = D.swim(new MeshPhysicalMaterial({
    map: eyeTex, roughness: 0.32, metalness: 0.12, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.15, specularIntensity: 1,
  }));
  const ring = D.swim(new MeshStandardMaterial({ color: new Color(D.sirt).lerp(new Color(D.yan), 0.5).multiplyScalar(0.7), roughness: 0.55, metalness: 0.1 }));
  for (const side of [1, -1] as const) group.add(buildEye(D, side, { ball, ring }));

  // ağız
  const m = buildMouth(D);
  group.add(m.root);

  // solungaç kapakları
  const gills = ([1, -1] as const).map((s) => ({ side: s, g: buildGill(D, s) }));
  for (const gl of gills) group.add(gl.g.grp);

  const rest = 0.1;
  const update = (time: number, k: number) => {
    const live = D.reducedMotion ? 0 : k;
    const breath = 0.5 - 0.5 * Math.cos(time * 7.5);
    m.jaw.set(rest + live * 0.3 * breath);
    for (const gl of gills) gl.g.set(-gl.side * live * 0.085 * (0.35 + 0.65 * breath));
  };
  update(0, 0);
  return { group, textures, update };
}
