// Plati form (şekil) varyetesi: ortak livebearer/forms.ts yamaları + Türkçe açıklamalar + forma özgü parça metinleri (saf veri).
// Not: "comet" ve "wagtail" kuyruk/yüzgeç RENK desenleridir, şekil değildir; bu yüzden form listesinde yoktur.
import { makeFormKit, type LbFormPatch } from '../livebearer/forms';
import type { PartId } from '../livebearer/anchors';
import { CONFIG } from './model';

export interface PlatyForm { id: string; ad: string; aciklama: string; grup: string; dogrulanmali?: boolean }

export const FORMS: PlatyForm[] = [
  { id: 'standart', ad: 'Standart', grup: 'Yüzgeç biçimi', aciklama: 'Kısa yuvarlak kuyruk ve kısa sırt yüzgeci; vahşi tipe en yakın biçim.' },
  { id: 'hifin', ad: 'Hifin (yüksek sırt yüzgeci)', grup: 'Yüzgeç biçimi', aciklama: 'Sırt yüzgeci standardın birkaç katı yüksek ve geniştir (“high fin”, bazen sailfin/moonfish da denir). Ticarette yaygın bir formdur; uzun yüzgeç kötü su koşullarında hastalığa daha yatkındır.' },
  { id: 'pintail', ad: 'Pintail (iğne kuyruk)', grup: 'Yüzgeç biçimi', aciklama: 'Kuyruk yüzgecinin ortasındaki ışınlar uzayıp ince bir uç oluşturur; kılıçkuyruğun kılıcına benzer ama kılıç gibi üst uçtan değil, kuyruğun ortasından çıkar. Dişide de görülür.' },
  { id: 'lyretail', ad: 'Lyretail (lira kuyruk)', grup: 'Yüzgeç biçimi', dogrulanmali: true, aciklama: 'Kuyruğun üst ve alt dış ışınları uzar, ortası çatallanır. Platilerde ticari listelerde geçer (ör. “kohaku hifin lyretail”), ancak ayrıntılı kaynak azdır; kaynakla doğrulanmalı.' },
  { id: 'balloon', ad: 'Balloon (balon)', grup: 'Gövde biçimi', dogrulanmali: true, aciklama: 'Kısa, yuvarlak ve şişkin gövde. Hobi balon formları genellikle yüzme kesesi ve sindirim sorunlarıyla ilişkilendirilir ve refah açısından tartışmalıdır; platide yaygınlığı ve kayıt altına alınmış standardı belirsizdir, kaynakla doğrulanmalı.' },
];

const k = (v: number, f: number) => v * f;

export const PATCHES: Record<string, LbFormPatch | undefined> = {
  standart: {},
  hifin: {
    dorsal: (_d, sex) => (sex === 'erkek'
      ? { t0: 0.34, t1: 0.6, rays: 18, phiFront: 92, phiRear: 48, lenFront: 0.95, lenRear: 1.35 }
      : { t0: 0.37, t1: 0.58, rays: 14, phiFront: 86, phiRear: 52, lenFront: 0.78, lenRear: 1.05 }),
  },
  pintail: {
    tail: (t, sex) => ({ pin: sex === 'erkek' ? 1.1 : 0.7, pinWidth: 0.16, reach: t.reach * 0.95, rays: t.rays + 4 }),
  },
  lyretail: {
    tail: (t, sex) => ({ lyre: sex === 'erkek' ? 0.7 : 0.45, fork: 0.28, reach: t.reach * 1.1, halfAngle: t.halfAngle + 6, round: 0.85 }),
  },
  balloon: {
    body: (b) => ({ length: k(b.length, 0.82), height: k(b.height, 1.22), width: k(b.width, 1.2), belly: Math.max(b.belly, 0.2) + 0.3, bellyAt: 0.5, bellySpread: 0.3, peak: 0.4, peduncle: b.peduncle * 1.1, frontPow: 0.55 }),
    tail: (t) => ({ reach: t.reach * 0.88 }),
    dorsal: (d) => ({ lenFront: d.lenFront * 0.9, lenRear: d.lenRear * 0.9 }),
    paired: 0.92,
  },
};

export const kit = makeFormKit(CONFIG, PATCHES);
export const formById = (id?: string): PlatyForm => FORMS.find((f) => f.id === id) ?? FORMS[0];

export const PART_OVERRIDES: Record<string, Partial<Record<PartId, { ozet?: string; aciklama?: string }>>> = {
  hifin: {
    'sirt-yuzgeci': { ozet: 'Standardın birkaç katı yüksek sırt yüzgeci.', aciklama: 'Hifin platide sırt yüzgeci standart platinin birkaç katı yüksek ve geniştir; erkekte daha gösterişli, dişide biraz daha alçaktır. Uzun yüzgeç kötü su koşullarında ve stresli balıkta hastalığa daha yatkındır.' },
  },
  pintail: {
    'kuyruk-yuzgeci': { ozet: 'Ortasında ince bir uç uzanan kuyruk yüzgeci.', aciklama: 'Pintail platide kuyruk yüzgecinin ortasındaki ışınlar diğerlerinin ötesine uzanır. Kılıçkuyruğun kılıcına benzer ama kılıç üst uçtan çıkar; burada uç kuyruğun ortasındadır. Uç kırılgandır, kenar aşınması kuyruk çürümesiyle karıştırılmamalıdır.' },
  },
  lyretail: {
    'kuyruk-yuzgeci': { ozet: 'Üst ve alt uçları uzamış, ortası çatallı lira kuyruk.', aciklama: 'Lira kuyruk formunda kuyruğun üst ve alt dış ışınları uzar, ortası içeri çekilir (kaynakla doğrulanmalı). Uzun uçlar kolay yırtılır.' },
  },
  balloon: {
    'karin-yuzgeci': { ozet: 'Şişkin karnın altında küçük çift yüzgeç.', aciklama: 'Balon formunda gövde kısa ve yuvarlaktır; karın yüzgeçleri şişkin karnın altında küçük kalır. Bu gövde yapısı yüzme kesesi ve sindirim sorunlarıyla ilişkilendirildiğinden refah açısından tartışmalıdır.' },
    pul: { ozet: 'Yuvarlak, şişkin gövdeyi kaplayan pullar.', aciklama: 'Balon formunda gövde kısa, derin ve yuvarlaktır. Şematik model gerçek bir bireyin kesin biçimi değildir.' },
  },
};
