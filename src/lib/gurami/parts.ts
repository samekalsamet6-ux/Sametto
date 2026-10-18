// Anatomi parçaları: Türkçe kısa açıklamalar ve model üzerindeki bağlantı noktaları (saf veri).
import type { SexId, SpeciesPart } from '../akvaryum/types';
import { bodySurfaceZ, finPoint, flankAnchor, flankNormal, midAnchor, type Anchor } from '../akvaryum/yanal-model';
import { specFor, DEFAULT_FORM } from './model';

export type PartId =
  | 'agiz' | 'goz' | 'burun' | 'solungac-kapagi' | 'labirent' | 'govde' | 'seritler' | 'sirt-yuzgeci' | 'anal-yuzgec'
  | 'pelvik-iplik' | 'gogus-yuzgeci' | 'kuyruk-sapi' | 'kuyruk-yuzgeci';

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
  { id: 'agiz', ad: 'Ağız', view: 'yan', ozet: 'Küçük, yukarı bakan ağız; belirgin dudaklar.',
    aciklama: 'Ağız küçük ve yukarıya doğru eğiktir (üst uç ağız); bu, su yüzeyine yakın böcekleri, larvaları ve yüzeydeki yemi kapmaya uygundur. Dudaklar belirgindir ve ağız küçük olduğundan iri yem parçaları yutulamaz; yem küçük tutulmalıdır.' },
  { id: 'goz', ad: 'Göz', view: 'yan', ozet: 'Başın iki yanında, iri küresel göz.',
    aciklama: 'Gözler başın iki yanında ve görece iridir; gurami avını büyük ölçüde görerek bulur. Gözde kornea, iris ve siyah gözbebeği ayırt edilir. Göz rengi renk hattına göre değişir (albino bireylerde kırmızı/pembe görünür); bu modelde göz rengi şematiktir.' },
  { id: 'burun', ad: 'Burun delikleri', view: 'yan', ozet: 'Ağız ile göz arasında küçük koku çukurları.',
    aciklama: 'Her yanda ağız ile göz arasında küçük koku çukurları bulunur; koku, yem ve ortam kimyasalını algılamaya yardım eder. Modelde yalnızca küçük koyu bir nokta olarak gösterilmiştir.' },
  { id: 'solungac-kapagi', ad: 'Solungaç kapağı (operkulum)', view: 'yan', ozet: 'Gözün arkasındaki kemikli kapak; altında solungaçlar vardır.',
    aciklama: 'Solungaç kapağı, suda çözünmüş oksijeni alan solungaçları örter. Gurami ayrıca yüzeyden hava soluyabildiği için solungaçlara ek olarak labirent organı kullanır; yine de su kalitesi bozulduğunda kapaklarda kızarıklık, şişlik ya da hızlı solunum görülebilir. Tanı için su testleri ve güvenilir kaynak ya da veteriner önerisi gerekir.' },
  { id: 'labirent', ad: 'Labirent organı (iç organ, görünmez)', view: 'yan', dogrulanmali: true, ozet: 'Dışarıdan görünmez; nokta yalnızca yaklaşık konumunu gösterir.',
    aciklama: 'Labirent organı, solungaç boşluğunun üstünde yer alan, kıvrımlı ve kan damarlarından zengin bir doku olan yardımcı solunum organıdır; balığın yüzeyden yutkunduğu havadan oksijen almasını sağlar. Bu bir dış parça değildir ve modelde çizilmemiştir; numaralı nokta yalnızca baş bölgesinde yaklaşık konumu belirtir. Tam yeri ve biçimi kaynakla doğrulanmalıdır. Yüzeye çıkıp hava alabilmesi için su yüzeyi ile kapak arasında ılık bir hava boşluğu bırakılması önerilir.' },
  { id: 'govde', ad: 'Gövde (yanlardan basık, oval)', view: 'yan', ozet: 'Oval, yanlardan yassılmış gövde; ince pullar.',
    aciklama: 'Gövde yanlardan basık ve ovaldir; ön görünümde ne kadar ince olduğunu görebilirsiniz. Gövde küçük pullarla ve mukus tabakasıyla kaplıdır. Yan çizgi bu türde eksik ya da kesintilidir, bu yüzden modelde çizilmemiştir. Dişide karın dolgun ve yuvarlaktır, erkek daha ince gövdelidir (Cinsiyet seçicisi).' },
  { id: 'seritler', ad: 'Çapraz şeritler (desen)', view: 'yan', dogrulanmali: true, ozet: 'Gövdeden yüzgeçlere uzanan kırmızı–turuncu çapraz şeritler.',
    aciklama: 'Yabani ve neon mavi tipte erkeklerde mavi zemin üzerinde kırmızı–turuncu çapraz şeritler bulunur ve bunlar yüzgeçlere de uzanır. Dişide şeritler çok silik ve zemin gümüşidir. Toz mavi, kobalt, alev gibi hatlarda şeritler silikleşmiş ya da zemin renginde kaybolmuş olabilir. Şerit sayısı ve konumu bireye göre değişir; bu modeldeki yerleşim şematiktir ve adlandırma kaynakla doğrulanmalıdır.' },
  { id: 'sirt-yuzgeci', ad: 'Sırt yüzgeci', view: 'yan', ozet: 'Gövdenin arka yarısında; erkekte uzun ve sivri, dişide kısa ve yuvarlak.',
    aciklama: 'Sırt yüzgeci gövdenin arka yarısında yer alır. Erkekte yüzgecin arka ışınları uzar ve yüzgeç sivri uçla biter; dişide yüzgeç kısa ve yuvarlaktır. Bu, dışarıdan cinsiyeti ayırt etmenin en yaygın ipuçlarından biridir (erkekler ayrıca daha renklidir); gençlerde fark belirgin olmayabilir.' },
  { id: 'anal-yuzgec', ad: 'Anal yüzgeç', view: 'yan', ozet: 'Karnın altında, gövde boyunca uzanan uzun, kesintisiz yüzgeç.',
    aciklama: 'Anal yüzgeç karnın altından kuyruk köküne kadar uzanan uzun ve kesintisiz bir yüzgeçtir; gurami ailesinde tipiktir. Dengeyi ve yön vermeyi sağlar, erkeklerde daha uzun ve sivri uçludur. Üreme döneminde erkek köpükten yuva yapar; bu hareket yüzgeçleri de kullanır.' },
  { id: 'pelvik-iplik', ad: 'Karın yüzgeçleri (dokunma iplikleri)', view: 'yan', dogrulanmali: true, ozet: 'Boğaz altından sarkan iki uzun, ince “dokunma” ipliği.',
    aciklama: 'Karın (pelvik) yüzgeçleri çok uzamış, ince ipliklere dönüşmüştür ve gövdenin altından geriye doğru sarkar. Bu iplikler duyusaldır: balık çevresini, yemi ve diğer balıkları ipliklerle yoklayarak dokunma ve tat algısıyla tanır (“dokunma kolları”). Çok kırılgandır; ağa takılabilir ya da başka balıkların ısırmasıyla zarar görebilir. Bazı kaynaklar bunları göğüs yüzgeçleri olarak anlatır; doğrusu karın yüzgeçleridir, ancak ayrıntı kaynakla doğrulanmalıdır.' },
  { id: 'gogus-yuzgeci', ad: 'Göğüs yüzgeci', view: 'yan', ozet: 'Solungaç kapağının arkasında küçük, saydam yüzgeç.',
    aciklama: 'Göğüs yüzgeçleri solungaç kapağının hemen arkasında, yan yüzeyde bulunan küçük ve saydam yüzgeçlerdir. Hızlı çırpılarak balığın yerinde durmasını, hassas yön değiştirmesini ve geri gitmesini sağlar. Çok saydam olduğundan modelde belli belirsiz görünür.' },
  { id: 'kuyruk-sapi', ad: 'Kuyruk sapı', view: 'yan', ozet: 'Gövdenin ince, kaslı arka ucu.',
    aciklama: 'Kuyruk sapı gövdenin kuyruk yüzgecine bağlanan ince ve kaslı kısmıdır; yüzme gücü buradan kuyruk yüzgecine aktarılır. Yavaş yüzen guramide hızlı sürat yerine hassas manevra öne çıkar.' },
  { id: 'kuyruk-yuzgeci', ad: 'Kuyruk yüzgeci', view: 'arka', ozet: 'Küçük, yuvarlak kuyruk yüzgeci.',
    aciklama: 'Kuyruk yüzgeci küçük ve yuvarlaktır (hafif kesik); guramiler hızlı yüzücü değildir, kuyruk daha çok yön ve ani kaçışta kullanılır. Bu türde kaynaklarda adlandırılmış kuyruk formu (örn. çatallı ya da uzun) bulunamadığı için kuyruk tek biçimlidir.' },
];

