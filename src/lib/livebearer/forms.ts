// Canlı doğuran balıklar için form (şekil) varyetesi: ortak, SAF parametrik yama sistemi.
// Her form, türün temel LbConfig'ine uygulanan bir yamadır (gövde/kuyruk/sırt/anal/gonopodium sayıları); böylece her form her renkle birleşir.
import { createModel, type BodyParams, type DorsalSpec, type LbConfig, type LbModel, type Sex, type TailSpec } from './model';
import { makeAnchors } from './anchors';

export interface LbFormPatch {
  body?: (b: BodyParams, sex: Sex) => Partial<BodyParams>;
  tail?: (t: TailSpec, sex: Sex) => Partial<TailSpec>;
  dorsal?: (d: DorsalSpec, sex: Sex) => Partial<DorsalSpec>;
  anal?: Partial<LbConfig['anal']>;
  /** Çarpanlar */
  gono?: number;
  paired?: number;
}

export function applyForm(cfg: LbConfig, patch: LbFormPatch | undefined): LbConfig {
  if (!patch) return cfg;
  const sexes: Sex[] = ['erkek', 'disi'];
  const mapBy = <T extends object>(src: Record<Sex, T>, f?: (v: T, s: Sex) => Partial<T>): Record<Sex, T> =>
    Object.fromEntries(sexes.map((s) => [s, f ? { ...src[s], ...f(src[s], s) } : src[s]])) as Record<Sex, T>;
  return {
    body: mapBy(cfg.body, patch.body),
    tail: mapBy(cfg.tail, patch.tail),
    dorsal: mapBy(cfg.dorsal, patch.dorsal),
    anal: { ...cfg.anal, ...patch.anal },
    gono: cfg.gono * (patch.gono ?? 1),
    paired: cfg.paired * (patch.paired ?? 1),
  };
}

/** Bir türün formlarını tembel ve önbellekli olarak kurar. */
export function makeFormKit(base: LbConfig, patches: Record<string, LbFormPatch | undefined>, standard = 'standart') {
  const models = new Map<string, LbModel>();
  const anchors = new Map<string, ReturnType<typeof makeAnchors>>();
  const resolve = (id?: string) => (id && id in patches ? id : standard);
  const modelFor = (id?: string): LbModel => {
    const k = resolve(id);
    let m = models.get(k);
    if (!m) { m = createModel(applyForm(base, patches[k])); models.set(k, m); }
    return m;
  };
  const anchorsFor = (id?: string) => {
    const k = resolve(id);
    let a = anchors.get(k);
    if (!a) { a = makeAnchors(modelFor(k)); anchors.set(k, a); }
    return a;
  };
  return { modelFor, anchorsFor, resolve, ids: Object.keys(patches) };
}
