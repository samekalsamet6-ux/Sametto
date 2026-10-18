// Akvaryum sahnesi için saf (three'siz) yerleşim ve yüzme yolu hesabı: Node'da birim testle doğrulanır.
// Dünya: x = genişlik, y = yükseklik, z = derinlik; cam kutunun merkezi orijindedir. Balığın burnu +X, bu yüzden
// yaw = atan2(-vz, vx) (rotation.y = θ burnu (cosθ, 0, -sinθ) yönüne çevirir).

export interface TankDims { W: number; H: number; D: number; sand: number }
export interface Extent { hx: number; hy: number; hz: number }
export interface Pose { x: number; y: number; z: number; yaw: number; pitch: number }

export const TANK_H = 3.8;
export const SAND = 0.4;
/** Suyun üstünde bırakılan boşluk (balık yüzeye değmesin) */
export const SURFACE_GAP = 0.25;

/** Gerçekçi göreli boyut (1 = normalleştirilmiş birim uzunluk). */
export const REL_SIZE: Record<string, number> = { lepistes: 0.7, molly: 0.9, platy: 0.8, kilickuyruk: 0.9, gurami: 0.75, kaplanbarb: 0.65, zebradanio: 0.5, kardinal: 0.5, ram: 0.5, betta: 0.8, neon: 0.55, corydoras: 0.75, japon: 1.1, pleco: 1.2, melek: 1.0, diskus: 1.1, vatoz: 1.3, karides: 0.55 };
/** Zeminde yaşayanlar yavaş ve zemine yakın gezer; diğerleri su sütununda şeritlere dağılır. */
const BOTTOM = new Set(['pleco', 'corydoras', 'vatoz', 'karides']);
export const isBottom = (species: string): boolean => BOTTOM.has(species);

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Tank boyutu: balık sayısıyla büyür; dar (dikey) kadrajda daha dar olur. `maxR` en büyük yatay yarıçap (hiçbir balık sığmaz kalmasın). */
export function tankDims(count: number, aspect: number, maxR = 0.6): TankDims {
  let W = 5.2 + 0.34 * count;
  if (aspect < 1.25) W *= 0.8;
  W = Math.max(clamp(W, 4.2, 9.5), 2 * maxR + 1.6);
  const D = Math.max(3.0, W * 0.5, 2 * maxR + 0.8);
  return { W, H: TANK_H, D, sand: SAND };
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };

export const PITCH_MAX = 0.12;

/** Bir balığın döngüsel yolu. Konum, tank içinde ve kum zemininin üstünde kalacak biçimde sınırlandırılır. */
export function createMotion(o: { index: number; species: string; ext: Extent; dims: TankDims }): { pose(t: number): Pose; period: number; floorY: number; ceilY: number } {
  const { W, H, D, sand } = o.dims;
  const r = rng(hash(o.species) + o.index * 7919 + 17);
  const bottom = isBottom(o.species);
  const pitchMax = bottom ? 0 : PITCH_MAX;
  const rxz = Math.hypot(o.ext.hx, o.ext.hz);
  const mx = Math.max(0, W / 2 - rxz - 0.06), mz = Math.max(0, D / 2 - rxz - 0.06);
  const E = 0.2;                      // ikinci harmonik: yol yumurta/böbrek biçimi olur, hız hiç sıfırlanmaz
  const REACH = 1 + E;
  const ax = (mx / REACH) * (0.55 + 0.45 * r()), az = (mz / REACH) * (0.5 + 0.5 * r());
  const cx = (r() * 2 - 1) * Math.max(0, mx - ax * REACH), cz = (r() * 2 - 1) * Math.max(0, mz - az * REACH);
  const period = bottom ? 70 + r() * 40 : 36 + r() * 34;
  const dir = r() < 0.5 ? 1 : -1, phase = r() * Math.PI * 2, psi = r() * Math.PI * 2;
  const w = (dir * Math.PI * 2) / period;

  const tiltRoom = o.ext.hx * Math.sin(pitchMax);
  const floorY = -H / 2 + sand + o.ext.hy + tiltRoom + 0.03;
  const ceilY = Math.max(floorY, H / 2 - SURFACE_GAP - o.ext.hy - tiltRoom);
  const lane = (0.618033988 * (o.index + 0.5) + 0.12 * r()) % 1;
  const base = bottom ? floorY + 0.02 : floorY + (ceilY - floorY) * (0.08 + 0.84 * lane);
  const amp = bottom ? 0.015 : Math.min(0.14, 0.45 * Math.min(base - floorY, ceilY - base));
  const wy = (Math.PI * 2) / (period * 0.55), py = r() * Math.PI * 2;

  return {
    period, floorY, ceilY,
    pose(t: number): Pose {
      const a = w * t + phase;
      const x = cx + ax * (Math.sin(a) + E * Math.sin(2 * a + psi));
      const z = cz + az * (Math.cos(a) + E * Math.cos(2 * a + psi));
      const vx = ax * w * (Math.cos(a) + 2 * E * Math.cos(2 * a + psi));
      const vz = -az * w * (Math.sin(a) + 2 * E * Math.sin(2 * a + psi));
      const y = base + amp * Math.sin(wy * t + py);
      const vy = amp * wy * Math.cos(wy * t + py);
      const sp = Math.hypot(vx, vz) || 1e-6;
      return { x, y, z, yaw: Math.atan2(-vz, vx), pitch: clamp(Math.atan2(vy, sp), -pitchMax, pitchMax) };
    },
  };
}

/** Balığın bir pozdaki yatay/dikey taban-tavan taşması (testler): kutu içinde kalıyor mu? */
export function poseFits(p: Pose, ext: Extent, dims: TankDims): { inside: boolean; aboveFloor: boolean; belowSurface: boolean } {
  const c = Math.abs(Math.cos(p.yaw)), s = Math.abs(Math.sin(p.yaw));
  const ex = c * ext.hx + s * ext.hz, ez = s * ext.hx + c * ext.hz;
  const ey = ext.hy * Math.cos(p.pitch) + ext.hx * Math.abs(Math.sin(p.pitch));
  const eps = 1e-6;
  return {
    inside: Math.abs(p.x) + ex <= dims.W / 2 + eps && Math.abs(p.z) + ez <= dims.D / 2 + eps,
    aboveFloor: p.y - ey >= -dims.H / 2 + dims.sand - eps,
    belowSurface: p.y + ey <= dims.H / 2 + eps,
  };
}

/** Kamera uzaklığı: kutunun tamamı yatay ve dikey kadrajda kalsın (ön yüz düzlemine göre). */
export function fitDistance(dims: TankDims, aspect: number, fovDeg: number): number {
  const tanV = Math.tan((fovDeg * Math.PI) / 360), tanH = tanV * aspect;
  return Math.max((dims.W / 2 + 0.15) / tanH, (dims.H / 2 + 0.3) / tanV) + dims.D / 2;
}
