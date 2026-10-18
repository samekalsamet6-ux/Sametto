// Pleko / Ancistrus (bristlenose, "L144" tüccar kodu dahil) 3B modeli için SAF geometri parametreleri (şematik).
// Üstten basık (dorsoventral yassı) gövde: geniş baş, düz karın, kemikli plakalar, alt yüzde vantuz ağız.
// Koordinatlar: bkz. ../akvaryum/fishmath.ts (gövde uzunluğu 1; burun -x; y yukarı; z yan).
import { bodyOutline, finOutline, lerp, lineOnBody, makeBody, norm3, spline, surfaceAt, type Body, type FinDef, type Silhouette, type Vec3 } from '../akvaryum/fishmath';
import type { SexId } from '../akvaryum/types';

export type Sex = SexId;
export const SEXES: readonly Sex[] = ['erkek', 'disi'];

/** Gövde: üstten basık; erkekte baş biraz geniş, dişide karın/orta gövde daha dolgun */
export function bodyFor(sex: Sex): Body {
  const m = sex === 'erkek', f = !m;
  const hb = m ? 1.07 : 1, wb = f ? 1.13 : 1;
  // geniş, yassı ve uzun baş (gövde boyunun ~%28'i), dorsal yüzgeç kökünde yüksek tepe, düz karın, ince ve uzun kuyruk sapı
  return makeBody(1, {
    top: spline([[0, 0.0], [0.06, 0.034], [0.14, 0.068], [0.24, 0.098], [0.34, 0.124], [0.42, 0.122], [0.55, 0.1], [0.7, 0.066], [0.85, 0.042], [1, 0.03]]),
    bot: spline([[0, -0.012], [0.06, -0.04], [0.14, -0.05], [0.3, -0.056], [0.45, f ? -0.062 : -0.054], [0.6, f ? -0.054 : -0.044], [0.85, -0.026], [1, -0.02]]),
    hw: spline([[0, 0.02], [0.04, 0.078 * hb], [0.1, 0.124 * hb], [0.2, 0.146 * hb], [0.28, 0.15 * hb], [0.36, 0.135 * wb], [0.5, 0.105 * wb], [0.65, 0.078 * wb], [0.82, 0.05], [1, 0.032]]),
    nTop: spline([[0, 2], [0.1, 3], [0.25, 2.8], [0.4, 2.3], [1, 2.1]]),
    nBot: spline([[0, 2], [0.1, 3.8], [0.5, 4], [1, 2.8]]),
    nose: 0.07,
  });
}

export const EYE = { s: 0.152, phi: 0.5, radius: 0.024 } as const;
export const OPERCULUM = { s: 0.272, phi0: 0.4, phi1: 2.3 } as const;
/** Kemikli plakalar: dört sıra (sırt, üst yan, alt yan, karın yanı), gövdenin arka bölümünde */
export const ARMOR = { s0: 0.28, s1: 0.97, plates: 34, rows: 4 } as const;

/** Tül (uzun yüzgeç) biçimi için yüzgeç büyütme çarpanları (1 = standart). Şekil (form) seçicisinden gelir; renkten bağımsızdır. */
export const TUL_GAIN = { dorsal: 1.7, caudal: 2.6, pectoral: 1.6, pelvic: 1.45, anal: 1.45 } as const;
export const fin = (base: number, gain: number, tul: number): number => base * (1 + (gain - 1) * Math.max(0, Math.min(1, tul)));

export function eyeSpec(sex: Sex): { center: Vec3; normal: Vec3; radius: number } {
  const b = bodyFor(sex), r = EYE.radius;
  const sf = surfaceAt(b, EYE.s, EYE.phi, -r * 0.5);
  return { center: sf.pos, normal: norm3([sf.normal[0] - 0.08, sf.normal[1] + 0.45, sf.normal[2] * 0.8]), radius: r };
}

export function operculumArc(sex: Sex, side: 1 | -1, n = 14): Vec3[] {
  const b = bodyFor(sex), out: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const p = surfaceAt(b, OPERCULUM.s + 0.03 * Math.sin(t * Math.PI) - 0.012 * t, lerp(OPERCULUM.phi0, OPERCULUM.phi1, t), 0.0015).pos;
    out.push([p[0], p[1], p[2] * side]);
  }
  return out;
}

