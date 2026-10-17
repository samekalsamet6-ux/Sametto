// Cüce vatoz (Potamotrygon cinsinin küçük türleri; şematik) 3B modeli için SAF geometri parametreleri.
// DOM ve three.js kullanılmaz: böylece birim testlenebilir, SVG yedeği de aynı sayılardan üretilir.
//
// Koordinatlar: x gövde ekseni (burun -x, kuyruk +x), y yukarı (sırt yüzü +y, karın yüzü -y), z yanal.
// Birim keyfidir (şematik model); gerçek ölçüm değildir. Disk yarı uzunluğu yaklaşık 1 birimdir.

export type Sex = 'erkek' | 'disi';
export type Vec3 = [number, number, number];
export type Vec2 = [number, number];
export type Face = 'ust' | 'alt';

export const SEXES: readonly Sex[] = ['erkek', 'disi'];

export interface DiscParams {
  /** Merkezden buruna / kuyruğa yarı uzunluk */
  aF: number;
  aB: number;
  /** Yarı genişlik */
  b: number;
  /** Süper elips üssü (2 = elips, büyüdükçe köşeli) */
  n: number;
  /** Burun bölgesinde genişlik daralması (0..1) */
  taper: number;
  /** Baş-gövde tümseğinin yüksekliği */
  hump: number;
  /** Disk zarının orta kalınlığı (üst yüz) */
  thick: number;
}

export const DISC: Record<Sex, DiscParams> = {
  erkek: { aF: 0.92, aB: 0.92, b: 0.94, n: 2.4, taper: 0.3, hump: 0.15, thick: 0.05 },
  disi: { aF: 0.98, aB: 0.98, b: 1.03, n: 2.25, taper: 0.28, hump: 0.18, thick: 0.06 },
};

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Normalleştirilmiş yarıçap: 0 = disk merkezi, 1 = disk kenarı (düzlemde x,z için kapalı biçimli) */
export function discRho(sex: Sex, x: number, z: number): number {
  const p = DISC[sex];
  const xn = x / (x < 0 ? p.aF : p.aB);
  const w = p.b * (1 - p.taper * Math.pow(Math.max(0, -xn), 1.3));
  const zn = z / w;
  return Math.pow(Math.pow(Math.abs(xn), p.n) + Math.pow(Math.abs(zn), p.n), 1 / p.n);
}

/** Kutupsal (rho, psi) -> disk düzlemi (x, z). psi = π burun, 0 kuyruk yönü, π/2 = +z yan. */
export function discPoint(sex: Sex, rho: number, psi: number): Vec2 {
  const p = DISC[sex];
  const c = Math.cos(psi), s = Math.sin(psi);
  const e = 2 / p.n;
  const xn = rho * Math.sign(c) * Math.pow(Math.abs(c), e);
  const zn = rho * Math.sign(s) * Math.pow(Math.abs(s), e);
  const x = xn * (xn < 0 ? p.aF : p.aB);
  const z = zn * p.b * (1 - p.taper * Math.pow(Math.max(0, -xn), 1.3));
  return [x, z];
}

/** Üst/alt yüz yüksekliği (y). Kenarda 0'a iner; iki yüz kenarda birleşir. */
export function surfaceY(sex: Sex, face: Face, x: number, z: number): number {
  const p = DISC[sex];
  const rho = discRho(sex, x, z);
  if (rho >= 1) return 0;
  const e = Math.pow(1 - Math.pow(rho, 2.4), 0.7);
  const hx = (x + 0.25) / 0.68, hz = z / (0.42 * p.b);
  const g = Math.exp(-(hx * hx + hz * hz));
  if (face === 'ust') return p.thick * e + p.hump * g * Math.sqrt(e);
  return -(0.5 * p.thick * e + 0.3 * p.hump * g * Math.sqrt(e));
}

export function discSurfacePoint(sex: Sex, face: Face, rho: number, psi: number, offset = 0): Vec3 {
  const [x, z] = discPoint(sex, rho, psi);
  const y = surfaceY(sex, face, x, z);
  return [x, y + (face === 'ust' ? offset : -offset), z];
}

// ---------------------------------------------------------------- yüzme dalgası

export const SWIM = { amp: 0.075, wavenumber: 3.4, speed: 4.6, power: 2.2, tailAmp: 1.6 };

/** Disk kenarında öne-arkaya ilerleyen dalga (y). GLSL ile aynı formül. rho: 0..1 */
export function discWaveY(x: number, rho: number, time: number, amp = SWIM.amp): number {
  return amp * Math.pow(clamp(rho, 0, 1), SWIM.power) * Math.sin(x * SWIM.wavenumber - time * SWIM.speed);
}

/** Kuyruğun yana sallanması (z). u: kuyruk boyunca 0..1. GLSL ile aynı formül. */
export function tailSwayZ(u: number, time: number, amp = SWIM.amp): number {
  return amp * SWIM.tailAmp * u * u * Math.sin(time * SWIM.speed * 0.9 - u * 3.2);
}

// ---------------------------------------------------------------- kuyruk ve diken

export const TAIL = { length: 1.5, rz: 0.13, ry: 0.07, tipR: 0.012 };

