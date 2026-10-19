// Anatomi parçaları: Türkçe kısa açıklamalar ve model üzerindeki bağlantı noktaları (saf veri).
import type { SexId, SpeciesPart } from '../akvaryum/types';
import { bodySurfaceZ, finPoint, flankAnchor, flankNormal, midAnchor, type Anchor } from '../akvaryum/yanal-model';
import { specFor, DEFAULT_FORM } from './model';

export type PartId =
  | 'agiz' | 'goz' | 'solungac-kapagi' | 'govde' | 'mavi-serit' | 'kirmizi-serit' | 'sirt-yuzgeci' | 'yag-yuzgeci'
  | 'anal-yuzgec' | 'karin-yuzgeci' | 'gogus-yuzgeci' | 'kuyruk-sapi' | 'kuyruk-yuzgeci';

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
  { id: 'agiz', ad: 'Ağız (küçük, uçta)', view: 'yan', ozet: 'Küçük, öne bakan, dudaklı ağız.',
    aciklama: 'Ağız çok küçük ve burun ucundadır (terminal); hafif yukarı eğimli görünür. Küçük canlı yem, plankton benzeri parçacıklar ve toz yemlerle beslenmeye uygundur. Dudaklar modelde belirgin çizilmiştir; bıyık yoktur. Boğaz dişleri vardır ancak modelde gösterilmemiştir.' },
  { id: 'goz', ad: 'Göz', view: 'yan', ozet: 'Gövdeye göre büyük, küresel göz.',
    aciklama: 'Gözler gövdeye göre büyüktür; bu, loş ve bitkili, çoğu kez çay rengi sularda görme için elverişlidir. Gözde kornea, iris ve siyah gözbebeği ayırt edilir. Balıkta göz kapağı yoktur. Albino bireylerde göz pigmentsiz ve kırmızı görünür; göz rengi şematiktir.' },
  { id: 'solungac-kapagi', ad: 'Solungaç kapağı (operkulum)', view: 'yan', ozet: 'Gözün arkasındaki ince kapak; kırmızı şerit bunun arkasından başlar.',
    aciklama: 'Solungaç kapağı, suda çözünmüş oksijeni alan solungaçları örter; kardinalde gümüşi görünür. Kırmızı şerit kapağın hemen arkasından başlar. Kapakların sürekli çok hızlı hareket etmesi ya da açık kalması su kalitesi, oksijen ya da solungaç sorununa işaret edebilir; tanı için su testleri ve güvenilir kaynak ya da veteriner önerisi gerekir.' },
  { id: 'govde', ad: 'Gövde (yanlardan basık, torpido biçimli)', view: 'yan', dogrulanmali: true, ozet: 'Küçük, yanlardan basık gövde; neondan biraz daha derin ve iri.',
    aciklama: 'Kardinal tetra (Paracheirodon axelrodi), Güney Amerika’dan (Rio Negro ve Orinoko havzaları; kaynaklarda Brezilya, Kolombiya, Venezuela) gelen küçük bir tetradır; boyu birkaç santimdir (kesin değer kaynakla doğrulanmalı). Gövde yanlardan basık ve torpido biçimlidir; neon tetraya göre biraz daha iri ve derin anlatılır. Küçük pullarla kaplıdır (modelde ince pul dokusu). Dişi biraz daha geniş ve dolgun anlatılır (Cinsiyet seçicisi); fark zayıftır.' },
  { id: 'mavi-serit', ad: 'Mavi-yeşil şerit (iridofor)', view: 'yan', dogrulanmali: true, ozet: 'Gözün hizasından yağ yüzgecine uzanan, açıya göre renk değiştiren yapısal şerit.',
    aciklama: 'Gövdenin yanında, gözün hizasından yağ yüzgecine uzanan parlak mavi-yeşil şerit pigment değil “yapısal” renktir: deride ışığı katman halinde yansıtan kristalli hücreler (iridofor) bulunur; renk bakış açısına ve ışığa göre kayar. Şerit kırmızı şeridin ÜSTÜNDEDİR. Yaban popülasyonlar arasında şeridin yağ yüzgecinden önce mi sonra mı bittiği değişebilir (kaynaklarda Rio Negro ve Orinoko hatları ayrı anlatılır; doğrulanmalı). Altın ve albino hatlarda şerit belirgin soluktur.' },
  { id: 'kirmizi-serit', ad: 'Kırmızı şerit (tam boy)', view: 'yan', dogrulanmali: true, ozet: 'Solungaç kapağından kuyruk köküne TÜM gövde boyunca uzanan kırmızı alt şerit.',
    aciklama: 'Mavi-yeşil şeridin altında, solungaç kapağının arkasından kuyruk köküne kadar gövdenin tüm boyunca uzanan kırmızı bölge kardinal tetranın ayırt edici özelliğidir. Benzer görünen neon tetrada (Paracheirodon innesi) kırmızı alan yalnızca gövdenin arka yarısındadır; ikisini ayırt etmede en çok bu kullanılır (kaynakla doğrulanmalı). Renk kırmızı pigment hücrelerinden gelir; yoğunluğu bireye ve ışığa göre değişir. Albino ve altın hatlarda kırmızı korunabilir ya da silikleşebilir.' },
  { id: 'sirt-yuzgeci', ad: 'Sırt yüzgeci', view: 'yan', ozet: 'Sırtta, gövdenin ortasında küçük, saydam yüzgeç.',
    aciklama: 'Gövdenin orta kısmında, sırtta bulunan küçük ve saydam yüzgeçtir; yüzerken yön dengesine yardım eder. Ön ışınları arkadakilerden uzundur. Uzun yüzgeçli formda belirgin büyür.' },
  { id: 'yag-yuzgeci', ad: 'Yağ yüzgeci (adipoz)', view: 'yan', dogrulanmali: true, ozet: 'Sırtta, kuyruğa yakın küçük, ışınsız yüzgeç.',
    aciklama: 'Tetraların da içinde bulunduğu karasinler (Characiformes) grubunun belirgin özelliklerinden biri, sırtta kuyruk köküne yakın duran küçük, ışınsız “yağ yüzgeci”dir. İşlevi tartışmalıdır; duyusal bir rolü olabileceği düşünülür (kaynakla doğrulanmalı). Mavi-yeşil şerit bu yüzgecin hizasına kadar sürer.' },
  { id: 'anal-yuzgec', ad: 'Anal yüzgeç', view: 'yan', dogrulanmali: true, ozet: 'Karnın arkasında orta tabanlı saydam yüzgeç.',
    aciklama: 'Karnın arka kısmında, kuyruk köküne doğru uzanan saydam bir yüzgeçtir; yön vermeye yardım eder. Kaynaklarda olgun erkeklerde anal ya da karın yüzgecinde küçük kemiksi kancalar olabileceği anlatılır, ancak yeri kaynaklara göre değişir ve modelde gösterilmemiştir (doğrulanmalı).' },
  { id: 'karin-yuzgeci', ad: 'Karın (pelvik) yüzgeçleri', view: 'alt', dogrulanmali: true, ozet: 'Karnın altında çift, küçük saydam yüzgeç.',
    aciklama: 'Karın yüzgeçleri göğüs yüzgeçlerinin biraz arkasında, karnın altında çifttir; küçüktür ve dengeyi sağlar. Bu modelde şematik olarak kısa, tek parça gösterilmiştir (gerçekte ışınlı küçük bir yelpazedir); biçim kaynakla doğrulanmalıdır.' },
  { id: 'gogus-yuzgeci', ad: 'Göğüs (pektoral) yüzgeçleri', view: 'yan', ozet: 'Solungaç kapağının arkasında küçük, saydam yüzgeç.',
    aciklama: 'Göğüs yüzgeçleri solungaç kapağının hemen arkasında, yan yüzeyde bulunan küçük ve saydam yüzgeçlerdir. Çırpılarak balığın yerinde durmasını, yavaş manevrayı ve frenlemeyi sağlar. Çok saydam olduğundan modelde belli belirsiz görünür.' },
  { id: 'kuyruk-sapi', ad: 'Kuyruk sapı', view: 'yan', ozet: 'Gövdenin ince arka ucu; kırmızı şerit buraya dek uzanır.',
    aciklama: 'Kuyruk sapı gövdenin kuyruk yüzgecine bağlanan ince ve kaslı kısmıdır; yüzme gücü buradan kuyruk yüzgecine aktarılır. Kırmızı şerit kardinalde bu bölgeye kadar sürer.' },
  { id: 'kuyruk-yuzgeci', ad: 'Kuyruk yüzgeci (çatallı)', view: 'arka', ozet: 'Orta derinlikte çatallı, saydam kuyruk.',
    aciklama: 'Kuyruk yüzgeci çatallıdır ve neredeyse saydamdır; yüzme itişinin büyük kısmını sağlar. Sürü halinde hızlı yön değiştirmeye elverişlidir; sürü halinde tutulmaları sıkça önerilir.' },
];

