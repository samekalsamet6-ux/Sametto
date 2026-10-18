// Anatomi parçaları: Türkçe kısa açıklamalar ve model üzerindeki bağlantı noktaları (saf veri).
import type { SexId, SpeciesPart } from '../akvaryum/types';
import { bodyFns, bodySurfaceZ, finPoint, flankAnchor, flankNormal, midAnchor, xOfT, type Anchor } from '../akvaryum/yanal-model';
import { specFor, DEFAULT_FORM } from './model';

export type PartId =
  | 'agiz' | 'goz' | 'goz-cubugu' | 'solungac-kapagi' | 'govde' | 'govde-lekesi' | 'benekler' | 'sirt-yuzgeci' | 'ikinci-diken'
  | 'anal-yuzgec' | 'karin-yuzgeci' | 'karin-lekesi' | 'gogus-yuzgeci' | 'kuyruk-sapi' | 'kuyruk-yuzgeci';

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
    aciklama: 'Ağız küçük ve burun ucundadır; hafif yukarı eğimli görünür. Ram, dipte kum ve çakıl arasından küçük canlı yem ve parçacıkları toplayarak beslenen bir cüce çiklittir (kaynaklarda genellikle zemin yakınında gezindiği anlatılır). Dudaklar modelde belirgin çizilmiştir; bıyık yoktur.' },
  { id: 'goz', ad: 'Göz (kırmızı)', view: 'yan', ozet: 'İri, küresel, kırmızı irisli göz.',
    aciklama: 'Gözler başa göre iridir ve irisi tipik olarak kırmızıdır; siyah göz çubuğu bu gözün üzerinden geçer. Gözde kornea, iris ve siyah gözbebeği ayırt edilir. Balıkta göz kapağı yoktur. Albino bireylerde göz pigmentsiz ve daha pembe–kırmızı görünür; göz rengi şematiktir.' },
  { id: 'goz-cubugu', ad: 'Göz çubuğu (siyah)', view: 'yan', ozet: 'Alından gözün üzerinden çeneye inen siyah çubuk.',
    aciklama: 'Alından başlayıp gözün içinden geçerek yanağa/çeneye inen koyu çubuk, ram çikliti için ayırt edici desendir ve gözü kamufle ettiği düşünülür. Altın, elektrik mavisi ve albino hatlarda silik ya da yoktur; siyah hatta fark edilmez. Çubuğun yoğunluğu ruh haline ve ışığa göre değişebilir (kaynakla doğrulanmalı).', dogrulanmali: true },
  { id: 'solungac-kapagi', ad: 'Solungaç kapağı (operkulum)', view: 'yan', ozet: 'Gözün arkasında, solungaçları örten kapak.',
    aciklama: 'Solungaç kapağı, suda çözünmüş oksijeni alan solungaçları örter. Kapakların sürekli çok hızlı hareket etmesi ya da açık kalması su kalitesi, oksijen ya da solungaç sorununa işaret edebilir; tanı için su testleri ve güvenilir kaynak ya da veteriner önerisi gerekir. Baş ve kapak bölgesi çoğu hatta sarımsı–turuncu tonludur.' },
  { id: 'govde', ad: 'Gövde (derin, yanlardan basık)', view: 'yan', dogrulanmali: true, ozet: 'Derin, yanlardan basık, kısa gövde; dik alın.',
    aciklama: 'Ram çiklit (Mikrogeophagus ramirezi; eski ad Papiliochromis/Apistogramma ramirezi), Orinoko havzasının (Kolombiya, Venezuela) sakin, sıcak sularından gelen küçük bir cüce çiklittir; boyu birkaç santimdir (kesin değer kaynakla doğrulanmalı). Gövde derin ve yanlardan basıktır, alın diktir, küçük pullarla kaplıdır (modelde ince pul dokusu). Bolivya ramı (M. altispinosus) AYRI bir türdür ve burada gösterilmez. Balon formda gövde daha kısa ve yuvarlaktır.' },
  { id: 'govde-lekesi', ad: 'Gövde lekesi (siyah)', view: 'yan', dogrulanmali: true, ozet: 'Sırt yüzgecinin altında, gövde ortasında siyah leke.',
    aciklama: 'Gövdenin yanında, ilk sırt yüzgeci ışınlarının altında siyah bir leke bulunur. Kaynaklarda erkeklerde lekenin tek tip koyu, dişilerde ise çevresinde mavi benekler olduğu ya da mavi parıltılı göründüğü anlatılır; ancak bu ayrım kaynaklara göre tutarsızdır ve yetiştirme hatlarında silikleşebilir (kaynakla doğrulanmalı). Altın, elektrik mavisi ve albino hatlarda leke silik ya da yoktur.' },
  { id: 'benekler', ad: 'Parlak mavi benekler', view: 'yan', dogrulanmali: true, ozet: 'Yanlarda, alında ve sırt yüzgecinde parlak mavi iridofor benekler.',
    aciklama: 'Gövdenin yan ve üst kısmında, alında ve yüzgeçlerde dağınık, parlak mavi benekler görülür; bunlar pigment değil yapısal (ışığı yansıtan iridofor) renktir ve bakış açısına göre parıldar. Hatta göre yoğunluğu değişir; elektrik mavisi ve “German blue” hatlarında belirgindir (kaynakla doğrulanmalı). Bu modelde benekler sabit bir yorumdur.' },
  { id: 'sirt-yuzgeci', ad: 'Sırt yüzgeci (dikenli + yumuşak)', view: 'yan', ozet: 'Ön yarısı dikenli, arka yarısı yumuşak ışınlı tek yüzgeç.',
    aciklama: 'Çikliterde sırt yüzgeci tek parçadır: ön kısım sert ışınlı (dikenli), arka kısım yumuşak ışınlıdır. Ram çiklitinde ilk dikenler siyah ve kırmızı–turuncu kenarlıdır, yüzgeç alçak ve arkada yuvarlaktır. Yüzgeç, cinsiyeti ayırt etmeye yardım eden yerlerden biridir (bkz. erkekte uzayan 2. diken), fakat yetiştirme hatlarında bu ipucu güvenilmezdir.' },
  { id: 'ikinci-diken', sex: 'erkek', ad: 'Uzayan 2. sırt dikeni (erkek)', view: 'yan', dogrulanmali: true, ozet: 'Erkekte sırt yüzgecinin 2. dikeni/ışınları belirgin uzar.',
    aciklama: 'Kaynaklarda erkeklerde sırt yüzgecinin ilk birkaç ışınının, özellikle 2. dikenin, uzayıp iplik gibi yükseldiği anlatılır; dişide sırt yüzgeci daha kısa ve arkada daha yuvarlak görünür. Wikipedia gibi kaynaklar yetiştirmenin bazı dişilerde de bu uzamayı ortaya çıkardığını belirtir; yani tek başına güvenilir bir ipucu değildir (doğrulanmalı).' },
  { id: 'anal-yuzgec', ad: 'Anal yüzgeç', view: 'yan', ozet: 'Karnın arkasında, ön kısmı dikenli yuvarlak yüzgeç.',
    aciklama: 'Anal yüzgeç çiklitlere özgü olarak ön kısmında birkaç sert ışın (diken) taşır, arkada yumuşak ışınlıdır; yön ve denge sağlar. Erkekte uçları genellikle daha sivri anlatılır, dişide daha yuvarlak (zayıf ve tutarsız bir ipucu; doğrulanmalı).', dogrulanmali: true },
  { id: 'karin-yuzgeci', ad: 'Karın (pelvik) yüzgeçleri', view: 'alt', ozet: 'Göğüs altından uzanan, ilk ışını uzun çift yüzgeç.',
    aciklama: 'Karın yüzgeçleri göğsün altında, göğüs yüzgeçlerinin biraz önünde çifttir (çiklitlerde tipik olarak göğüste yer alırlar). Ram çiklitinde ilk ışın uzun, çoğu hatta mavi–siyahımsı ve parlaktır; balık bunu zeminde dokunma ve denge için de kullanır. Bu modelde şematik olarak tek parça kalın bir iplik gösterilmiştir (gerçekte ışınlı küçük bir yelpaze); biçim kaynakla doğrulanmalıdır.', dogrulanmali: true },
  { id: 'karin-lekesi', sex: 'disi', ad: 'Pembe–kırmızı karın lekesi (dişi)', view: 'yan', dogrulanmali: true, ozet: 'Dişide, özellikle üreme döneminde karında pembemsi kırmızı leke.',
    aciklama: 'Kaynaklarda dişilerin karınlarında, özellikle yumurtlamaya yakın dönemde, pembe ya da kırmızı bir lekenin belirdiği anlatılır; bu, hobi kaynaklarında sık anılan bir cinsiyet ipucudur. Yokluğu erkek olduğunu kanıtlamaz, yetiştirme hatlarında silik olabilir; kesin tanı için güvenilir kaynak gerekir (doğrulanmalı).' },
  { id: 'gogus-yuzgeci', ad: 'Göğüs (pektoral) yüzgeçleri', view: 'yan', ozet: 'Solungaç kapağının arkasında yuvarlak, saydam yüzgeç.',
    aciklama: 'Göğüs yüzgeçleri solungaç kapağının hemen arkasında, yan yüzeyde bulunan yuvarlak ve saydam yüzgeçlerdir. Hızla çırpılarak balığın yerinde durmasını, hassas manevrayı ve (üreme döneminde) yumurta/larva havalandırmasını sağlar. Çok saydam olduğundan modelde belli belirsiz görünür.' },
  { id: 'kuyruk-sapi', ad: 'Kuyruk sapı', view: 'yan', ozet: 'Gövdenin ince arka ucu.',
    aciklama: 'Kuyruk sapı gövdenin kuyruk yüzgecine bağlanan, kısa ve kaslı kısmıdır; itiş gücü buradan kuyruk yüzgecine aktarılır. Ramlar hızlı sürat yerine kısa atılışlar ve zeminde manevra ile hareket eder.' },
  { id: 'kuyruk-yuzgeci', ad: 'Kuyruk yüzgeci (yuvarlak)', view: 'arka', ozet: 'Yuvarlak (spatül biçimli), çatalsız kuyruk.',
    aciklama: 'Kuyruk yüzgeci yuvarlaktır ve çatallı değildir; çiklit tipinde yelpaze biçimli bir kuyruktur. Uzun yüzgeçli formda uçlar belirgin sivri ve uzundur; balon formda kuyruk gövdeye göre küçük kalır.' },
];

