// Anatomi parçaları: Türkçe kısa açıklamalar ve model üzerindeki bağlantı noktaları (saf veri).
import type { SexId, SpeciesPart } from '../akvaryum/types';
import { bodySurfaceZ, finPoint, flankAnchor, flankNormal, midAnchor, type Anchor } from '../akvaryum/yanal-model';
import { specFor, DEFAULT_FORM } from './model';

export type PartId =
  | 'agiz' | 'goz' | 'burun' | 'kirmizi-burun' | 'solungac-kapagi' | 'govde' | 'bantlar' | 'sirt-yuzgeci' | 'anal-yuzgec'
  | 'karin-yuzgeci' | 'gogus-yuzgeci' | 'kuyruk-sapi' | 'kuyruk-yuzgeci';

export type ViewId = 'yan' | 'capraz' | 'on' | 'ust' | 'alt' | 'arka';

export interface Part extends SpeciesPart {
  id: PartId;
  /** Parçayı en iyi gösteren görünüm */
  view: ViewId;
}

export const VIEWS: { id: ViewId; ad: string }[] = [
  { id: 'yan', ad: 'Yan' }, { id: 'ust', ad: 'Üst' }, { id: 'on', ad: 'Ön' }, { id: 'arka', ad: 'Arka' }, { id: 'alt', ad: 'Alt' }, { id: 'capraz', ad: 'Çapraz' },
];

