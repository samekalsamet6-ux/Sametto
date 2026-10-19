// Anatomi parçaları: Türkçe kısa açıklamalar ve model üzerindeki bağlantı noktaları (saf veri).
import type { SpeciesPart } from '../akvaryum/types';
import { bodySurfaceZ, finPoint, flankAnchor, flankNormal, midAnchor, type Anchor } from '../akvaryum/yanal-model';
import { BODY, specFor, DEFAULT_FORM } from './model';
import type { FishSpec } from '../akvaryum/yanal-model';

export type PartId =
  | 'agiz' | 'goz' | 'burun' | 'solungac-kapagi' | 'govde' | 'seritler' | 'yan-cizgi' | 'sirt-yuzgeci' | 'anal-yuzgec'
  | 'pelvik-iplik' | 'gogus-yuzgeci' | 'kuyruk-sapi' | 'kuyruk-yuzgeci';

export type ViewId = 'yan' | 'capraz' | 'on' | 'ust' | 'arka';

export interface Part extends SpeciesPart {
  id: PartId;
  /** Parçayı en iyi gösteren görünüm */
  view: ViewId;
}

export const VIEWS: { id: ViewId; ad: string }[] = [
  { id: 'yan', ad: 'Yan' }, { id: 'capraz', ad: 'Çapraz' }, { id: 'on', ad: 'Ön' }, { id: 'ust', ad: 'Üst' }, { id: 'arka', ad: 'Arka' },
];

