// Akvaryum sahnesi için saf (three'siz) yerleşim ve yüzme yolu hesabı: Node'da birim testle doğrulanır.
// Dünya: x = genişlik, y = yükseklik, z = derinlik; cam kutunun merkezi orijindedir. Balığın burnu +X, bu yüzden
// yaw = atan2(-vz, vx) (rotation.y = θ burnu (cosθ, 0, -sinθ) yönüne çevirir).

export interface TankDims { W: number; H: number; D: number; sand: number }
export interface Extent { hx: number; hy: number; hz: number }
export interface Pose { x: number; y: number; z: number; yaw: number; pitch: number }

export const TANK_H = 4.6;
export const SAND = 0.4;
/** Suyun üstünde bırakılan boşluk (balık yüzeye değmesin) */
export const SURFACE_GAP = 0.25;

/** Gerçekçi göreli boyut (1 = normalleştirilmiş birim uzunluk). */
export const REL_SIZE: Record<string, number> = { lepistes: 0.7, molly: 0.9, platy: 0.8, kilickuyruk: 0.9, gurami: 0.75, kaplanbarb: 0.65, zebradanio: 0.5, kardinal: 0.5, ram: 0.5, betta: 0.8, neon: 0.55, corydoras: 0.75, japon: 1.1, pleco: 1.2, melek: 1.0, diskus: 1.1, vatoz: 1.3, karides: 0.55, amano: 0.7 };
/** Davranış sınıfları: her tür için derinlik bandı (0 = zemin, 1 = tavan), hareket hızı (gövde boyu/sn), hareket oranı (durup kalkma), yol büyüklüğü. */
export interface Behavior {
  cls: 'dip-tabani' | 'sürüsü' | 'yavas-orta' | 'canli-doguran';
  bottom: boolean;
  /** derinlik bandı; dipte yaşayanlarda yok sayılır (zemin) */
  band: [number, number];
  /** hareket ederken gövde boyu / saniye */
  bl: number;
  /** zamanın hangi kesrinde hareket eder (1 = hep); gerisi durur / otlar */
  duty: number;
  /** yolun, kutunun izin verdiği alana oranı (alt, üst) */
  scale: [number, number];
  /** yolun dalgalılığı (0–0,35) */
  wiggle: number;
  /** aynı türün balıkları aynı yönde, birlikte hareket eder */
  shoal: boolean;
  /** durup kalkma döngüsü (sn) */
  cycle: number;
}
const B = (cls: Behavior['cls'], bottom: boolean, band: [number, number], bl: number, duty: number, scale: [number, number], wiggle: number, shoal: boolean, cycle = 14): Behavior => ({ cls, bottom, band, bl, duty, scale, wiggle, shoal, cycle });
export const BEHAVIOR: Record<string, Behavior> = {
  pleco: B('dip-tabani', true, [0, 0], 0.5, 0.2, [0.2, 0.4], 0.1, false, 40),
  vatoz: B('dip-tabani', true, [0, 0], 0.32, 1, [0.55, 0.8], 0.33, false),
  corydoras: B('dip-tabani', true, [0, 0], 2.0, 0.5, [0.4, 0.65], 0.2, true, 9),
  karides: B('dip-tabani', true, [0, 0], 0.9, 0.35, [0.15, 0.4], 0.2, false, 12),
  amano: B('dip-tabani', true, [0, 0], 0.9, 0.35, [0.15, 0.4], 0.2, false, 12),
  neon: B('sürüsü', false, [0.45, 0.7], 1.6, 1, [0.6, 0.9], 0.2, true),
  kardinal: B('sürüsü', false, [0.4, 0.66], 1.6, 1, [0.6, 0.9], 0.2, true),
  zebradanio: B('sürüsü', false, [0.62, 0.82], 2.2, 1, [0.6, 0.9], 0.2, true),
  kaplanbarb: B('sürüsü', false, [0.4, 0.66], 1.5, 1, [0.6, 0.9], 0.2, true),
  melek: B('yavas-orta', false, [0.4, 0.68], 0.45, 1, [0.65, 0.9], 0.1, false),
  diskus: B('yavas-orta', false, [0.35, 0.62], 0.4, 1, [0.65, 0.9], 0.1, false),
  ram: B('yavas-orta', false, [0.06, 0.28], 1.1, 0.45, [0.35, 0.65], 0.2, false, 8),
  gurami: B('yavas-orta', false, [0.55, 0.78], 0.5, 0.6, [0.25, 0.5], 0.2, false, 16),
  betta: B('yavas-orta', false, [0.55, 0.78], 0.5, 0.55, [0.25, 0.5], 0.2, false, 16),
  japon: B('yavas-orta', false, [0.2, 0.42], 0.45, 0.8, [0.45, 0.75], 0.15, false, 18),
  lepistes: B('canli-doguran', false, [0.35, 0.68], 1.0, 1, [0.55, 0.9], 0.25, false),
  molly: B('canli-doguran', false, [0.35, 0.68], 0.9, 1, [0.55, 0.9], 0.25, false),
  platy: B('canli-doguran', false, [0.35, 0.68], 0.9, 1, [0.55, 0.9], 0.25, false),
  kilickuyruk: B('canli-doguran', false, [0.35, 0.68], 1.0, 1, [0.55, 0.9], 0.25, false),
};
const DEFAULT_BEHAVIOR = B('canli-doguran', false, [0.35, 0.68], 0.9, 1, [0.5, 0.85], 0.2, false);
export const behaviorOf = (species: string): Behavior => BEHAVIOR[species] ?? DEFAULT_BEHAVIOR;
export const isBottom = (species: string): boolean => behaviorOf(species).bottom;
/** Arka camın önünde dekor (bitki, kaya, kütük) için ayrılan şerit */
export const BACK_MARGIN = 0.5;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Tank boyutu: balık sayısıyla büyür; dar (dikey) kadrajda daha dar olur. `maxR` en büyük yatay yarıçap (hiçbir balık sığmaz kalmasın). */
export function tankDims(count: number, aspect: number, maxR = 0.6): TankDims {
  let W = 5.6 + 0.36 * count;
  if (aspect < 1.5) W *= 0.72;
  W = Math.max(clamp(W, 4.8, 9.4), 2 * maxR + 1.6);
  const D = Math.max(3.6, W * 0.5, 2 * maxR + 0.8 + BACK_MARGIN);
  return { W, H: TANK_H, D, sand: SAND };
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };

export const PITCH_MAX = 0.12;
const smooth = (x: number) => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };

export interface MotionOpts { index: number; species: string; ext: Extent; dims: TankDims; /** aynı türün kaçıncısı (sürü için) */ rank?: number; }
export interface Motion { pose(t: number): Pose; period: number; floorY: number; ceilY: number; /** [alt, üst] y bandı (dipte yaşayanlarda zemin) */ yRange: [number, number]; }

/**
 * Bir balığın döngüsel yolu: kapalı, hafif dalgalı bir halka üzerinde, türe özgü derinlik bandında ve hızda.
 * Durup kalkan türlerde (pleco, çorydoras, karides, ram…) ilerleme zaman eğrisiyle yumuşakça durur ve kalkar; duruşta gövde yönü değişmez.
 * Konum her zaman kutunun içinde ve kum zemininin üstünde kalır; dipte yaşayanlar zemine paraleldir.
 */
export function createMotion(o: MotionOpts): Motion {
  const { W, H, D, sand } = o.dims;
  const bh = behaviorOf(o.species);
  const rank = o.rank ?? 0;
  const seed = bh.shoal ? hash(o.species) + 17 : hash(o.species) + o.index * 7919 + 17;
  const r = rng(seed), rp = rng(hash(o.species) + o.index * 104729 + 3);
  const bottom = bh.bottom;
  const pitchMax = bottom ? 0 : PITCH_MAX;
  const rxz = Math.hypot(o.ext.hx, o.ext.hz);
  const mx = Math.max(0, W / 2 - rxz - 0.06);
  const zlo = -D / 2 + rxz + 0.06 + BACK_MARGIN, zhi = D / 2 - rxz - 0.06;
  const mz = Math.max(0, (zhi - zlo) / 2 || 0), zmid = zhi >= zlo ? (zhi + zlo) / 2 : 0;
  const E = bh.wiggle;                 // ikinci harmonik: yol yumurta/böbrek biçimi olur
  const REACH = 1 + E;
  const sc = bh.scale[0] + (bh.scale[1] - bh.scale[0]) * r();
  const shoalScale = bh.shoal ? 1 - 0.07 * (rank % 3) : 1;
  let ax = (mx / REACH) * sc * shoalScale, az = (mz / REACH) * Math.min(1, sc * 1.1) * shoalScale;
  { // yol çok ince uzamasın: uçlardaki dönüş yarıçapı hıza göre yeterince geniş kalsın (saniyede ~1,7 radyandan hızlı dönüş yok)
    const rho = Math.max(0.3, bh.bl * 2 * o.ext.hx * 0.6) * (1 + 2 * bh.wiggle);
    const big = Math.max(ax, az), small = Math.min(ax, az), cap = small >= rho ? Math.min(big, (small * small) / rho) : small;
    if (ax >= az) ax = Math.max(cap, small); else az = Math.max(cap, small);
  }
  const spread = bh.shoal ? r() : (0.618033988 * (o.index + 1) + 0.15 * r()) % 1;   // türler tankın değişik yerlerinde gezer
  const cx = (spread * 2 - 1) * Math.max(0, mx - ax * REACH), cz = zmid + (r() * 2 - 1) * Math.max(0, mz - az * REACH);
  const dir = r() < 0.5 ? 1 : -1, psi = r() * Math.PI * 2;
  const phase = r() * Math.PI * 2 + (bh.shoal ? rank * 0.55 + 0.2 * rp() : 0);

  // zaman eğrisi: m(u) hareket ederken 1, dururken 0 (yumuşak geçiş); Φ = m'nin integrali
  const Tc = bh.cycle * (0.85 + 0.3 * r()), duty = bh.duty;
  const mfun = (u: number) => (duty >= 1 ? 1 : u >= duty ? 0 : smooth(u / 0.12) * smooth((duty - u) / 0.12));
  const N = 256, cyc = new Float64Array(N + 1);
  for (let i = 1; i <= N; i++) cyc[i] = cyc[i - 1] + ((mfun((i - 0.5) / N) * 1)) / N;
  const Mc = cyc[N];                   // 1 döngüdeki ortalama hareket (0..1)
  const bodyLen = 2 * o.ext.hx;
  const perim = Math.PI * (3 * (ax + az) - Math.sqrt((3 * ax + az) * (ax + 3 * az))) * (1 + 0.6 * E * E);
  const K = Math.max(1, Math.round(perim / Math.max(1e-6, bh.bl * bodyLen * Tc * Mc)));
  const period = K * Tc;
  const Phi = (t: number) => { const c = t / Tc, n = Math.floor(c), u = (c - n) * N, i = Math.min(N - 1, Math.floor(u)); return (n * Mc + cyc[i] + (cyc[i + 1] - cyc[i]) * (u - i)) / (K * Mc); };
  const vref = perim / period;         // ortalama yol hızı (eğim hesabı için)

  const tiltRoom = o.ext.hx * Math.sin(pitchMax);
  const floorY = -H / 2 + sand + o.ext.hy + tiltRoom + 0.03;
  const ceilY = Math.max(floorY, H / 2 - SURFACE_GAP - o.ext.hy - tiltRoom);
  const lo = bottom ? 0 : bh.band[0], hi = bottom ? 0 : bh.band[1];
  const yLo = floorY + (ceilY - floorY) * lo, yHi = floorY + (ceilY - floorY) * hi;
  const py = r() * Math.PI * 2 + (bh.shoal ? rank * 1.1 : 0), wy = (Math.PI * 2) / (22 + r() * 18);
  const stepAmp = o.species === 'karides' || o.species === 'amano' ? 0.012 : 0;
  const yAt = (t: number, ph: number) => (bottom ? floorY + 0.02 + stepAmp * Math.abs(Math.sin(ph * 90)) : (yLo + yHi) / 2 + ((yHi - yLo) / 2) * Math.sin(wy * t + py));
  const dAt = (a: number) => ({ vx: dir * ax * (Math.cos(a) + 2 * E * Math.cos(2 * a + psi)), vz: -dir * az * (Math.sin(a) + 2 * E * Math.sin(2 * a + psi)) });

  return {
    period, floorY, ceilY, yRange: bottom ? [floorY + 0.02, floorY + 0.02 + stepAmp] : [yLo, yHi],
    pose(t: number): Pose {
      const ph = Phi(t), a = phase + dir * Math.PI * 2 * ph;
      const x = cx + ax * (Math.sin(a) + E * Math.sin(2 * a + psi));
      const z = cz + az * (Math.cos(a) + E * Math.cos(2 * a + psi));
      const { vx, vz } = dAt(a);          // yön yalnızca yolun geometrisinden gelir: duruşta değişmez
      const y = yAt(t, ph);
      let pitch = 0;
      if (!bottom) {
        const eps = 0.25, rate = Math.abs(Phi(t + eps) - Phi(t - eps)) / (2 * eps) * Math.PI * 2;  // rad/sn
        const hs = Math.max(Math.hypot(vx, vz) * rate, 0.3 * vref);
        const vy = ((yHi - yLo) / 2) * wy * Math.cos(wy * t + py);
        pitch = clamp(Math.atan2(vy, hs), -pitchMax, pitchMax);
      }
      return { x, y, z, yaw: Math.atan2(-vz, vx), pitch };
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