// ------------------------------------------------------------------ vantuz ağız

export interface MouthSpec { c: Vec3; rx: number; rz: number; /** Disk ortasının dış halkaya göre YUKARI çökmesi (negatif = çukur/tabak biçimli): viewer disk geometrisi bulge'u aşağı şişirir */ bulge: number; /** Dış dudak halkasının gövde altından aşağı çıkıntısı */ lip: number }
/** Baş altında oval emici (vantuz) ağız diski: dış dudak halkası gövde altına doğru çıkıntılı, iç kısım hafif çukur (tabak). Dış sınır gövde genişliğini aşmaz. */
export function mouthSpec(sex: Sex): MouthSpec {
  const b = bodyFor(sex), sec = b.section(0.115);
  return { c: [sec.x, sec.yBot, 0], rx: 0.088, rz: Math.min(0.118, sec.hw * 0.86), bulge: -0.006, lip: 0.0075 };
}
/** Dış dudak halkasının (k = 1) y konumu: gövde altından `lip` kadar aşağı çıkıntılı (düz) halka */
function rimY(sex: Sex, _a: number): number {
  const m = mouthSpec(sex);
  return m.c[1] - 0.001 - m.lip;
}
/** Diskin y yüksekliği: k = 1 dış halka (çıkıntılı dudak), k = 0 merkez (çukurun tabanı, gövde altına yakın) */
export function mouthDiscY(sex: Sex, k: number, a = 0): number {
  return rimY(sex, a) - mouthSpec(sex).bulge * (1 - k * k);
}
/** Disk sınırı (kapalı halka); k < 1 ile iç halka. z, o x'teki gövde yarı genişliğiyle sınırlanır. İç halkalar çukur yüzeyin üstünde yer alır. */
export function mouthRing(sex: Sex, k = 1, n = 32): Vec3[] {
  const b = bodyFor(sex), m = mouthSpec(sex), out: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    const a = -(i / n) * Math.PI * 2; // saat yönünün tersi: viewer disk üçgenlerinin yüzü AŞAĞI (alttan görünür) bakar
    const x = m.c[0] + Math.cos(a) * m.rx * k;
    const hw = b.section(Math.max(0.004, x + 0.5)).hw;
    const z = Math.max(-hw * 0.82, Math.min(hw * 0.82, Math.sin(a) * m.rz * k));
    out.push([x, mouthDiscY(sex, k, a), z]);
  }
  return out;
}
const discAt = (sex: Sex, x: number, z: number): number => {
  const m = mouthSpec(sex), u = (x - m.c[0]) / m.rx, v = z / m.rz;
  return mouthDiscY(sex, Math.min(0.97, Math.hypot(u, v)), Math.atan2(v, u));
};
/** Ağız yarığı: ön yarıda enine hafif kavisli çizgi (üst ve alt çene arasında), çukur yüzeyin üstünde */
export function mouthSlit(sex: Sex, n = 9): Vec3[] {
  const m = mouthSpec(sex), out: Vec3[] = [];
  for (let i = 0; i < n; i++) { const t = i / (n - 1) * 2 - 1, x = m.c[0] - 0.012 + 0.012 * t * t, z = t * m.rz * 0.62; out.push([x, discAt(sex, x, z) - 0.0012, z]); }
  return out;
}
/** Alt dudak üzerindeki küçük sivilceler (papiller): arka yarıda iki sıra */
export function mouthPapillae(sex: Sex): Vec3[] {
  const m = mouthSpec(sex), out: Vec3[] = [];
  for (let row = 0; row < 2; row++) for (let i = 0; i < 9; i++) {
    const t = (i / 8) * 2 - 1;
    const x = m.c[0] + 0.012 + row * 0.014 + 0.01 * t * t, z = t * m.rz * (0.62 - 0.1 * row);
    out.push([x, discAt(sex, x, z) - 0.0008, z]);
  }
  return out;
}

// ------------------------------------------------------------------ bristle (burun tentaklleri)

export interface Bristle { stalk: Vec3[]; radii: number[]; branches: { path: Vec3[]; radii: number[] }[] }