export const PARTS: Part[] = [
  { id: 'agiz', ad: 'Ağız', view: 'yan', ozet: 'Küçük, hafif yukarı bakan uç ağız.',
    aciklama: 'Melek balığının ağzı küçük ve burun ucundadır (uç ağız). Doğada su içindeki küçük böcekleri, kabukluları ve larvaları, akvaryumda pul, canlı ve dondurulmuş yemleri alır. Ağız küçük olduğundan çok iri yemleri yutamaz; yavru ve küçük balıklar ise ağza sığacak kadar küçükse av olabilir, bu yüzden tür seçimi önemlidir.' },
  { id: 'goz', ad: 'Göz', view: 'yan', ozet: 'Başın üst yarısında, iri göz; çoğu renkte kırmızımsı ya da turuncu halkalıdır.',
    aciklama: 'Gözler başın iki yanında, yüksekte ve iridir; melek balığı avını görerek bulur. Yabani tipte göz çevresi kırmızı–turuncu tonlu olabilir; albino ve bazı açık renkli formlarda pigment azdır ve göz kırmızı/pembemsi görünür. Bu modelde göz rengi varyeteye göre şematik olarak değişir. Gözün üzerinden geçen koyu dikey şerit (“göz bandı”) yabani desenin bir parçasıdır.' },
  { id: 'burun', ad: 'Burun delikleri', view: 'yan', ozet: 'Ağız ile göz arasında, her yanda küçük koku çukurları.',
    aciklama: 'Her yanda ağız ile göz arasında küçük koku çukurları bulunur. Bu balıklarda koku, yem ve ortam kimyasalını algılamaya yardım eder. Modelde yalnızca küçük bir koyu nokta olarak gösterilmiştir.' },
  { id: 'solungac-kapagi', ad: 'Solungaç kapağı (operkulum)', view: 'yan', ozet: 'Gözün arkasındaki kemikli kapak; altındaki solungaçları korur.',
    aciklama: 'Solungaç kapağı, solunum organı olan solungaçları örter ve solunumda suyu pompalar. Sürekli çok hızlı hareket, kapakların açık durması ya da kapak kenarında kızarıklık/şişlik su kalitesi sorunu, parazit veya solungaç hastalığı belirtisi olabilir; tanı için su testleri ve güvenilir kaynak ya da veteriner önerisi gerekir.' },
  { id: 'govde', ad: 'Gövde (yanlardan basık disk)', view: 'yan', ozet: 'Yüksek, yanlardan yassılmış, disk benzeri gövde.',
    aciklama: 'Melek balığının gövdesi yanlardan belirgin biçimde yassıdır (lateral kompresyon) ve yüksek bir disk görünümündedir; bu, bitki saplarının ve köklerin arasında dikey manevra yapmaya uygundur. Ön görünümde ne kadar ince olduğunu görebilirsiniz. Gövde derisi küçük pullarla kaplıdır ve mukus tabakasıyla korunur. Yüzme kesesi dengeyi sağlar.' },
  { id: 'seritler', ad: 'Dikey şeritler (desen)', view: 'yan', dogrulanmali: true, ozet: 'Yabani tipte gövdeden yüzgeçlere uzanan koyu dikey bantlar.',
    aciklama: 'Yabani tipte baştan kuyruk köküne kadar birkaç koyu dikey bant vardır: göz bandı, gövdenin ortasında belirgin bir bant ve kuyruk kökünde bir bant; sırt ve anal yüzgeçlere doğru uzanırlar. Bantlar duygu durumuna ve çevreye göre silikleşebilir ya da koyulaşabilir (stres, korku, üreme dönemi). Seçmeli üretilen varyetelerde bantlar azalmış, çoğalmış veya tamamen kaybolmuş olabilir. Bant sayısı ve konumu bireye göre değişir; bu modeldeki değerler şematiktir.' },
  { id: 'yan-cizgi', ad: 'Yan çizgi', view: 'yan', dogrulanmali: true, ozet: 'Gövdenin yanında, su titreşimlerini algılayan duyu hattı.',
    aciklama: 'Balıkların yan çizgisi, sudaki titreşimleri ve akım değişimlerini algılayan duyu organlarından oluşur. Melek balıklarında yan çizgi kesintili ve belirsiz olabilir; bu modelde yalnızca çok silik, kesikli bir çizgi olarak gösterilmiştir. Hattın tam yolu kaynakla doğrulanmalıdır.' },
  { id: 'sirt-yuzgeci', ad: 'Sırt yüzgeci', view: 'yan', ozet: 'Uzun, sivri uçlu üçgen yüzgeç; önde sert, arkada yumuşak ışınlar.',
    aciklama: 'Sırt yüzgeci uzun ve ucu sivridir; ön kısmı sert (dikensi) ışınlardan, arka kısmı dallanmış yumuşak ışınlardan oluşur. Yüzmeyi değil, dengeyi ve yön vermeyi sağlar; anal yüzgeçle birlikte dikey bir “üçgen” siluet verir. Uzun yüzgeçler başka balıkların ısırmasına açıktır (özellikle yüzgeç ısıran türlerle tutulmamalıdır). Yüzgeçlerin kenarı yırtılmış ya da dağılmış görünüyorsa su kalitesi, sıkıntı ya da yüzgeç çürümesi düşünülebilir (kaynakla doğrulanmalı).' },
  { id: 'anal-yuzgec', ad: 'Anal yüzgeç', view: 'yan', ozet: 'Karın altında, sırt yüzgecinin aynası gibi uzun üçgen yüzgeç.',
    aciklama: 'Anal yüzgeç gövdenin alt arka bölümünde, sırt yüzgecine benzer uzun ve sivri biçimdedir. Önde birkaç sert ışın bulunur. Dengeyi sağlar. Üreme döneminde dişinin yumurtalarını bıraktığı yüzeyin (yaprak, boru) yakınında bulunan bölgedir.' },
  { id: 'pelvik-iplik', ad: 'Karın yüzgeçleri (pelvik iplikler)', view: 'yan', ozet: 'Gövdenin altından sarkan iki uzun, ince iplik.',
    aciklama: 'Karın yüzgeçleri çok uzamış, ince ipliklere dönüşmüştür ve gövdenin altından aşağı sarkar. İplikler duyusaldır: dokunma ve yön algısına yardım eder, balık bu ipliklerle çevresini yoklar. Çok kırılgandır; ağa takılarak ya da başka balıklarca ısırılarak zarar görebilir. İplikleri kopmuş balıkta genelde yenilenir (süre kaynağa göre değişir, doğrulanmalı).' , dogrulanmali: true },
  { id: 'gogus-yuzgeci', ad: 'Göğüs yüzgeci', view: 'yan', ozet: 'Solungaç kapağının arkasında, saydam ve küçük çırpınan yüzgeç.',
    aciklama: 'Göğüs yüzgeçleri solungaç kapağının hemen arkasında, yan yüzeyde bulunan küçük, saydam yüzgeçlerdir. Yavaş çırpılarak balığın yerinde durmasını, hassas yön değiştirmesini ve geri gitmesini sağlar. Çok saydam olduğundan bu modelde belli belirsiz görünür.' },
  { id: 'kuyruk-sapi', ad: 'Kuyruk sapı', view: 'yan', ozet: 'Gövdenin ince, kasları yoğun arka ucu.',
    aciklama: 'Kuyruk sapı, gövdenin kuyruk yüzgecine bağlanan ince ve kaslı kısmıdır. Yüzme gücü buradan kuyruk yüzgecine aktarılır. Kuyruk sapındaki koyu dikey bant yabani desenin parçasıdır.' },
  { id: 'kuyruk-yuzgeci', ad: 'Kuyruk yüzgeci', view: 'arka', ozet: 'Hafif çatallı, yelpaze biçimli kuyruk yüzgeci.',
    aciklama: 'Kuyruk yüzgeci hafif çatallı bir yelpaze biçimindedir; melek balıkları hızlı yüzücü değildir, kuyruk daha çok yön ve ani kaçışta kullanılır. Seçmeli uzun yüzgeçli “veil” (peçe) hatlarında kuyruk çok daha uzun ve akıcıdır; form seçicisiyle görülebilir.' },
];

