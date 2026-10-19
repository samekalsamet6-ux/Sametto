// Amano karidesi (Caridina multidentata) renk varyeteleri: tanınan yetiştirme renk hattı YOKTUR; yalnızca doğal görünüm vardır.
// Cinsiyet farkı (erkekte yuvarlak benekler, dişide uzamış çizgi/tireler) renk varyetesi değil cinsiyet ekseninde (texture.ts) gösterilir.
import type { Variant } from '../karides/variants';

export const VARIANT_GROUPS = ['Doğal görünüm'] as const;

export const VARIANTS: Variant[] = [
  { id: 'dogal', grup: VARIANT_GROUPS[0], ad: 'Doğal görünüm (tek renk)', dogrulanmali: false,
    renk: { sirt: '#6a7862', yan: '#9fab97', karin: '#d2d8c6', bacak: '#c3ccb9' }, goz: '#14110d', stil: 'duz', parlak: 0.5, yumurta: '#6f7f4f',
    aciklama: 'Yarı saydam gri-yeşil gövde, yanlarda kırmızımsı-kahverengi benek/çizgi sırası ve sırtta ince açık çizgi. Akvaryum ticaretinde yerleşmiş ayrı bir renk hattı bilinmediği için tek görünüm gösterilir; saydamlık bu modelde opak çizilir (şematik).' },
];

export const groupedVariants = () => [{ grup: VARIANT_GROUPS[0], items: VARIANTS }];
export const variantById = (id: string): Variant => VARIANTS.find((v) => v.id === id) ?? VARIANTS[0];
