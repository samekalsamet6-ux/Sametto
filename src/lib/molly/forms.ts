// Molly form (şekil) varyetesi: ortak livebearer/forms.ts yamaları + Türkçe açıklamalar + forma özgü parça metinleri (saf veri).
import { makeFormKit, type LbFormPatch } from '../livebearer/forms';
import type { PartId } from '../livebearer/anchors';
import { CONFIG } from './model';

export interface MollyForm { id: string; ad: string; aciklama: string; grup: string; dogrulanmali?: boolean }

export const FORMS: MollyForm[] = [
  { id: 'standart', ad: 'Standart', grup: 'Yüzgeç biçimi', aciklama: 'Yuvarlak (kürek biçimli) kuyruk, gövdeye göre geniş ama yelken olmayan sırt yüzgeci; vahşi tipe en yakın biçim.' },
  { id: 'sailfin', ad: 'Sailfin (yelken)', grup: 'Yüzgeç biçimi', aciklama: 'Çok geniş, yüksek, yelken benzeri sırt yüzgeci; erkekte çok daha belirgin, dişide belirgin biçimde daha alçak. P. latipinna ve P. velifera\'da doğal, ticari formlarda da yaygındır.' },
  { id: 'lyretail', ad: 'Lyretail (lira kuyruk)', grup: 'Yüzgeç biçimi', aciklama: 'Kuyruk yüzgecinin üst ve alt dış ışınları uzar, ortası çatallanır; lira biçimi. Üç molly türünde de bulunur; bu uzun uçlar erkekte daha etkileyici, dişide daha kısadır (şematik).' },
  { id: 'veiltail', ad: 'Veiltail / longfin (geniş kuyruk)', grup: 'Yüzgeç biçimi', dogrulanmali: true, aciklama: 'Kuyruk yüzgeci çatallanmadan iri ve gösterişli biçimde büyür. Bazı hobi kaynakları “veiltail” der, bazıları ayrı bir form saymaz ve adlandırma satıcıya göre değişir; kaynakla doğrulanmalı.' },
  { id: 'balloon', ad: 'Balloon (balon)', grup: 'Gövde biçimi', dogrulanmali: true, aciklama: 'Kısa, yuvarlak ve şişkin gövde (karın boşluğu belirgin deforme). Hobi türüdür; bu gövde yapısı yüzme kesesi ve sindirim sorunlarıyla ve kısa ömürle ilişkilendirilir, bu yüzden refah açısından tartışmalıdır. Modeldeki biçim şematiktir.' },
];

const scale = (k: number) => (v: number) => v * k;

export const PATCHES: Record<string, LbFormPatch | undefined> = {
  standart: {},
  sailfin: {
    dorsal: (d, sex) => (sex === 'erkek'
      ? { t0: 0.3, t1: 0.63, rays: 26, phiFront: 96, phiRear: 38, lenFront: 1.05, lenRear: 1.7 }
      : { t0: 0.36, t1: 0.6, rays: 16, phiFront: 84, phiRear: 44, lenFront: 0.62, lenRear: 0.9 }),
  },
  lyretail: {
    // yuvarlak kuyruk + yalnızca en dış iki ışın uzun ince filament; ortası biraz kısa (lira): süpürülmüş hilal değil
    tail: (t, sex) => ({ lyre: 0, fork: sex === 'erkek' ? 0.1 : 0.08, fil: sex === 'erkek' ? 0.85 : 0.6, filW: 0.075, filFlat: 0.3, reach: t.reach * 0.97, halfAngle: t.halfAngle + 2, round: 1 }),
  },
  veiltail: {
    tail: (t, sex) => ({ reach: t.reach * 1.8, halfAngle: t.halfAngle - 6, bulge: t.bulge + 0.15, round: 0.5, rays: t.rays + 4 }),
  },
  balloon: {
    body: (b) => ({ length: scale(0.8)(b.length), height: scale(1.22)(b.height), width: scale(1.2)(b.width), belly: Math.max(b.belly, 0.2) + 0.3, bellyAt: 0.5, bellySpread: 0.3, peak: 0.4, peduncle: b.peduncle * 1.1, frontPow: 0.55 }),
    tail: (t) => ({ reach: t.reach * 0.85 }),
    dorsal: (d) => ({ lenFront: d.lenFront * 0.85, lenRear: d.lenRear * 0.85 }),
    paired: 0.92,
  },
};

export const kit = makeFormKit(CONFIG, PATCHES);
export const formById = (id?: string): MollyForm => FORMS.find((f) => f.id === id) ?? FORMS[0];

/** Forma özgü parça metinleri (ozet/aciklama üzerine yazar) */
export const PART_OVERRIDES: Record<string, Partial<Record<PartId, { ozet?: string; aciklama?: string }>>> = {
  sailfin: {
    'sirt-yuzgeci': { ozet: 'Çok yüksek, yelken benzeri sırt yüzgeci; erkekte belirgin.', aciklama: 'Sailfin (yelken) mollyde sırt yüzgeci gövde yüksekliğinin birkaç katına çıkar ve yelken gibi açılır; erkekler kur yaparken yüzgeci tam açar, dişide yüzgeç belirgin biçimde daha alçaktır. Uzun yüzgeç kalitesiz suda ve sıkışık tankta zarar görebilir; geniş, sıcak ve temiz su ister (genel hobi tavsiyesi).' },
  },
  lyretail: {
    'kuyruk-yuzgeci': { ozet: 'Üst ve alt uçları uzamış, ortası çatallı lira kuyruk.', aciklama: 'Lyretail molly\'de kuyruk yüzgecinin üst ve alt dış ışınları uzar, ortası içeri çekilir ve lira biçimi oluşur. Uzun uçlar kolay yırtılır; kenarlarda aşınma kuyruk çürümesinin de işareti olabilir.' },
  },
  veiltail: {
    'kuyruk-yuzgeci': { ozet: 'Geniş, gösterişli, çatalsız kuyruk yüzgeci.', aciklama: 'Bu formda kuyruk yüzgeci çatallanmadan standarttan çok daha geniş ve uzun görünür. Ad ve ayrım kaynağa göre değişir (kaynakla doğrulanmalı); iri kuyruk yüzmeyi yavaşlatır ve kenar aşınmasına yatkındır.' },
  },
  balloon: {
    'karin-yuzgeci': { ozet: 'Şişkin karnın altında küçük çift yüzgeç.', aciklama: 'Balon formunda gövde kısa ve yuvarlaktır; karın yüzgeçleri şişkin karnın altında küçük kalır. Bu gövde yapısı yüzme kesesi ve sindirim sorunlarıyla ilişkilendirildiğinden bu formu satın almak refah açısından tartışmalıdır.' },
    pul: { ozet: 'Yuvarlak, şişkin gövdeyi kaplayan pullar.', aciklama: 'Balon formunda gövde kısa, derin ve yuvarlaktır; pullar gerilmiş karın bölgesinde seyrek görünebilir. Şematik model gerçek bir bireyin kesin biçimi değildir.' },
  },
};
