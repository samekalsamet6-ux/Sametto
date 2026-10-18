// Anatomi parçaları: Türkçe kısa açıklamalar ve model üzerindeki bağlantı noktaları (saf veri).
import type { SexId, SpeciesPart } from '../akvaryum/types';
import { bodySurfaceZ, finPoint, flankAnchor, flankNormal, midAnchor, type Anchor } from '../akvaryum/yanal-model';
import { specFor, DEFAULT_FORM } from './model';

export type PartId =
  | 'agiz' | 'biyik' | 'goz' | 'solungac-kapagi' | 'govde' | 'seritler' | 'sirt-yuzgeci' | 'anal-yuzgec'
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
  { id: 'agiz', ad: 'Ağız (yukarı bakan)', view: 'yan', ozet: 'Küçük, yukarı bakan ağız; belirgin dudaklar.',
    aciklama: 'Ağız küçük ve yukarı bakan (üst konumlu) yapıdadır; alt çene hafif öne çıkar. Bu, su yüzeyinden ve üst su katmanından yem toplamaya uygun bir yapı olarak anlatılır. Dudaklar belirgindir; ağız ile göz arasında küçük koku çukurları (burun delikleri) bulunur, modelde küçük koyu bir nokta olarak görülür. Çenede diş yoktur (yutak dişleri vardır). Tür her şeyi yiyen (omnivor) olarak anlatılır.' },
  { id: 'biyik', ad: 'Bıyıklar (iki çift, küçük)', view: 'yan', dogrulanmali: true, ozet: 'Burun ve ağız köşesinde iki çift çok küçük bıyık (barbel).',
    aciklama: 'Zebra danioda iki çift bıyık (barbel) bulunduğu bildirilir: biri burun ucunda (rostral), diğeri ağız köşesinde (maksiller). Çok küçük ve incedirler; çıplak gözle zor seçilir, bireye göre belirginlikleri değişir. Modelde yalnızca ince, kısa iplikler olarak çizilmiştir (boyutları şematiktir); bıyıkların sayısı ve konumu kaynakla doğrulanmalıdır. Dokunma ve tat alma duyusuna yardım eder.' },
  { id: 'goz', ad: 'Göz', view: 'yan', ozet: 'Başın iki yanında, iri küresel göz.',
    aciklama: 'Gözler başın iki yanında ve görece iridir. Gözde kornea, iris ve siyah gözbebeği ayırt edilir; iris bu modelde altın tonlarında gösterilmiştir. Albino bireylerde göz kırmızı görünür; göz rengi şematiktir. Çizgiler gözün hizasında başlamaz; baş çizgisizdir.' },
  { id: 'solungac-kapagi', ad: 'Solungaç kapağı (operkulum)', view: 'yan', ozet: 'Gözün arkasındaki kemikli kapak; çizgiler bunun arkasından başlar.',
    aciklama: 'Solungaç kapağı, suda çözünmüş oksijeni alan solungaçları örter. Yan çizgi desenindeki mavi çizgiler kapağın hemen arkasından başlar; kapağın kendisi gümüşi–altın parlaktır. Hızlı solunum ya da kapaklarda kızarıklık su kalitesi sorununa işaret edebilir; tanı için su testleri ve güvenilir kaynak ya da veteriner önerisi gerekir.' },
  { id: 'govde', ad: 'Gövde (ince, mekik biçimli)', view: 'yan', ozet: 'İnce, mekik (fusiform) biçimli, hafif yanlardan basık gövde; küçük pullar.',
    aciklama: 'Gövde ince ve mekik biçimlidir; hızlı ve çevik yüzmeye uygundur. En derin nokta gövdenin ortasındadır, gövde hafif yanlardan basıktır. Küçük pullarla kaplıdır (modelde ince pul dokusu). Dişi genellikle daha dolgun ve yuvarlak karınlı, erkek daha ince anlatılır (Cinsiyet seçicisi); fark zayıf olabilir.' },
  { id: 'seritler', ad: 'Yatay mavi çizgiler (desen)', view: 'yan', ozet: 'Solungaç kapağından kuyruk yüzgecine kesintisiz uzanan koyu mavi çizgiler; aralarında altın–gümüşi şeritler.',
    aciklama: 'Türün adını veren desen: solungaç kapağının arkasından başlayıp gövde boyunca ve kuyruk yüzgecinin içine doğru kesintisiz uzanan koyu mavi yatay çizgiler; aralarında altın–sarımsı ya da gümüşi şeritler vardır. Anal yüzgeçte de tabana paralel çizgi görülür. Çizgi sayısı ve kalınlığı bireye göre değişir (modelde beş çizgi, şematik). Leopar hatta çizgilerin yerine benekler, altın ve albino hatlarda silik çizgiler görülür.' },
  { id: 'sirt-yuzgeci', ad: 'Sırt yüzgeci (geride, küçük)', view: 'yan', ozet: 'Gövdenin arka yarısında, küçük, saydam yüzgeç.',
    aciklama: 'Sırt yüzgeci küçüktür ve gövdenin arka yarısına, anal yüzgecin biraz önüne yerleşmiştir; yanlardan sıkışık ışınları vardır. Saydamdır; tabanına yakın soluk bir koyu şerit görülebilir. Uzun yüzgeçli formda belirgin uzar.' },
  { id: 'anal-yuzgec', ad: 'Anal yüzgeç (uzun tabanlı)', view: 'yan', ozet: 'Karnın arkasında uzun tabanlı yüzgeç; tabana paralel mavi çizgi.',
    aciklama: 'Anal yüzgeç karnın arka kısmında, kuyruk köküne kadar uzanan nispeten uzun tabanlı bir yüzgeçtir; yön vermeye yardım eder. Gövdedeki çizgilerin devamı gibi tabana paralel bir mavi–altın şerit taşır.' },
  { id: 'karin-yuzgeci', ad: 'Karın (pelvik) yüzgeçleri', view: 'alt', dogrulanmali: true, ozet: 'Karnın altında çift, küçük saydam yüzgeç.',
    aciklama: 'Karın yüzgeçleri göğüs yüzgeçlerinin biraz arkasında, karnın altında çifttir; küçüktür ve dengeyi sağlar. Bu modelde şematik olarak kısa, tek parça bir yüzgeç şeklinde gösterilmiştir (gerçekte ışınlı bir yelpazedir); biçim kaynakla doğrulanmalıdır.' },
  { id: 'gogus-yuzgeci', ad: 'Göğüs yüzgeci', view: 'yan', ozet: 'Solungaç kapağının arkasında küçük, saydam yüzgeç.',
    aciklama: 'Göğüs yüzgeçleri solungaç kapağının hemen arkasında, yan yüzeyde bulunan küçük ve saydam yüzgeçlerdir. Hızlı çırpılarak balığın yerinde durmasını ve dönüşünü sağlar. Çok saydam olduğundan modelde belli belirsiz görünür.' },
  { id: 'kuyruk-sapi', ad: 'Kuyruk sapı', view: 'yan', ozet: 'Gövdenin ince, kaslı arka ucu; çizgiler buradan kuyruğa geçer.',
    aciklama: 'Kuyruk sapı gövdenin kuyruk yüzgecine bağlanan ince ve kaslı kısmıdır; yüzme gücü buradan kuyruk yüzgecine aktarılır. Yatay çizgiler burada incelerek kuyruk yüzgecine devam eder.' },
  { id: 'kuyruk-yuzgeci', ad: 'Kuyruk yüzgeci (çatallı)', view: 'arka', ozet: 'Orta derinlikte çatallı, saydam kuyruk; çizgiler içine uzanır.',
    aciklama: 'Kuyruk yüzgeci çatallıdır ve saydamdır; gövdedeki ortadaki çizgiler yüzgecin içine doğru uzanır ve uca doğru solar. Zebra danio hızlı ve hareketli yüzer; sürü halinde tutulması gerektiği sıkça belirtilir.' },
];