export const PARTS: Part[] = [
  { id: 'agiz', ad: 'Ağız', view: 'yan', ozet: 'Küçük, uç (terminal) ağız; belirgin dudaklar; bıyık yok.',
    aciklama: 'Ağız küçük ve öne bakan uç konumdadır; dudaklar belirgindir. Bazı barb türlerinin aksine kaplan barbda ağız köşesinde bıyık (barbel) bulunmaz; bu modelde de çizilmemiştir. Küçük ağız nedeniyle yem küçük tutulur; tür her şeyi yiyen (omnivor) olarak anlatılır.' },
  { id: 'goz', ad: 'Göz', view: 'yan', ozet: 'Başın iki yanında, iri küresel göz; birinci bant gözün içinden geçer.',
    aciklama: 'Gözler başın iki yanında ve görece iridir. Gözde kornea, iris ve siyah gözbebeği ayırt edilir; iris bu modelde altın–bakır tonlarında gösterilmiştir. Birinci siyah bant gözün içinden geçer ve gözü kısmen gizler. Albino bireylerde göz kırmızı görünür; göz rengi şematiktir.' },
  { id: 'burun', ad: 'Burun delikleri', view: 'yan', ozet: 'Ağız ile göz arasında küçük koku çukurları.',
    aciklama: 'Her yanda ağız ile göz arasında küçük koku çukurları bulunur; yem ve ortam kimyasalının algılanmasına yardım eder. Modelde yalnızca küçük koyu bir nokta olarak gösterilmiştir.' },
  { id: 'kirmizi-burun', ad: 'Kırmızı burun (erkek)', view: 'yan', dogrulanmali: true, ozet: 'Erkekte burun ucunun kırmızı–turuncu tonu.',
    aciklama: 'Olgun erkeklerde burun ve yüz bölgesi kırmızı–turuncuya döner; kaynaklar bunu özellikle üreme döneminde belirginleşen bir erkek işareti olarak anlatır. Dişide burun soluktur. Kızarma yoğunluğu bireyden bireye ve ışığa göre değişir ve tek başına güvenilir bir ayrım değildir; gençlerde fark görülmeyebilir. Şematik yorum, doğrulanmalıdır.' },
  { id: 'solungac-kapagi', ad: 'Solungaç kapağı (operkulum)', view: 'yan', ozet: 'Gözün arkasındaki kemikli kapak; altında solungaçlar vardır.',
    aciklama: 'Solungaç kapağı, suda çözünmüş oksijeni alan solungaçları örter. Hızlı solunum, kapaklarda kızarıklık ya da şişlik su kalitesi sorununa işaret edebilir; tanı için su testleri ve güvenilir kaynak ya da veteriner önerisi gerekir. Modelde kapağın kenarı ince bir çizgiyle gösterilir.' },
  { id: 'govde', ad: 'Gövde (yüksek sırtlı, yanlardan basık)', view: 'yan', ozet: 'Yüksek sırtlı, yuvarlak karınlı, yanlardan basık gövde; küçük pullar.',
    aciklama: 'Gövde yüksek sırtlı ve yanlardan basıktır; en yüksek nokta sırt yüzgecinin hemen önündedir. Ön görünümde gövdenin ne kadar ince olduğu görülür. Gövde küçük pullarla kaplıdır (modelde ince pul dokusu). Dişi genellikle daha iri ve karnı daha dolgun, erkek daha ince ve renkli anlatılır (Cinsiyet seçicisi).' },
  { id: 'bantlar', ad: 'Dört dikey bant (desen)', view: 'yan', ozet: 'Gözden, sırt yüzgeci önünden, arkasından ve kuyruk sapından geçen siyah bantlar.',
    aciklama: 'Tür adını veren (tetrazona: “dört bantlı”) desen: birincisi gözün içinden, ikincisi sırt yüzgecinin önünden, üçüncüsü sırt yüzgecinin arkasından ve dördüncüsü kuyruk sapından geçen dört dikey siyah bant. Yeşil hatta bantlar koyu zeminde silikleşir, albino ve altın hatlarda silik ya da hiç yoktur; bant genişliği ve kesin konumu bireye göre değişir, buradaki yerleşim şematiktir.' },
  { id: 'sirt-yuzgeci', ad: 'Sırt yüzgeci (siyah bant + kırmızı kenar)', view: 'yan', ozet: 'Üçgenimsi; siyah bantlı ve kırmızı–turuncu kenarlı.',
    aciklama: 'Sırt yüzgeci gövdenin en yüksek yerinin hemen arkasında başlar; ön ışınlar en uzundur. Normal renkte yüzgecin ortasında siyah bir bant, dış kenarında ise kırmızı–turuncu bir şerit bulunur. Erkekte kenar kırmızısı daha yoğun anlatılır (dişide daha soluk).' },
  { id: 'anal-yuzgec', ad: 'Anal yüzgeç', view: 'yan', ozet: 'Karnın altında, kuyruk köküne yakın kısa yüzgeç.',
    aciklama: 'Anal yüzgeç karnın arkasında, kuyruk köküne yakın kısa bir yüzgeçtir; yön vermeye yardım eder. Rengi turuncu–kırmızımsıdır, erkekte kenar kırmızısı daha belirgin anlatılır.' },
  { id: 'karin-yuzgeci', ad: 'Karın (pelvik) yüzgeçleri', view: 'alt', dogrulanmali: true, ozet: 'Karnın altında çift, kısa kırmızımsı yüzgeç.',
    aciklama: 'Karın yüzgeçleri göğüs yüzgeçlerinin biraz arkasında, karnın altında çifttir; kırmızı–turuncudur ve dengeyi sağlar. Bu modelde şematik olarak kısa, tek parça bir yüzgeç şeklinde gösterilmiştir (gerçekte ışınlı bir yelpazedir); biçim kaynakla doğrulanmalıdır.' },
  { id: 'gogus-yuzgeci', ad: 'Göğüs yüzgeci', view: 'yan', ozet: 'Solungaç kapağının arkasında küçük, saydam yüzgeç.',
    aciklama: 'Göğüs yüzgeçleri solungaç kapağının hemen arkasında, yan yüzeyde bulunan küçük ve saydam yüzgeçlerdir. Hızlı çırpılarak balığın yerinde durmasını, dönüşünü ve yavaş yüzmesini sağlar. Çok saydam olduğundan modelde belli belirsiz görünür.' },
  { id: 'kuyruk-sapi', ad: 'Kuyruk sapı (dördüncü bant)', view: 'yan', ozet: 'Gövdenin ince, kaslı arka ucu; dördüncü bant buradan geçer.',
    aciklama: 'Kuyruk sapı gövdenin kuyruk yüzgecine bağlanan ince ve kaslı kısmıdır; yüzme gücü buradan kuyruk yüzgecine aktarılır. Dördüncü siyah bant genellikle burada yer alır.' },
  { id: 'kuyruk-yuzgeci', ad: 'Kuyruk yüzgeci', view: 'arka', ozet: 'Orta derinlikte çatallı, kırmızımsı–saydam kuyruk.',
    aciklama: 'Kuyruk yüzgeci çatallıdır ve çoğunlukla saydam ya da hafif kırmızımsıdır. Kaplan barb hızlı ve hareketli yüzer; sürü halinde tutulması gerektiği, küçük gruplarda yüzgeç ısırmanın arttığı sıkça belirtilir.' },
];

