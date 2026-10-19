import raw from './catalog.json' with { type: 'json' };

export interface CatSex { id: string; ad: string }
export interface CatItem { id: string; ad: string; grup: string; dogrulanmali?: boolean }
/** Şekil/renk adı kaynaklarda tutarsızsa kullanıcıya gösterilen ek. */
export const UNVERIFIED_NOTE = '(adı kaynaklarda tutarsız / doğrulanmalı)';
export const itemLabel = (x: CatItem): string => (x.dogrulanmali ? `${x.ad} ${UNVERIFIED_NOTE}` : x.ad);
export interface CatSpecies {
  id: string; ad: string; latin: string; kisaAciklama: string; not: string;
  sexes: CatSex[]; views: { id: string; ad: string }[]; forms: CatItem[]; variants: CatItem[];
}
export const OTHER_ID = 'diger';
export const CATALOG = raw as CatSpecies[];
export const speciesById = (id: string): CatSpecies | undefined => CATALOG.find((s) => s.id === id);
/** Cinsiyet seçenekleri: türün sunduğu + her zaman 'bilinmiyor'. 'diğer' için erkek/dişi/bilinmiyor. */
export const UNKNOWN_SEX = 'bilinmiyor';
/** Tek cinsiyet seçeneği 'Ayrım yok' olan tür (melek, diskus): modelde kimliği 'disi' olsa da ilan/akvaryum verisinde 'bilinmiyor' saklanır. */
export function noSexSplit(speciesId: string): boolean {
  const s = speciesById(speciesId);
  return !!s && s.sexes.length === 1 && /ayrım yok/i.test(s.sexes[0].ad);
}
export const NO_SPLIT_LABEL = 'Ayrım yok';
export function sexOptions(speciesId: string): CatSex[] {
  if (noSexSplit(speciesId)) return [{ id: UNKNOWN_SEX, ad: NO_SPLIT_LABEL }];
  const s = speciesById(speciesId);
  const base = s ? s.sexes : [{ id: 'erkek', ad: 'Erkek' }, { id: 'disi', ad: 'Dişi' }];
  return [...base, { id: UNKNOWN_SEX, ad: 'Bilinmiyor / karışık' }];
}
/** Akvaryum için seçenekler ('bilinmiyor' yok; 'ayrım yok' türlerinde tek seçenek 'bilinmiyor' = Ayrım yok). */
export function fishSexOptions(speciesId: string): CatSex[] {
  if (noSexSplit(speciesId)) return [{ id: UNKNOWN_SEX, ad: NO_SPLIT_LABEL }];
  return speciesById(speciesId)?.sexes ?? [];
}
/** Saklanan cinsiyeti 3B modelin bildiği gerçek kimliğe çevirir (ör. melek 'bilinmiyor' -> 'disi'). */
export function modelSex(speciesId: string, sex: string): string {
  const s = speciesById(speciesId);
  if (!s) return sex;
  return s.sexes.some((x) => x.id === sex) ? sex : s.sexes[0].id;
}
export function speciesLabel(speciesId: string, other?: string | null): string {
  if (speciesId === OTHER_ID) return other?.trim() || 'Diğer tür';
  return speciesById(speciesId)?.ad ?? speciesId;
}
