// Corydoras anatomi parçaları: Türkçe açıklamalar ve model üzerindeki bağlantı noktaları (saf veri).
import { lerp, norm3, surfaceAt, type Vec3 } from '../akvaryum/fishmath';
import type { FishAnchor } from '../akvaryum/fish3d';
import type { FishPart } from '../akvaryum/page';
import { barbels, bodyFor, eyeGeom, finsFor, lipsLoop, spines, type Sex } from './model';

export type PartId =
  | 'govde' | 'zirh' | 'bas-kalkani' | 'goz' | 'agiz' | 'biyik' | 'solungac-kapagi' | 'dikenler' | 'sirt-yuzgeci' | 'yag-yuzgeci'
  | 'kuyruk-yuzgeci' | 'anal-yuzgec' | 'karin-yuzgeci' | 'gogus-yuzgeci' | 'govde-genis' | 'govde-dar';
export type ViewId = 'yan' | 'ust' | 'alt' | 'on' | 'arka' | 'capraz';

export interface Part extends FishPart { id: PartId; view: ViewId }

export const PARTS: Part[] = [
  { id: 'govde', ad: 'Gövde (yüksek sırtlı, düz karınlı)', view: 'yan', dogrulanmali: true, ozet: 'Sırt kemerli, karın düze yakın, yanlardan hafif basık gövde.',
    aciklama: 'Corydoras (“kori”) kedibalıkları (Callichthyidae) Güney Amerika’nın tatlı sularından gelir; küçük, tıknaz gövdeleri yüksek bir sırt ve düze yakın bir karınla dibe yakın yaşama uyumludur. Bu model C. aeneus ve C. paleatus gibi yaygın akvaryum türlerine benzeyen şematik bir gövde oranı varsayar; uzun burunlu türler ya da başka gövde biçimli cinsler (ör. Brochis) bilerek dahil değildir. Kesin boy ve oran türe göre değişir ve kaynakla doğrulanmalıdır.' },
  { id: 'zirh', ad: 'Zırh plakaları (kemikli levhalar)', view: 'yan', dogrulanmali: true, ozet: 'Pul yerine, yanlarda iki sıra halinde üst üste binen kemikli levhalar.',
    aciklama: 'Callichthyidae familyası, pul yerine iki sıra halinde dizilmiş, üst üste binen kemikli levhalarla (skut) kaplıdır; üst sıra sırt tarafında, alt sıra karın tarafındadır ve iki sıra yan çizgi hizasında buluşur. Levhalar kabaca balığı yırtıcılara karşı korur. Bu modelde levha sayısı ve biçimi şematiktir (kaynakla doğrulanmalı). Zırhlı deri, ilaç ve tuz gibi maddelere pullu balıklardan farklı tepki verebilir; bu sayfa tedavi rehberi değildir.' },
  { id: 'bas-kalkani', ad: 'Baş (kemikli kalkan)', view: 'yan', ozet: 'Başın üstünü kaplayan, üçgenimsi kemikli kalkan.',
    aciklama: 'Baş, kemikli plakalardan oluşan bir kalkanla örtülüdür; yandan bakınca üçgenimsi bir profil çizer. Burun ucu zeminde eşelenmeye uygundur. Kalkan ve zırh birlikte, kedibalığının dipte yem ararken yüzey sürtünmesine dayanmasına yardım eder.' },
  { id: 'goz', ad: 'Gözler', view: 'yan', ozet: 'Başın yan-üstünde, nispeten büyük gözler.',
    aciklama: 'Gözler başın yan ve üst tarafında, nispeten büyüktür. Balıklarda göz kapağı yoktur. Albino biçimde göz pigmentsizdir ve kırmızımsı görünür; albinolarda ışığa duyarlılık fazla olabilir (kaynakla doğrulanmalı).' },
  { id: 'agiz', ad: 'Ağız (alt yüzde, etli dudaklar)', view: 'alt', ozet: 'Burnun altında, öne bakmayan, etli dudaklı emici ağız.',
    aciklama: 'Ağız alt yüzdedir (subterminal) ve etli dudaklarla çevrilidir; yem zeminden emilerek alınır. Bu yüzden ince, yumuşak ve pürüzsüz bir zemin (ince kum) önemlidir; keskin çakıl, ağız çevresinde ve bıyıklarda aşınma ve yaralara yol açabilir (kaynakla doğrulanmalı). Ağız çok küçüktür; boğaz dişleri modelde gösterilmemiştir.', dogrulanmali: true },
  { id: 'biyik', ad: 'Bıyıklar (barbeller)', view: 'alt', ozet: 'Ağız çevresinde üç çift duyu bıyığı.',
    aciklama: 'Ağzın çevresinde üç çift bıyık (bir çift üst çene, iki çift alt çene bıyığı) bulunur. Bıyıklar dokunma ve tat alma duyu hücreleriyle donatılmıştır; balık zeminde yemi bu sayede bulur. Bıyıkların kısalması, aşınması ya da kırmızılaşıp iltihaplanması zemin ve su kalitesi sorunlarının işareti olabilir (kaynakla doğrulanmalı).', dogrulanmali: true },
  { id: 'solungac-kapagi', ad: 'Solungaç kapağı (operkulum)', view: 'yan', ozet: 'Solungaçları örten sert kapak.',
    aciklama: 'Solungaçları örten, kemikli bir kapaktır ve zırhın parçasıdır. Kori balıklarının önemli bir özelliği, ek olarak yüzeye çıkıp hava yutabilmeleridir (bağırsakla hava solunumu); düşük oksijende bu davranış artabilir. Sık sık yüzeye çıkış su kalitesi sorunu belirtisi olabilir (kaynakla doğrulanmalı).', dogrulanmali: true },
  { id: 'dikenler', ad: 'Yüzgeç dikenleri (sırt ve göğüs)', view: 'yan', uyari: true, dogrulanmali: true, ozet: 'Sırt ve göğüs yüzgeçlerinin önünde sert, kilitlenebilir diken.',
    aciklama: 'Sırt, yağ ve göğüs yüzgeçlerinin ön ışını sert bir dikendir; tehdit altında balık dikenlerini açıp kilitleyebilir. Bu dikenler ağda takılmaya, ellerde batmaya ve tahrişe yol açabilir; bazı kaynaklar çevrelerindeki derinin hafif zehirli olabileceğini bildirir (kaynakla doğrulanmalı). Balığı tutarken ya da ağ kullanırken dikkatli olun; kapta ya da kaseyle taşımak ağa göre daha güvenlidir. Bu sayfa bakım rehberi değildir.' },
  { id: 'sirt-yuzgeci', ad: 'Sırt yüzgeci', view: 'yan', ozet: 'Sırtta yüksek, üçgen yüzgeç.',
    aciklama: 'Sırtın en yüksek yerinde duran, üçgenimsi yüzgeçtir; önünde sert bir diken bulunur. Denge ve yön için kullanılır. Bazı kaynaklarda erkeklerde sırt yüzgecinin dişiden biraz daha sivri olduğu söylenir; bu iddia kesin değildir (kaynakla doğrulanmalı).', dogrulanmali: true },
  { id: 'yag-yuzgeci', ad: 'Yağ yüzgeci (dikenli)', view: 'yan', ozet: 'Sırtın arkasında, ışınsız küçük, ön ucunda dikenli yüzgeç.',
    aciklama: 'Sırtın arka bölümünde, ışınsız ve küçük yağ yüzgeci bulunur; Corydoras’ta ön ucunda küçük bir diken vardır. Kesin işlevi tartışmalıdır (kaynakla doğrulanmalı).', dogrulanmali: true },
  { id: 'kuyruk-yuzgeci', ad: 'Kuyruk yüzgeci (çatallı)', view: 'yan', ozet: 'Çatallı kuyruk yüzgeci.',
    aciklama: 'Kuyruk yüzgeci çatallıdır; hızlı kısa atılmalar ve yüzeye hızlı çıkışlar için itiş sağlar. Çoğu türde yüzgeçte nokta ya da bant desenleri bulunur (örn. benekli biçimde).' },
  { id: 'anal-yuzgec', ad: 'Anal yüzgeç', view: 'yan', ozet: 'Karnın alt arka bölümünde küçük yüzgeç.',
    aciklama: 'Gövdenin alt arka bölümünde, anüsün gerisinde küçük bir yüzgeçtir; ışınları ince bir zarla bağlıdır ve yüzerken dengeye yardım eder.' },
  { id: 'karin-yuzgeci', ad: 'Karın (pelvik) yüzgeçleri', view: 'yan', ozet: 'Karnın altında bir çift küçük yüzgeç.',
    aciklama: 'Karnın altında, gövdenin ortasında bir çift küçük yüzgeçtir; zeminde dururken destek olur. Bazı kaynaklarda dişide bu yüzgeçlerin daha yuvarlak olduğu anlatılır; belirgin bir ayırt edici değildir (kaynakla doğrulanmalı).', dogrulanmali: true },
  { id: 'gogus-yuzgeci', ad: 'Göğüs (pektoral) yüzgeçleri', view: 'yan', ozet: 'Büyük, yuvarlak, kenarında sert dikenli yüzgeç çifti.',
    aciklama: 'Gövdenin iki yanında, karın tarafına yakın bağlanan büyük ve yuvarlak yüzgeçlerdir; ön kenarlarındaki sert diken dipte yürürken ve zemine yaslanırken destek olur. Bu yüzgeçler zemin üzerinde “yürüyormuş” gibi dengeyi sağlar.' },
  { id: 'govde-genis', ad: 'Geniş, dolgun gövde (dişi)', sex: 'disi', view: 'ust', dogrulanmali: true, ozet: 'Dişide gövde, özellikle üstten bakınca erkekten daha geniş ve dolgundur.',
    aciklama: 'Dişiler genellikle erkeklerden daha büyük ve daha geniş gövdelidir; fark üstten bakınca en iyi görülür. Genç bireylerde ve çok genç gruplarda ayrım güvenilir değildir; kesin cinsiyet ayrımı için birkaç işaret birlikte değerlendirilir ve kaynakla doğrulanmalıdır.' },
  { id: 'govde-dar', ad: 'Daha ince gövde (erkek)', sex: 'erkek', view: 'ust', dogrulanmali: true, ozet: 'Erkekte gövde dişiden daha ince ve küçüktür.',
    aciklama: 'Erkekler dişilere göre genellikle daha küçük ve daha ince gövdelidir; üstten bakınca fark belirgindir. Bu fark tek başına güvenilir bir cinsiyet göstergesi değildir; bireye, yaşa ve beslenmeye göre değişir (kaynakla doğrulanmalı). Bu modelde gövde genişliği şematik olarak değiştirilmiştir.' },
];