const FIN_FORM: Record<string, string> = {
  'sirt-yuzgeci': 'Uzun yüzgeçli formda belirgin uzun ve geriye akan; siyah bantlı, kırmızı kenarlı.',
  'anal-yuzgec': 'Uzun yüzgeçli formda belirgin uzun.',
  'kuyruk-yuzgeci': 'Uzun yüzgeçli formda uzun, sivri loblu çatallı kuyruk.',
  'karin-yuzgeci': 'Uzun yüzgeçli formda daha uzun karın yüzgeçleri.',
};

export const partsFor = (sex?: SexId | string, form?: string): Part[] => {
  const base = sex === 'disi' ? PARTS.filter((p) => p.id !== 'kirmizi-burun') : PARTS;
  return form === 'uzun-yuzgec' ? base.map((p) => (FIN_FORM[p.id] ? { ...p, ozet: FIN_FORM[p.id] } : p)) : base;
};

const finAt = (spec: ReturnType<typeof specFor>, i: number, s: number, r: number): Anchor => { const p = finPoint(spec.fins[i], s, r); return midAnchor(p[0], p[1]); };

/** Modelin dinlenme duruşundaki bağlantı noktaları (+z yanı için) */
export function partAnchors(form: string = DEFAULT_FORM, sex: SexId = 'erkek'): Record<PartId, Anchor> {
  const spec = specFor(form, sex);
  const BODY = spec.body;
  const e = spec.eye;
  const pec = finPoint(spec.pectoral, 0.5, 0.6);
  const path = spec.filaments[0].path;
  const pel = path[Math.floor(path.length * 0.7)];
  return {
    agiz: midAnchor(-0.505, -0.002),
    goz: flankAnchor(BODY, e.x, e.y, e.r * 0.85),
    burun: flankAnchor(BODY, spec.nostril[0], spec.nostril[1], 0.012),
    'kirmizi-burun': flankAnchor(BODY, -0.455, -0.045, 0.012),
    'solungac-kapagi': flankAnchor(BODY, -0.262, 0.02),
    govde: flankAnchor(BODY, -0.02, -0.12),
    bantlar: flankAnchor(BODY, -0.17, 0.1),
    'sirt-yuzgeci': finAt(spec, 0, 0.35, 0.7),
    'anal-yuzgec': finAt(spec, 1, 0.45, 0.7),
    'karin-yuzgeci': { pos: [pel[0], pel[1], spec.filaments[0].z], normal: null, mirror: true, swim: true },
    'gogus-yuzgeci': { pos: [pec[0], pec[1], bodySurfaceZ(BODY, pec[0], pec[1]) + 0.03], normal: flankNormal(BODY, pec[0], pec[1]), mirror: true, swim: true },
    'kuyruk-sapi': flankAnchor(BODY, 0.36, -0.01, 0.012),
    'kuyruk-yuzgeci': finAt(spec, 2, 0.5, 0.75),
  };
}
