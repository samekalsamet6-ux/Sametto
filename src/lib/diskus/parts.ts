// Anatomi parçaları: Türkçe kısa açıklamalar ve model üzerindeki bağlantı noktaları (saf veri).
import type { SpeciesPart } from '../akvaryum/types';
import { bodySurfaceZ, finPoint, flankAnchor, flankNormal, midAnchor, type Anchor } from '../akvaryum/yanal-model';
import { BODY, SPEC } from './model';

export type PartId =
  | 'agiz' | 'goz' | 'burun' | 'solungac-kapagi' | 'govde' | 'seritler' | 'deri-mukusu' | 'yan-cizgi' | 'sirt-yuzgeci' | 'anal-yuzgec'
  | 'pelvik-yuzgec' | 'gogus-yuzgeci' | 'kuyruk-yuzgeci';

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
  { id: 'agiz', ad: 'Ağız', view: 'yan', ozet: 'Küçük, burun ucunda uç ağız.',
    aciklama: 'Diskusun ağzı küçüktür ve burun ucundadır (uç ağız). Doğada su içindeki küçük omurgasızları, bitki parçalarını ve çürüntüyü, akvaryumda ise pul, granül ve canlı/dondurulmuş yemleri alır. Ağız küçük olduğundan yem iriliği önemlidir; yeme isteksizliği genellikle su kalitesi, stres ya da hastalıkla ilişkilendirilir (kaynakla doğrulanmalı).' },
  { id: 'goz', ad: 'Göz', view: 'yan', ozet: 'İri, çoğu hatta kırmızı halkalı göz; yabani desende gözden geçen dikey şerit.',
    aciklama: 'Gözler başın iki yanında, iri ve belirgindir. Çoğu seçmeli hatta göz kırmızı–turuncudur; albino ve “pigeon blood” gibi açık hatlarda kırmızı göz daha belirgindir. Gözün üzerinden geçen koyu dikey şerit (yabani tipin 1. bandı) göz bandı olarak anılır. Gözün bulanıklaşması ya da dışa taşması hastalık belirtisi olabilir (kaynakla doğrulanmalı).' },
  { id: 'burun', ad: 'Burun delikleri', view: 'yan', ozet: 'Ağız ile göz arasında, her yanda küçük koku çukurları.',
    aciklama: 'Her yanda ağız ile göz arasında küçük koku çukurları bulunur. Cichlidlerde koku, yem ve ortam kimyasalını algılamaya yardım eder. Modelde yalnızca küçük bir koyu nokta olarak gösterilmiştir.' },
  { id: 'solungac-kapagi', ad: 'Solungaç kapağı (operkulum)', view: 'yan', ozet: 'Gözün arkasındaki kemikli kapak; altında solungaçlar bulunur.',
    aciklama: 'Solungaç kapağı, solunum organı olan solungaçları örter ve solunumda suyu pompalar. Kapakların açık kalması, çok hızlı solunum ya da kapak kenarında kızarıklık su kalitesi sorunu, parazit veya solungaç hastalığı belirtisi olabilir; tanı için su testleri ve güvenilir kaynak ya da veteriner önerisi gerekir.' },
  { id: 'govde', ad: 'Gövde (yanlardan basık disk)', view: 'yan', ozet: 'Yaklaşık dairesel, yanlardan yassılmış gövde; adı buradan gelir.',
    aciklama: 'Diskusun gövdesi yaklaşık dairesel (disk) ve yanlardan yassıdır; adı bu biçimden gelir. Bu biçim, sakin ve yavaş yüzüş ile bitki ve kök arasında manevra için uygundur. Ön görünümde ne kadar ince olduğunu görebilirsiniz. Gövde derisi küçük pullarla kaplıdır ve mukus tabakasıyla korunur.' },
  { id: 'seritler', ad: 'Dikey şeritler (yabani desen)', view: 'yan', dogrulanmali: true, ozet: 'Yabani tipte dokuz kadar koyu dikey bant; ortadaki (5.) en belirgindir.',
    aciklama: 'Yabani diskuslarda gövdede dokuz kadar koyu dikey bant görülür; ortadaki beşinci bant genellikle en belirgin olanıdır. Bantlar duygu durumuna, çevreye ve stres düzeyine göre koyulaşıp silikleşebilir. Seçmeli hatlarda bantlar bastırılmış (ör. “pigeon blood”, “blue diamond”) ya da çoğaltılmış (ör. yılan derisi) olabilir. Sayı ve konum türe/hatta göre değişir; bu modeldeki değerler şematiktir.' },
  { id: 'deri-mukusu', ad: 'Deri mukusu', view: 'yan', dogrulanmali: true, ozet: 'Derideki mukus tabakası; yavrular bir süre ebeveynin mukusuyla beslenir.',
    aciklama: 'Diskus, derisinin mukus tabakasını yavrularını beslemekte de kullanan nadir balıklardandır: yumurtadan çıkan yavrular bir süre ebeveynlerin yan derisindeki mukusu yiyerek beslenir. Mukus aynı zamanda deriyi parazit ve sürtünmeden korur; derinin mat/beyazımsı bir örtüyle kaplanması ve aşırı mukus hastalık ya da stres belirtisi olabilir. Mukus beslemesinin süresi ve ayrıntıları kaynakla doğrulanmalıdır.' },
  { id: 'yan-cizgi', ad: 'Yan çizgi', view: 'yan', dogrulanmali: true, ozet: 'Gövdenin yanında, su titreşimlerini algılayan duyu hattı.',
    aciklama: 'Balıkların yan çizgisi, sudaki titreşimleri ve akım değişimlerini algılayan duyu organlarından oluşur. Çiklitlerde yan çizgi kesintili olabilir; bu modelde yalnızca çok silik, kesikli bir çizgi olarak gösterilmiştir. Hattın tam yolu kaynakla doğrulanmalıdır.' },
  { id: 'sirt-yuzgeci', ad: 'Sırt yüzgeci', view: 'yan', ozet: 'Gövde kenarı boyunca uzanan, yuvarlak hatlı uzun tabanlı yüzgeç.',
    aciklama: 'Sırt yüzgeci başın gerisinden kuyruk köküne kadar uzanan uzun tabanlıdır; ön kısmında sert (dikensi), arkada yumuşak ışınlar bulunur. Diskusta kısa ve yuvarlak hatlıdır; böylece gövde disk silueti korur. Dengeyi ve yön vermeyi sağlar. Yüzgeçlerin dağılması ya da çürümesi su kalitesi sorununa işaret edebilir (kaynakla doğrulanmalı).' },
  { id: 'anal-yuzgec', ad: 'Anal yüzgeç', view: 'yan', ozet: 'Karın altında sırt yüzgecine benzeyen, uzun tabanlı yüzgeç.',
    aciklama: 'Anal yüzgeç gövdenin alt arka bölümünde, sırt yüzgecine benzer uzun tabanlı ve yuvarlak hatlı bir yüzgeçtir; önde birkaç sert ışın bulunur. Dengeyi sağlar.' },
  { id: 'pelvik-yuzgec', ad: 'Karın yüzgeçleri (pelvik)', view: 'yan', ozet: 'Karnın altında, kısa ve sivri bir çift yüzgeç.',
    aciklama: 'Karın yüzgeçleri, melek balığındakinin aksine kısa ve sivri uçludur; ön kısmında sert bir ışın bulunur. Denge ve ince yön ayarı için kullanılır, ayrıca yüzeye temas ederken destek verebilir. Modelde tek, kısa bir uç olarak çizilmiştir.' },
  { id: 'gogus-yuzgeci', ad: 'Göğüs yüzgeci', view: 'yan', ozet: 'Solungaç kapağının arkasında, saydam ve küçük çırpınan yüzgeç.',
    aciklama: 'Göğüs yüzgeçleri solungaç kapağının hemen arkasında, yan yüzeyde bulunan küçük, saydam yüzgeçlerdir. Yavaş çırpılarak balığın yerinde durmasını, hassas yön değiştirmesini ve geri gitmesini sağlar. Çok saydam olduğundan modelde belli belirsiz görünür.' },
  { id: 'kuyruk-yuzgeci', ad: 'Kuyruk yüzgeci', view: 'arka', ozet: 'Küçük, yuvarlak hatlı kuyruk yüzgeci.',
    aciklama: 'Kuyruk yüzgeci gövdeye göre küçük ve yuvarlak hatlıdır; diskus hızlı yüzücü değildir, kuyruk daha çok yön ve ani kaçışta kullanılır. Tatlı su çiklitlerinde bu biçim yaygındır.' },
];

