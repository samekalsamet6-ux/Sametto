// Kılıçkuyruk form (şekil) varyetesi: ortak livebearer/forms.ts yamaları + Türkçe açıklamalar + forma özgü parça metinleri (saf veri).
// Not: "wagtail", "tuxedo", "koi", "pineapple" renk/desen adlarıdır, şekil değildir; bu yüzden form listesinde yoktur.
// Kılıç erkeğin ayrı bir "formu" değil cinsel dimorfizmdir: her formda erkeğin kılıcı vardır, dişide yoktur.
import { makeFormKit, type LbFormPatch } from '../livebearer/forms';
import type { PartId } from '../livebearer/anchors';
import { CONFIG } from './model';

export interface KilickuyrukForm { id: string; ad: string; aciklama: string; grup: string; dogrulanmali?: boolean }

export const FORMS: KilickuyrukForm[] = [
  { id: 'standart', ad: 'Standart (normal yüzgeç)', grup: 'Yüzgeç biçimi', aciklama: 'Doğal tipe en yakın biçim: yelpaze biçimli kuyruk, kısa sırt yüzgeci; erkekte kuyruk yüzgecinin alt kenarı uzun bir kılıca uzar, dişide kılıç yoktur.' },
  { id: 'hifin', ad: 'Hifin (yüksek sırt yüzgeci)', grup: 'Yüzgeç biçimi', aciklama: 'Sırt yüzgeci standartın birkaç katı yüksek ve geniştir (“hi-fin”). Ticari kılıçkuyruk ıslahında kabul görmüş yüzgeç biçimlerinden biridir; erkekte kılıç korunur.' },
  { id: 'lyretail', ad: 'Lyretail (lira kuyruk)', grup: 'Yüzgeç biçimi', aciklama: 'Kuyruk yüzgecinin üst ve alt dış ışınları uzar, ortası içeri çekilir (lira biçimi); erkekte alt uzantı kılıcı andırır. Ticarette yaygın bir biçimdir; dişide uzantılar daha kısadır.' },
  { id: 'simpson', ad: 'Simpson hifin lyretail', grup: 'Yüzgeç biçimi', dogrulanmali: true, aciklama: 'Yüksek sırt yüzgeci ile belirgin lira kuyruğu birleştiren “Simpson’s hi-fin lyretail” ticari hattı; uzantılar her iki cinsiyette de görülür. Hat adı ve tam ölçüleri satıcıya göre değişir; kaynakla doğrulanmalı.' },
  { id: 'delta', ad: 'Hifin delta', grup: 'Yüzgeç biçimi', dogrulanmali: true, aciklama: 'Yüksek sırt yüzgeci ve geniş, üçgen (delta) kuyruk. Islah kılavuzlarında “hi-fin delta” olarak geçer; ayrıntılı standart bulunmadığından görünümü kaynakla doğrulanmalı.' },
];

export const PATCHES: Record<string, LbFormPatch | undefined> = {
  standart: {},
  hifin: {
    dorsal: (_d, sex) => (sex === 'erkek'
      ? { t0: 0.35, t1: 0.6, rays: 18, phiFront: 92, phiRear: 48, lenFront: 0.9, lenRear: 1.3 }
      : { t0: 0.38, t1: 0.58, rays: 14, phiFront: 86, phiRear: 52, lenFront: 0.72, lenRear: 1.0 }),
  },
  lyretail: {
    tail: (t, sex) => ({ lyre: sex === 'erkek' ? 0.55 : 0.4, fork: 0.22, reach: t.reach * 1.08, halfAngle: t.halfAngle + 5, round: 0.8, ...(sex === 'erkek' ? { sword: 1.35 } : {}) }),
  },
  simpson: {
    dorsal: (_d, sex) => (sex === 'erkek'
      ? { t0: 0.36, t1: 0.6, rays: 17, phiFront: 90, phiRear: 48, lenFront: 0.8, lenRear: 1.2 }
      : { t0: 0.39, t1: 0.58, rays: 13, phiFront: 84, phiRear: 52, lenFront: 0.66, lenRear: 0.92 }),
    tail: (t, sex) => ({ lyre: sex === 'erkek' ? 0.75 : 0.55, fork: 0.28, reach: t.reach * 1.2, halfAngle: t.halfAngle + 8, round: 0.85, ...(sex === 'erkek' ? { sword: 1.4 } : {}) }),
  },
  delta: {
    dorsal: (_d, sex) => (sex === 'erkek'
      ? { t0: 0.36, t1: 0.6, rays: 16, phiFront: 90, phiRear: 48, lenFront: 0.82, lenRear: 1.18 }
      : { t0: 0.39, t1: 0.58, rays: 13, phiFront: 84, phiRear: 52, lenFront: 0.68, lenRear: 0.95 }),
    tail: (t, sex) => ({ reach: t.reach * 1.25, halfAngle: t.halfAngle + 14, round: 0.1, bulge: 0.02, ...(sex === 'erkek' ? { sword: 1.25 } : {}) }),
  },
};

export const kit = makeFormKit(CONFIG, PATCHES);
export const formById = (id?: string): KilickuyrukForm => FORMS.find((f) => f.id === id) ?? FORMS[0];

export const PART_OVERRIDES: Record<string, Partial<Record<PartId, { ozet?: string; aciklama?: string }>>> = {
  hifin: {
    'sirt-yuzgeci': { ozet: 'Standartın birkaç katı yüksek sırt yüzgeci.', aciklama: 'Hifin kılıçkuyrukta sırt yüzgeci standart formdan çok daha yüksek ve geniştir; erkekte daha gösterişli, dişide biraz daha alçaktır. Uzun yüzgeçler kötü su koşullarında ve kavgada daha kolay zarar görür.' },
  },
  lyretail: {
    'kuyruk-yuzgeci': { ozet: 'Üst ve alt uçları uzamış, ortası çatallı lira kuyruk.', aciklama: 'Lyretail kılıçkuyrukta kuyruğun üst ve alt dış ışınları uzar, ortası içeri çekilir. Erkekte alt uzantı kılıçla birleşir; uzun uçlar kolay yırtılır.' },
  },
  simpson: {
    'kuyruk-yuzgeci': { ozet: 'Belirgin lira uçlu geniş kuyruk (Simpson hattı).', aciklama: 'Simpson hifin lyretail hattında kuyruğun üst ve alt uzantıları her iki cinsiyette de görülür (kaynakla doğrulanmalı). Uzun yüzgeç ve uzantılar kuyruk çürümesi ile karıştırılmamalıdır; kenarlarda aşınma izlenmelidir.' },
    'sirt-yuzgeci': { ozet: 'Yüksek sırt yüzgeci.', aciklama: 'Bu hatta sırt yüzgeci de standarttan belirgin biçimde yüksektir (hi-fin).' },
  },
  delta: {
    'kuyruk-yuzgeci': { ozet: 'Geniş, üçgen (delta) kuyruk yüzgeci.', aciklama: 'Delta kuyruk, standart yelpazeden daha geniş açılan düz kenarlı üçgen bir kuyruktur. Erkekte kılıç alt kenardan devam eder (kaynakla doğrulanmalı).' },
    'sirt-yuzgeci': { ozet: 'Yüksek sırt yüzgeci.', aciklama: 'Hifin delta formunda sırt yüzgeci yüksektir.' },
  },
};