export const partsFor = (sex?: SexId | string, _form?: string): Part[] => (sex === 'disi'
  ? PARTS.map((p) => (p.id === 'sirt-yuzgeci' ? { ...p, ozet: 'Kısa ve yuvarlak (dişi).' } : p))
  : PARTS.map((p) => (p.id === 'sirt-yuzgeci' ? { ...p, ozet: 'Uzun ve sivri uçlu (erkek).' } : p)));

const finAt = (spec: ReturnType<typeof specFor>, i: number, s: number, r: number): Anchor => { const p = finPoint(spec.fins[i], s, r); return midAnchor(p[0], p[1]); };

/** Modelin dinlenme duruşundaki bağlantı noktaları (+z yanı için) */
export function partAnchors(_form: string = DEFAULT_FORM, sex: SexId = 'erkek'): Record<PartId, Anchor> {
  const spec = specFor(DEFAULT_FORM, sex);
  const BODY = spec.body;
  const e = spec.eye;
  const pec = finPoint(spec.pectoral, 0.5, 0.6);
  const path = spec.filaments[0].path;
  const fil = path[Math.floor(path.length * 0.6)];
  return {
    agiz: midAnchor(-0.505, 0.03),
    goz: flankAnchor(BODY, e.x, e.y, e.r * 0.85),
    burun: flankAnchor(BODY, spec.nostril[0], spec.nostril[1], 0.012),
    'solungac-kapagi': flankAnchor(BODY, -0.255, 0.0),
    labirent: flankAnchor(BODY, -0.272, 0.1),
    govde: flankAnchor(BODY, 0.04, -0.1),
    seritler: flankAnchor(BODY, 0.18, 0.05),
    'sirt-yuzgeci': finAt(spec, 0, 0.7, 0.75),
    'anal-yuzgec': finAt(spec, 1, 0.5, 0.75),
    'pelvik-iplik': { pos: [fil[0], fil[1], spec.filaments[0].z], normal: null, mirror: true, swim: true },
    'gogus-yuzgeci': { pos: [pec[0], pec[1], bodySurfaceZ(BODY, pec[0], pec[1]) + 0.03], normal: flankNormal(BODY, pec[0], pec[1]), mirror: true, swim: true },
    'kuyruk-sapi': flankAnchor(BODY, 0.36, 0.0, 0.012),
    'kuyruk-yuzgeci': finAt(spec, 2, 0.5, 0.75),
  };
}