const FIN_FORM: Record<string, string> = {
  'sirt-yuzgeci': 'Uzun yüzgeçli formda belirgin uzun ve geriye akan.',
  'anal-yuzgec': 'Uzun yüzgeçli formda belirgin uzun ve akıcı.',
  'kuyruk-yuzgeci': 'Uzun yüzgeçli formda uzun, sivri loblu çatallı kuyruk.',
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
  return {
    agiz: midAnchor(-0.5, 0.012),
    goz: flankAnchor(BODY, e.x, e.y, e.r * 0.85),
    'solungac-kapagi': flankAnchor(BODY, -0.272, 0.05),
    govde: flankAnchor(BODY, -0.02, 0.07),
    'mavi-serit': flankAnchor(BODY, 0.1, 0.045, 0.016),
    'kirmizi-serit': flankAnchor(BODY, -0.1, -0.06, 0.016),
    'sirt-yuzgeci': finAt(spec, 0, 0.45, 0.7),
    'yag-yuzgeci': finAt(spec, 3, 0.5, 0.7),
    'anal-yuzgec': finAt(spec, 1, 0.45, 0.7),
    'karin-yuzgeci': { pos: [pel[0], pel[1], spec.filaments[0].z], normal: null, mirror: true, swim: true },
    'gogus-yuzgeci': { pos: [pec[0], pec[1], bodySurfaceZ(BODY, pec[0], pec[1]) + 0.03], normal: flankNormal(BODY, pec[0], pec[1]), mirror: true, swim: true },
    'kuyruk-sapi': flankAnchor(BODY, 0.36, -0.005, 0.012),
    'kuyruk-yuzgeci': finAt(spec, 2, 0.5, 0.75),
  };
}