/** +z yanı için bristle'lar. Erkek: burun kenarında iki geriye uzanan sırada büyük, dallı tentaklar; dişi: yalnızca birkaç kısa, dalsız çıkıntı */
export function bristles(sex: Sex): Bristle[] {
  const b = bodyFor(sex), out: Bristle[] = [];
  const male = sex === 'erkek';
  const spots: [number, number, number][] = male
    ? [[0.012, 0.95, 1], [0.03, 1.1, 0.95], [0.052, 1.18, 0.85], [0.075, 1.22, 0.7], [0.1, 1.22, 0.55], [0.035, 0.62, 0.7], [0.065, 0.7, 0.62], [0.095, 0.76, 0.5]]
    : [[0.014, 1.02, 1], [0.034, 1.13, 1]];
  for (const [s, phi, k] of spots) {
    const sf = surfaceAt(b, s, phi, -0.002);
    const n = sf.normal;
    const L = male ? 0.092 * k : 0.014;
    const d = norm3([-0.9, 0.25 + 0.15 * (n[1] > 0.3 ? 1 : 0), n[2] * 0.7 + 0.15]);
    const p0 = sf.pos;
    const at = (t: number, lift: number): Vec3 => [p0[0] + d[0] * L * t, p0[1] + d[1] * L * t + lift * L, p0[2] + d[2] * L * t];
    const stalk = [at(0, 0), at(0.35, 0.05), at(0.7, 0.1), at(1, 0.07)];
    const radii = male ? [0.011 * (0.6 + 0.4 * k), 0.0078, 0.0055, 0.004] : [0.0055, 0.0042, 0.0026];
    const branches: Bristle['branches'] = [];
    if (male) {
      const e = stalk[3], e2 = stalk[2];
      for (const sgn of [-1, 1]) {
        branches.push({
          path: [e2, [e[0] + d[0] * L * 0.1, e[1] + L * 0.1, e[2] + sgn * L * 0.16], [e[0] - L * 0.3, e[1] + L * 0.12, e[2] + sgn * L * 0.3]],
          radii: [0.0035, 0.0026, 0.0014],
        });
      }
      branches.push({ path: [e, [e[0] - L * 0.2, e[1] + L * 0.06, e[2]], [e[0] - L * 0.38, e[1] + L * 0.08, e[2] + 0.002]], radii: [0.003, 0.002, 0.0012] });
    }
    out.push({ stalk: female(stalk, male), radii: male ? radii : radii.slice(0, 3), branches });
  }
  return out;
}
const female = (p: Vec3[], male: boolean): Vec3[] => (male ? p : p.slice(0, 3));

// ------------------------------------------------------------------ yüzgeçler