const FIN_FORM: Record<string, string> = {
  'sirt-yuzgeci': 'Uzun yüzgeçli formda belirgin uzun ve geriye akan.',
  'anal-yuzgec': 'Uzun yüzgeçli formda belirgin uzun ve akıcı; çizgi korunur.',
  'kuyruk-yuzgeci': 'Uzun yüzgeçli formda uzun, sivri loblu çatallı kuyruk; çizgiler içine uzanır.',
  'karin-yuzgeci': 'Uzun yüzgeçli formda daha uzun karın yüzgeçleri.',
};

export const partsFor = (_sex?: SexId | string, form?: string): Part[] =>
  form === 'uzun-yuzgec' ? PARTS.map((p) => (FIN_FORM[p.id] ? { ...p, ozet: FIN_FORM[p.id] } : p)) : PARTS;

const finAt = (spec: ReturnType<typeof specFor>, i: number, s: number, r: number): Anchor => { const p = finPoint(spec.fins[i], s, r); return midAnchor(p[0], p[1]); };

/** Modelin dinlenme duruşundaki bağlantı noktaları (+z yanı için) */
export function partAnchors(form: string = DEFAULT_FORM, sex: SexId = 'erkek'): Record<PartId, Anchor> {
  const spec = specFor(form, sex);
  const BODY = spec.body;
  const e = spec.eye;
  const pec = finPoint(spec.pectoral, 0.5, 0.6);
  const path = spec.filaments[0].path;
  const pel = path[Math.floor(path.length * 0.7)];
  const bb = spec.filaments[2].path[Math.floor(spec.filaments[2].path.length * 0.75)];
  return {
    agiz: midAnchor(-0.5, 0.025),
    biyik: { pos: [bb[0] - 0.02, bb[1] - 0.035, spec.filaments[2].z], normal: null, mirror: true, swim: true },
    goz: flankAnchor(BODY, e.x, e.y, e.r * 0.85),
    'solungac-kapagi': flankAnchor(BODY, -0.262, 0.01),
    govde: flankAnchor(BODY, -0.02, -0.07),
    seritler: flankAnchor(BODY, 0.12, 0.01),
    'sirt-yuzgeci': finAt(spec, 0, 0.45, 0.7),
    'anal-yuzgec': finAt(spec, 1, 0.45, 0.7),
    'karin-yuzgeci': { pos: [pel[0], pel[1], spec.filaments[0].z], normal: null, mirror: true, swim: true },
    'gogus-yuzgeci': { pos: [pec[0], pec[1], bodySurfaceZ(BODY, pec[0], pec[1]) + 0.03], normal: flankNormal(BODY, pec[0], pec[1]), mirror: true, swim: true },
    'kuyruk-sapi': flankAnchor(BODY, 0.36, -0.005, 0.012),
    'kuyruk-yuzgeci': finAt(spec, 2, 0.5, 0.75),
  };
}