const FIN_FORM: Record<string, Record<string, string>> = {
  'uzun-yuzgec': {
    'sirt-yuzgeci': 'Uzun yüzgeçli formda belirgin yüksek ve geriye akan.',
    'anal-yuzgec': 'Uzun yüzgeçli formda uzun ve akıcı.',
    'kuyruk-yuzgeci': 'Uzun yüzgeçli formda uçları sivri uzayan kuyruk.',
    'karin-yuzgeci': 'Uzun yüzgeçli formda daha uzun iplik.',
  },
  balon: {
    govde: 'Balon formda kısa, yüksek ve yuvarlak gövde.',
    'kuyruk-yuzgeci': 'Balon formda gövdeye göre küçük, yuvarlak kuyruk.',
  },
};

export const partsFor = (sex: SexId | string = 'erkek', form?: string): Part[] => {
  const over = (form && FIN_FORM[form]) || {};
  return PARTS.filter((p) => !p.sex || p.sex === sex).map((p) => (over[p.id] ? { ...p, ozet: over[p.id] } : p));
};

const finAt = (spec: ReturnType<typeof specFor>, i: number, s: number, r: number): Anchor => { const p = finPoint(spec.fins[i], s, r); return midAnchor(p[0], p[1]); };

/** Modelin dinlenme duruşundaki bağlantı noktaları (+z yanı için); her iki cinsiyetin parçaları da bulunur */
export function partAnchors(form: string = DEFAULT_FORM, sex: SexId = 'erkek'): Record<PartId, Anchor> {
  const spec = specFor(form, sex);
  const BODY = spec.body;
  const f = bodyFns(BODY);
  const e = spec.eye;
  const yAt = (t: number, ny: number) => f.top(t) - ny * (f.top(t) - f.bot(t));
  const pec = finPoint(spec.pectoral, 0.5, 0.6);
  const path = spec.filaments[0].path;
  const pel = path[Math.floor(path.length * 0.75)];
  return {
    agiz: midAnchor(-0.5, 0.01),
    goz: flankAnchor(BODY, e.x, e.y, e.r * 0.85),
    'goz-cubugu': flankAnchor(BODY, e.x - 0.012, yAt(0.12, 0.84), 0.016),
    'solungac-kapagi': flankAnchor(BODY, -0.27, yAt(0.23, 0.55)),
    govde: flankAnchor(BODY, 0.04, yAt(0.62, 0.72)),
    'govde-lekesi': flankAnchor(BODY, xOfT(BODY, 0.41), yAt(0.41, 0.3), 0.016),
    benekler: flankAnchor(BODY, 0.1, yAt(0.65, 0.36), 0.016),
    'sirt-yuzgeci': finAt(spec, 0, 0.45, 0.7),
    'ikinci-diken': finAt(spec, 0, 0.1, 0.92),
    'anal-yuzgec': finAt(spec, 1, 0.45, 0.7),
    'karin-yuzgeci': { pos: [pel[0], pel[1], spec.filaments[0].z], normal: null, mirror: true, swim: true },
    'karin-lekesi': flankAnchor(BODY, -0.08, yAt(0.46, 0.86), 0.016),
    'gogus-yuzgeci': { pos: [pec[0], pec[1], bodySurfaceZ(BODY, pec[0], pec[1]) + 0.03], normal: flankNormal(BODY, pec[0], pec[1]), mirror: true, swim: true },
    'kuyruk-sapi': flankAnchor(BODY, BODY.xe - 0.06, yAt(0.94, 0.5), 0.012),
    'kuyruk-yuzgeci': finAt(spec, 2, 0.5, 0.75),
  };
}