export const partsFor = (sex: Sex): Part[] => PARTS.filter((p) => !p.sex || p.sex === sex);

function finPoint(sex: Sex, id: string, u: number, v: number): Vec3 {
  const f = finsFor(sex).find((x) => x.id === id)!;
  const f0 = u * (f.base.length - 1), i = Math.min(f.base.length - 2, Math.floor(f0)), t = f0 - i;
  const at = (k: number): Vec3 => [lerp(f.base[k][0], f.tip[k][0], v), lerp(f.base[k][1], f.tip[k][1], v), lerp(f.base[k][2], f.tip[k][2], v)];
  const a = at(i), b = at(i + 1);
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

export function partAnchors(sex: Sex): Record<string, FishAnchor> {
  const b = bodyFor(sex), out: Record<string, FishAnchor> = {};
  const on = (s: number, phi: number, off = 0.012): FishAnchor => { const r = surfaceAt(b, s, phi, off); return { pos: r.pos, normal: r.normal, mirror: true }; };
  out.govde = on(0.62, 0.7);
  out.zirh = on(0.5, 1.2);
  out['bas-kalkani'] = on(0.1, 0.35, 0.014);
  const e = eyeGeom(sex);
  out.goz = { pos: [e.center[0] + e.normal[0] * e.radius, e.center[1] + e.normal[1] * e.radius, e.center[2] + e.normal[2] * e.radius], normal: e.normal, mirror: true };
  const lp = lipsLoop(sex), mx = lp.reduce((m, p) => m + p[0], 0) / lp.length, my = lp.reduce((m, p) => m + p[1], 0) / lp.length;
  out.agiz = { pos: [mx, my - 0.012, 0], normal: [0, -1, 0], mirror: false };
  const bb = barbels(sex)[0].path;
  out.biyik = { pos: [bb[2][0], bb[2][1] - 0.008, bb[2][2]], normal: norm3([-0.3, -1, 0.2]), mirror: true, flex: 0 };
  out['solungac-kapagi'] = on(0.225, 1.6, 0.016);
  const sp = spines(sex).find((x) => x.id === 'sirt')!;
  out.dikenler = { pos: [sp.path[1][0], sp.path[1][1] + 0.012, 0.012], normal: null, mirror: true, flex: 0.2 };
  out['sirt-yuzgeci'] = { pos: finPoint(sex, 'sirt', 0.55, 0.42), normal: null, mirror: true, flex: 0.2 };
  out['yag-yuzgeci'] = { pos: finPoint(sex, 'yag', 0.5, 0.75), normal: null, mirror: true, flex: 0.1 };
  out['kuyruk-yuzgeci'] = { pos: finPoint(sex, 'kuyruk', 0.2, 0.8), normal: null, mirror: false, flex: 0.9 };
  out['anal-yuzgec'] = { pos: finPoint(sex, 'anal', 0.5, 0.7), normal: null, mirror: false, flex: 0.3 };
  out['karin-yuzgeci'] = { pos: finPoint(sex, 'karin', 0.5, 0.7), normal: null, mirror: true, flex: 0.3 };
  out['gogus-yuzgeci'] = { pos: finPoint(sex, 'gogus', 0.5, 0.7), normal: null, mirror: true, flex: 0.6 };
  if (sex === 'disi') out['govde-genis'] = on(0.45, 0.35, 0.016);
  else out['govde-dar'] = on(0.45, 0.35, 0.016);
  return out;
}