/** Kuyruk orta çizgisi (dinlenme duruşu): disk gerisinden uzanır, hafif S eğrisi çizer. */
export function tailPoint(sex: Sex, u: number): Vec3 {
  const x0 = DISC[sex].aB * 0.7;
  return [x0 + TAIL.length * u, -0.012 * u, 0.06 * Math.sin(u * 2.4)];
}

/** Kuyruk kesit yarıçapları (y, z): dibi geniş-yassı, ucu ince. */
export function tailRadii(u: number): { ry: number; rz: number } {
  const k = Math.pow(1 - u, 1.15);
  return { ry: TAIL.tipR + (TAIL.ry - TAIL.tipR) * k, rz: TAIL.tipR + (TAIL.rz - TAIL.tipR) * k };
}

export const SPINE_U = 0.25;
export const SPINE = { length: 0.42, baseWidth: 0.075, teeth: 7, thickness: 0.018, tilt: 12 };

/** Kuyruk dikeninin yandan taslağı: (boyuna konum s 0..1, yarı genişlik) çiftleri; kenarlar dişli. */
export function spineProfile(): { s: number; w: number }[] {
  const out: { s: number; w: number }[] = [];
  const N = SPINE.teeth * 2;
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const taper = Math.pow(1 - s, 0.85);
    // dişler: tek indekslerde çentik
    const tooth = i % 2 === 0 ? 1 : 0.62;
    out.push({ s, w: (SPINE.baseWidth / 2) * taper * tooth });
  }
  return out;
}

export interface SpineSpec { base: Vec3; dir: Vec3; length: number }
export function spineSpec(sex: Sex): SpineSpec {
  const c = tailPoint(sex, SPINE_U);
  const r = tailRadii(SPINE_U);
  const t = (SPINE.tilt * Math.PI) / 180;
  return { base: [c[0], c[1] + r.ry * 0.85, c[2]], dir: [Math.cos(t), Math.sin(t), 0], length: SPINE.length };
}

// ---------------------------------------------------------------- baş ayrıntıları (üst yüz)

export interface EyeSpec { center: Vec3; normal: Vec3; radius: number }
export const EYE_X = -0.6;
export const EYE_Z = 0.17;
export function eyeSpec(sex: Sex, side: 1 | -1 = 1): EyeSpec {
  const x = EYE_X * (sex === 'disi' ? 1.02 : 0.97), z = EYE_Z * side;
  const y = surfaceY(sex, 'ust', x, z) + 0.02;
  const n = norm([0.1, 0.9, 0.38 * side]);
  return { center: [x, y, z], normal: n, radius: 0.064 };
}

export interface SpiracleSpec { center: Vec3; rx: number; rz: number; rot: number }
export function spiracleSpec(sex: Sex, side: 1 | -1 = 1): SpiracleSpec {
  const x = -0.43 * (sex === 'disi' ? 1.02 : 0.97), z = 0.235 * side;
  return { center: [x, surfaceY(sex, 'ust', x, z) + 0.004, z], rx: 0.07, rz: 0.04, rot: 0.38 * side };
}

/** Spirakül kenarı (yüzeyde elips, halka noktaları) */
export function spiracleRing(sex: Sex, side: 1 | -1, n = 24, grow = 1): Vec3[] {
  const s = spiracleSpec(sex, side);
  const out: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const ex = Math.cos(a) * s.rx * grow, ez = Math.sin(a) * s.rz * grow;
    const x = s.center[0] + ex * Math.cos(s.rot) - ez * Math.sin(s.rot);
    const z = s.center[2] + ex * Math.sin(s.rot) + ez * Math.cos(s.rot);
    out.push([x, surfaceY(sex, 'ust', x, z) + 0.006, z]);
  }
  return out;
}

// ---------------------------------------------------------------- alt yüz ayrıntıları

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function norm(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}
const under = (sex: Sex, x: number, z: number, off = 0.004): Vec3 => [x, surfaceY(sex, 'alt', x, z) - off, z];

export const MOUTH_X = -0.52;
/** Ağız yarığı: hafif öne bombeli kavis (alt yüzde) */
export function mouthLine(sex: Sex): Vec3[] {
  const pts: Vec3[] = [];
  const w = sex === 'disi' ? 0.15 : 0.14;
  for (let i = 0; i <= 12; i++) {
    const f = i / 12, z = lerp(-w, w, f);
    const x = MOUTH_X - 0.035 * (1 - Math.pow(Math.abs(z) / w, 2)) + 0.01;
    pts.push(under(sex, x, z, 0.006));
  }
  return pts;
}

export const NARES_X = -0.68;
/** Burun deliği (tek yan için elips noktaları) */
export function naresRing(sex: Sex, side: 1 | -1, n = 14): Vec3[] {
  const out: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    out.push(under(sex, NARES_X + Math.cos(a) * 0.02, side * 0.115 + Math.sin(a) * 0.03, 0.007));
  }
  return out;
}

