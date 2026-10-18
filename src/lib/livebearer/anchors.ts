// Anatomi parçalarının model üzerindeki bağlantı noktaları (ortak, saf veri).
import type { LbModel, Sex, Vec3 } from './model';

export type PartId =
  | 'agiz' | 'goz' | 'solungac-kapagi' | 'yan-cizgi' | 'pul' | 'gogus-yuzgeci' | 'karin-yuzgeci'
  | 'sirt-yuzgeci' | 'anal-yuzgec' | 'gonopodium' | 'kuyruk-sapi' | 'kuyruk-yuzgeci' | 'gravid-spot' | 'kilic';
export type ViewId = 'yan' | 'ust' | 'on' | 'arka' | 'alt' | 'capraz';

export interface Part {
  id: PartId; ad: string; ozet: string; aciklama: string;
  sex?: Sex; wiki?: string; dogrulanmali?: boolean; uyari?: boolean; view: ViewId;
}

export interface Anchor {
  pos: Vec3;
  /** Yüzeye dik yön; null = yüzgeç gibi iki yandan da görünür */
  normal: Vec3 | null;
  /** z işareti çevrilerek kameranın bulunduğu yana yansıtılabilir */
  mirror: boolean;
}

const mid = (r: Vec3[], u: number): Vec3 => r[Math.round((r.length - 1) * u)];

export function makeAnchors(M: LbModel) {
  function surf(sex: Sex, t: number, a: number): Anchor {
    const p = M.bodySurfacePoint(sex, t, a, 0.02);
    const bottom = M.bodySurfacePoint(sex, t, 0)[1], top = M.bodySurfacePoint(sex, t, Math.PI)[1];
    const dy = p[1] - (bottom + top) / 2;
    const l = Math.hypot(dy, p[2]) || 1;
    return { pos: p, normal: [0, dy / l, p[2] / l], mirror: true };
  }
  return function partAnchors(sex: Sex): Partial<Record<PartId, Anchor>> {
    const eye = M.eyeSpec(sex), R = eye.radius;
    const out: Partial<Record<PartId, Anchor>> = {};
    out.agiz = { pos: M.bodySurfacePoint(sex, 0.012, 1.4, 0.02), normal: [-0.6, 0, 0.8], mirror: true };
    out.goz = { pos: [eye.center[0] + eye.normal[0] * R, eye.center[1] + eye.normal[1] * R, eye.center[2] + eye.normal[2] * R], normal: eye.normal, mirror: true };
    out['solungac-kapagi'] = surf(sex, 0.255, 1.75);
    out['yan-cizgi'] = surf(sex, 0.66, Math.PI / 2);
    out.pul = surf(sex, 0.5, 1.2);
    out['gogus-yuzgeci'] = { pos: mid(M.pectoralFin(sex, 1).rays[4], 0.7), normal: null, mirror: true };
    out['karin-yuzgeci'] = { pos: mid(M.pelvicFin(sex, 1).rays[2], 0.8), normal: null, mirror: true };
    const d = M.dorsalFin(sex);
    out['sirt-yuzgeci'] = { pos: mid(d.rays[Math.floor(d.rays.length * 0.65)], 0.8), normal: null, mirror: false };
    const anal = M.analFin(sex);
    if (anal) out['anal-yuzgec'] = { pos: mid(anal.rays[3], 0.8), normal: null, mirror: false };
    const g = M.gonopodium(sex);
    if (g) out.gonopodium = { pos: [g.path[3][0], g.path[3][1] - 0.02, 0], normal: null, mirror: false };
    out['kuyruk-sapi'] = surf(sex, 0.9, Math.PI / 2);
    const tail = M.tailFin(sex);
    out['kuyruk-yuzgeci'] = { pos: mid(tail.rays[Math.round(tail.rays.length * 0.72)], 0.8), normal: null, mirror: false };
    if (M.TAIL[sex].sword) { const r = tail.rays[0]; out.kilic = { pos: r[Math.round((r.length - 1) * 0.9)], normal: null, mirror: false }; }
    if (sex === 'disi') out['gravid-spot'] = surf(sex, 0.6, 0.78);
    return out;
  };
}