export const partsFor = (_sex?: string, _form?: string): Part[] => PARTS;

const finAt = (i: number, s: number, r: number): Anchor => { const p = finPoint(SPEC.fins[i], s, r); return midAnchor(p[0], p[1]); };

/** Modelin dinlenme duruşundaki bağlantı noktaları (+z yanı için) */
export function partAnchors(): Record<PartId, Anchor> {
  const e = SPEC.eye;
  const pec = finPoint(SPEC.pectoral, 0.5, 0.6);
  const fil = SPEC.filaments[0].path[Math.floor(SPEC.filaments[0].path.length * 0.7)];
  return {
    agiz: midAnchor(-0.52, 0.0),
    goz: flankAnchor(BODY, e.x, e.y, e.r * 0.85),
    burun: flankAnchor(BODY, SPEC.nostril[0], SPEC.nostril[1], 0.012),
    'solungac-kapagi': flankAnchor(BODY, -0.085, 0.14),
    govde: flankAnchor(BODY, 0.1, -0.12),
    seritler: flankAnchor(BODY, 0.2, 0.2),
    'deri-mukusu': flankAnchor(BODY, 0.0, -0.28),
    'yan-cizgi': flankAnchor(BODY, 0.2, 0.17),
    'sirt-yuzgeci': finAt(0, 0.5, 0.7),
    'anal-yuzgec': finAt(1, 0.5, 0.7),
    'pelvik-yuzgec': { pos: [fil[0], fil[1], SPEC.filaments[0].z], normal: null, mirror: true, swim: true },
    'gogus-yuzgeci': { pos: [pec[0], pec[1], bodySurfaceZ(BODY, pec[0], pec[1]) + 0.032], normal: flankNormal(BODY, pec[0], pec[1]), mirror: true, swim: true },
    'kuyruk-yuzgeci': finAt(2, 0.5, 0.75),
  };
}