/** Nazal perde: iki burun deliğini birleştiren deri kıvrımı çizgisi */
export function nasalCurtain(sex: Sex): Vec3[] {
  const pts: Vec3[] = [];
  for (let i = 0; i <= 8; i++) {
    const f = i / 8, z = lerp(-0.12, 0.12, f);
    pts.push(under(sex, NARES_X + 0.045 + 0.012 * Math.sin(f * Math.PI), z, 0.01));
  }
  return pts;
}

/** Solungaç yarıkları: bir yan için 5 yarık (her biri nokta dizisi) */
export function gillSlits(sex: Sex, side: 1 | -1): Vec3[][] {
  const out: Vec3[][] = [];
  for (let k = 0; k < 5; k++) {
    const f = k / 4;
    const x0 = lerp(-0.3, 0.17, f);
    const zc = lerp(0.2, 0.125, f) * side;
    const half = lerp(0.062, 0.04, f);
    const pts: Vec3[] = [];
    for (let i = 0; i <= 6; i++) {
      const g = i / 6, z = zc + (g - 0.5) * 2 * half * side;
      const x = x0 + 0.014 * Math.sin(g * Math.PI) - 0.02 * (g - 0.5) * side;
      pts.push(under(sex, x, z, 0.006));
    }
    out.push(pts);
  }
  return out;
}

// ---------------------------------------------------------------- pelvik yüzgeçler ve klasperler

export interface PelvicSpec { cx: number; cz: number; rx: number; rz: number; rot: number }
/** Arka disk kenarından taşan yuvarlak lob */
export function pelvicSpec(sex: Sex, side: 1 | -1): PelvicSpec {
  const aB = DISC[sex].aB;
  return { cx: aB * 0.78, cz: 0.27 * side * (DISC[sex].b), rx: 0.4, rz: 0.2, rot: 0.2 * side };
}

/** Pelvik lobun düzlemdeki sınırı (x,z) */
export function pelvicOutline(sex: Sex, side: 1 | -1, n = 28): Vec2[] {
  const s = pelvicSpec(sex, side);
  const out: Vec2[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const ex = Math.cos(a) * s.rx, ez = Math.sin(a) * s.rz;
    out.push([s.cx + ex * Math.cos(s.rot) - ez * Math.sin(s.rot), s.cz + ex * Math.sin(s.rot) + ez * Math.cos(s.rot)]);
  }
  return out;
}

export interface ClasperSpec { path: Vec3[]; radii: number[] }
/** Erkekte pelvik yüzgecin iç kenarında uzanan çubuk biçimli eşleşme organı */
export function clasper(sex: Sex, side: 1 | -1): ClasperSpec | null {
  if (sex !== 'erkek') return null;
  const aB = DISC[sex].aB;
  const z = (f: number) => side * lerp(0.2, 0.14, f);
  const path: Vec3[] = [];
  for (let i = 0; i <= 5; i++) {
    const f = i / 5;
    path.push([aB * lerp(0.58, 1.32, f), -0.028 - 0.012 * f, z(f)]);
  }
  return { path, radii: [0.04, 0.036, 0.031, 0.026, 0.02, 0.012] };
}

// ---------------------------------------------------------------- SVG yedeği için siluet

export interface Silhouette {
  /** Disk sınırı (x,z) */
  disc: Vec2[];
  tail: Vec2[];
  pelvic: Vec2[][];
  claspers: Vec2[][];
  eyes: { x: number; z: number; r: number }[];
  spiracles: Vec2[][];
  mouth: Vec2[];
  gills: Vec2[][];
  nares: Vec2[][];
  spine: { x: number; z: number; len: number };
}

const xz = (p: Vec3): Vec2 => [p[0], p[2]];

export function silhouette(sex: Sex): Silhouette {
  const disc: Vec2[] = [];
  for (let i = 0; i < 96; i++) disc.push(discPoint(sex, 1, (i / 96) * Math.PI * 2));
  const tail: Vec2[] = [];
  for (let i = 0; i <= 20; i++) tail.push(xz(tailPoint(sex, i / 20)));
  const sp = spineSpec(sex);
  const cl = ([1, -1] as const).map((s) => clasper(sex, s)).filter((c): c is ClasperSpec => !!c).map((c) => c.path.map(xz));
  return {
    disc, tail,
    pelvic: ([1, -1] as const).map((s) => pelvicOutline(sex, s)),
    claspers: cl,
    eyes: ([1, -1] as const).map((s) => { const e = eyeSpec(sex, s); return { x: e.center[0], z: e.center[2], r: e.radius }; }),
    spiracles: ([1, -1] as const).map((s) => spiracleRing(sex, s).map(xz)),
    mouth: mouthLine(sex).map(xz),
    gills: ([1, -1] as const).flatMap((s) => gillSlits(sex, s).map((g) => g.map(xz))),
    nares: ([1, -1] as const).map((s) => naresRing(sex, s).map(xz)),
    spine: { x: sp.base[0], z: sp.base[2], len: sp.length },
  };
}

/** Disk düzlemi (x,z) -> doku koordinatı (0..1). Üst ve alt yüz aynı planar eşlemeyi kullanır. */
export const texUV = (x: number, z: number): Vec2 => [(x + 1.1) / 2.2, (z + 1.1) / 2.2];