export const partsFor = (_sex?: string, _form?: string): Part[] => PARTS;

const finAt = (spec: FishSpec, i: number, s: number, r: number): Anchor => { const p = finPoint(spec.fins[i], s, r); return midAnchor(p[0], p[1]); };

/** Modelin dinlenme duruşundaki bağlantı noktaları (+z yanı için) */
export function partAnchors(form: string = DEFAULT_FORM): Record<PartId, Anchor> {
  const spec = specFor(form);
  const e = spec.eye;
  const pec = finPoint(spec.pectoral, 0.5, 0.6);
  const fil = spec.filaments[0].path[Math.floor(spec.filaments[0].path.length * 0.55)];
  return {
    agiz: midAnchor(-0.618, 0.03),
    goz: flankAnchor(BODY, e.x, e.y, e.r * 0.85),
    burun: flankAnchor(BODY, spec.nostril[0], spec.nostril[1], 0.012),
    'solungac-kapagi': flankAnchor(BODY, -0.265, 0.14),
    govde: flankAnchor(BODY, 0.02, -0.12),
    seritler: flankAnchor(BODY, 0.14, 0.12),
    'yan-cizgi': flankAnchor(BODY, 0.18, 0.17),
    'sirt-yuzgeci': finAt(spec, 0, 0.55, 0.7),
    'anal-yuzgec': finAt(spec, 1, 0.55, 0.7),
    'pelvik-iplik': { pos: [fil[0], fil[1], spec.filaments[0].z], normal: null, mirror: true, swim: true },
    'gogus-yuzgeci': { pos: [pec[0], pec[1], bodySurfaceZ(BODY, pec[0], pec[1]) + 0.032], normal: flankNormal(BODY, pec[0], pec[1]), mirror: true, swim: true },
    'kuyruk-sapi': flankAnchor(BODY, 0.46, 0.0, 0.012),
    'kuyruk-yuzgeci': finAt(spec, 2, 0.5, 0.75),
  };
}