/** tul: 0 = standart, 1 = tül (uzun yüzgeç) */
export function finsFor(sex: Sex, tul = 0): FinDef[] {
  const b = bodyFor(sex), fins: FinDef[] = [];
  const dH = fin(0.25, TUL_GAIN.dorsal, tul);
  // sırt yüzgeci: yüksek, yelken benzeri; ilk ışın (diken) en uzun, arkaya doğru alçalır
  const dB = lineOnBody(b, 0.31, 0.5, 0, 10, 0.014);
  fins.push({ id: 'sirt', paired: false, flex: 0.3, base: dB, tip: dB.map((p, i): Vec3 => { const u = i / 9; return [p[0] + dH * (0.3 + 0.42 * u) * (1 + 0.1 * tul * u), p[1] + dH * (1 - 0.6 * Math.pow(u, 1.2)), 0]; }) });
  // yağ yüzgeci: küçük, önünde diken
  const aB = lineOnBody(b, 0.69, 0.77, 0, 5, 0.01);
  fins.push({ id: 'yag', paired: false, flex: 0.2, base: aB, tip: aB.map((p, i): Vec3 => { const u = i / 4; return [p[0] + 0.03 + 0.018 * u, p[1] + 0.052 * (1 - 0.55 * u), 0]; }) });
  // anal yüzgeç
  const nH = fin(0.075, TUL_GAIN.anal, tul);
  const nB = lineOnBody(b, 0.62, 0.69, Math.PI, 5, 0.01);
  fins.push({ id: 'anal', paired: false, flex: 0.35, base: nB, tip: nB.map((p, i): Vec3 => { const u = i / 4; return [p[0] + nH * (0.35 + 0.35 * u), p[1] - nH * (1 - 0.35 * u), 0]; }) });
  // kuyruk yüzgeci: hafif çatallı, uçları sivri iki lob
  const sec = b.section(1), cy = (sec.yTop + sec.yBot) / 2, N = 11;
  const cL = fin(0.19, TUL_GAIN.caudal, tul);
  const cB: Vec3[] = [];
  for (let i = 0; i < N; i++) cB.push([sec.x - 0.004, lerp(sec.yTop - 0.004, sec.yBot + 0.004, i / (N - 1)), 0]);
  fins.push({ id: 'kuyruk', paired: false, flex: 0.9, base: cB, tip: cB.map((p, i): Vec3 => { const v = Math.abs((2 * i) / (N - 1) - 1); return [p[0] + cL * (0.74 + 0.26 * Math.pow(v, 1.4)), cy + (p[1] - cy) * (1.9 + 2.0 * Math.pow(v, 0.8)), 0]; }) });
  // karın (pelvik) yüzgeçleri: geniş, yatay, dışa ve geriye açılan yelpaze
  const vL = fin(0.12, TUL_GAIN.pelvic, tul);
  const vB = [0.42, 0.44, 0.46, 0.48, 0.5].map((s) => { const q = surfaceAt(b, s, Math.PI * 0.8, -0.006).pos; return [q[0], q[1] + 0.004, q[2]] as Vec3; });
  fins.push({ id: 'karin', paired: true, flex: 0.45, base: vB, tip: vB.map((p, i): Vec3 => { const u = i / 4, l = vL * (1 - 0.35 * u), a = 0.5 + 0.7 * u; return [p[0] + Math.sin(a) * l, p[1] + 0.004 - 0.018 * u, p[2] + Math.cos(a) * l]; }) });
  // göğüs (pektoral) yüzgeçleri: büyük, dışa açılan; ön kenarda kalın diken
  const gL = fin(0.19, TUL_GAIN.pectoral, tul);
  const gB = [0.272, 0.287, 0.302, 0.317, 0.332, 0.347].map((s) => { const q = surfaceAt(b, s, Math.PI * 0.62, -0.008).pos; return [q[0], q[1] + 0.003, q[2]] as Vec3; });
  fins.push({ id: 'gogus', paired: true, flex: 0.7, base: gB, tip: gB.map((p, i): Vec3 => { const u = i / 5, l = gL * (1 - 0.42 * Math.pow(u, 1.1)), a = 0.6 + 0.85 * u; return [p[0] + Math.sin(a) * l, p[1] + 0.012 * (1 - u) - 0.008 * u, p[2] + Math.cos(a) * l * 0.95]; }) });
  return fins;
}

/** Diken yolları: sırt (ilk ışın), yağ ve göğüs yüzgeçlerinin ön kenarı */
export function spines(sex: Sex, tul = 0): { id: string; path: Vec3[]; r: number; paired: boolean }[] {
  const f = finsFor(sex, tul), pick = (id: string) => f.find((x) => x.id === id)!;
  const mix = (a: Vec3, c: Vec3, t: number): Vec3 => [lerp(a[0], c[0], t), lerp(a[1], c[1], t), lerp(a[2], c[2], t)];
  const d = pick('sirt'), a = pick('yag'), p = pick('gogus');
  return [
    { id: 'sirt', path: [mix(d.base[0], d.tip[0], 0), mix(d.base[0], d.tip[0], 0.5), mix(d.base[0], d.tip[0], 1)], r: 0.006, paired: false },
    { id: 'yag', path: [mix(a.base[0], a.tip[0], 0), mix(a.base[0], a.tip[0], 0.6), mix(a.base[0], a.tip[0], 1.08)], r: 0.0034, paired: false },
    { id: 'gogus', path: [mix(p.base[0], p.tip[0], 0), mix(p.base[0], p.tip[0], 0.5), mix(p.base[0], p.tip[0], 1.02)], r: 0.0085, paired: true },
  ];
}

export function silhouette(sex: Sex, tul = 0): Silhouette {
  const e = eyeSpec(sex);
  return { body: bodyOutline(bodyFor(sex), 40), fins: finsFor(sex, tul).filter((f) => f.id !== 'gogus' && f.id !== 'karin').map((f) => ({ id: f.id, pts: finOutline(f) })), eye: { c: [e.center[0], e.center[1]], r: e.radius } };
}
