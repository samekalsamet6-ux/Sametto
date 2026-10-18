import raw from './catalog.json' with { type: 'json' };

export interface CatSex { id: string; ad: string }
export interface CatItem { id: string; ad: string; grup: string }
export interface CatSpecies {
  id: string; ad: string; latin: string; kisaAciklama: string; not: string;
  sexes: CatSex[]; views: { id: string; ad: string }[]; forms: CatItem[]; variants: CatItem[];
}
export const OTHER_ID = 'diger';
export const CATALOG = raw as CatSpecies[];
export const speciesById = (id: string): CatSpecies | undefined => CATALOG.find((s) => s.id === id);
/** Cinsiyet seçenekleri: türün sunduğu + her zaman 'bilinmiyor'. 'diğer' için erkek/dişi/bilinmiyor. */
export const UNKNOWN_SEX = 'bilinmiyor';
export function sexOptions(speciesId: string): CatSex[] {
  const s = speciesById(speciesId);
  const base = s ? s.sexes : [{ id: 'erkek', ad: 'Erkek' }, { id: 'disi', ad: 'Dişi' }];
  return [...base, { id: UNKNOWN_SEX, ad: 'Bilinmiyor / karışık' }];
}
export function speciesLabel(speciesId: string, other?: string | null): string {
  if (speciesId === OTHER_ID) return other?.trim() || 'Diğer tür';
  return speciesById(speciesId)?.ad ?? speciesId;
}
