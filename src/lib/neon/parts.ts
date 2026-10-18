// Neon tetra anatomi parçaları: Türkçe açıklamalar ve model üzerindeki bağlantı noktaları (saf veri).
import { lerp, norm3, surfaceAt, type Vec3 } from '../akvaryum/fishmath';
import type { FishAnchor } from '../akvaryum/fish3d';
import type { FishPart } from '../akvaryum/page';
import { bodyFor, eyeGeom, finsFor, stripeW, type Form, type Sex } from './model';

export type PartId =
  | 'govde' | 'agiz' | 'goz' | 'solungac-kapagi' | 'mavi-serit' | 'kirmizi-bolge' | 'serit-egri' | 'serit-duz'
  | 'sirt-yuzgeci' | 'yag-yuzgeci' | 'kuyruk-yuzgeci' | 'anal-yuzgec' | 'karin-yuzgeci' | 'gogus-yuzgeci';
export type ViewId = 'yan' | 'ust' | 'alt' | 'on' | 'arka' | 'capraz';

export interface Part extends FishPart { id: PartId; view: ViewId }

export const PARTS: Part[] = [
  { id: 'govde', ad: 'Gövde (ince, torpido biçimli)', view: 'yan', dogrulanmali: true, ozet: 'Küçük, ince, yanlardan basık gövde.',
    aciklama: 'Neon tetra (Paracheirodon innesi), Güney Amerika’dan (Amazon havzasının üst kesimleri; kaynaklarda Peru ve Brezilya) gelen küçük bir tetradır; boyu genellikle birkaç santimdir (kesin değer kaynakla doğrulanmalı). Gövde ince, torpido biçimli ve yanlardan basıktır; sürü halinde yüzer. Model şematiktir; oranlar gerçek bir bireyin ölçüsü değildir.' },
  { id: 'agiz', ad: 'Ağız (küçük, uçta)', view: 'yan', ozet: 'Küçük, öne bakan ağız.',
    aciklama: 'Ağız çok küçük ve burun ucundadır (terminal). Küçük canlı yem, plankton benzeri parçacıklar ve toz yemlerle beslenmeye uygundur. Boğaz dişleri vardır ancak bu modelde gösterilmemiştir.' },
  { id: 'goz', ad: 'Gözler (iri)', view: 'yan', ozet: 'Gövdeye göre büyük gözler.',
    aciklama: 'Gözler gövdeye göre büyüktür; bu, loş ve bitkili sularda görme için elverişlidir. Balıkta göz kapağı yoktur. Altın (albino tipi) biçimde göz pigmentsiz ve pembemsi-kırmızı görünür.' },
  { id: 'solungac-kapagi', ad: 'Solungaç kapağı (operkulum)', view: 'yan', ozet: 'Solungaçları örten ince kapak.',
    aciklama: 'Solungaçları örten ince kapaktır; neon tetralarda gümüşi görünür. Solungaç kapağının sürekli çok hızlı hareket etmesi ya da kapağın sürekli açık durması su kalitesi, oksijen ya da solungaç hastalığı belirtisi olabilir (kaynakla doğrulanmalı).', dogrulanmali: true },
  { id: 'mavi-serit', ad: 'Mavi-yeşil şerit (iridofor)', view: 'yan', ozet: 'Burundan yağ yüzgecine uzanan parlak, yapısal renkli şerit.',
    aciklama: 'Gövdenin yanında, gözün hizasından kuyruk kökü yakınına uzanan parlak mavi-yeşil şerit, pigment değil “yapısal” bir renktir: deride, ışığı yansıtan kristalli hücreler (iridofor) ışığı katman halinde yansıtır; bu yüzden renk bakış açısına ve ışığa göre kayar. Gece ya da stres durumunda şeridin sönükleştiği anlatılır (kaynakla doğrulanmalı). Pırlanta (diamond) biçimde şerit baş bölgesine kısalmış, altın biçimde belirgin sönüktür.', dogrulanmali: true },
  { id: 'kirmizi-bolge', ad: 'Kırmızı alt yarı', view: 'yan', ozet: 'Gövdenin arka alt yarısını kaplayan kırmızı bölge.',
    aciklama: 'Şeridin altında, gövdenin arka yarısından kuyruk köküne dek uzanan kırmızı bölge, pigment hücrelerinden (kırmızı pigmentli hücreler) gelir. Neon tetrada kırmızı alan gövdenin yaklaşık arka yarısında, benzer görünen kardinal tetrada (Paracheirodon axelrodi; ayrı bir 3B model sayfası vardır: /araclar/3d-kardinal-tetra) ise solungaç kapağından kuyruk köküne gövdenin tüm boyunca uzanır; ikisini ayırt etmede kullanılır (kaynakla doğrulanmalı). Bu modelde yoğunluk şematiktir.', dogrulanmali: true },
  { id: 'serit-egri', ad: 'Şeridin eğriliği (dişide)', sex: 'disi', view: 'yan', ozet: 'Dişide dolgun karın nedeniyle mavi şerit aşağı bükülür.',
    aciklama: 'Dişilerde karın daha dolgundur (özellikle yumurtalar dolduğunda) ve mavi şerit karın bölgesinde hafifçe aşağı bükülmüş görünür. Erkekte şerit daha düzdür. Bu fark ince olup genç bireylerde ya da bakış açısına göre belirsiz olabilir; kesin cinsiyet ayrımı için tek başına yeterli değildir (kaynakla doğrulanmalı).', dogrulanmali: true },
  { id: 'serit-duz', ad: 'Düz şerit (erkekte)', sex: 'erkek', view: 'yan', ozet: 'Erkekte mavi şerit daha düz, gövde daha ince.',
    aciklama: 'Erkeklerde gövde daha ince, mavi şerit daha düzdür. Kaynaklarda erkeklerin sırt ve anal yüzgeçlerinin biraz daha uzun olabileceği de belirtilir, ancak fark küçüktür ve bu modelde yüzgeç boyları cinsiyete göre değiştirilmemiştir (kaynakla doğrulanmalı). Olgunlaşmamış bireylerde ayrım zordur.', dogrulanmali: true },
  { id: 'sirt-yuzgeci', ad: 'Sırt yüzgeci', view: 'yan', ozet: 'Gövdenin ortasında, sırtta tek, küçük, saydam yüzgeç.',
    aciklama: 'Gövdenin orta kısmında, sırtta bulunan küçük ve saydam yüzgeçtir; yönü dengeler. Yüzgeç ışınları ince bir zarla bağlıdır.' },
  { id: 'yag-yuzgeci', ad: 'Yağ yüzgeci (adipoz)', view: 'yan', ozet: 'Sırtta, kuyruğa yakın küçük, ışınsız yüzgeç.',
    aciklama: 'Tetraların da içinde bulunduğu karasinler (Characiformes) grubunun belirgin özelliklerinden biri, sırtta kuyruğa yakın duran küçük, ışınsız “yağ yüzgeci”dir. Bu yüzgecin kesin işlevi tartışmalıdır (kaynakla doğrulanmalı); duyusal rolü olabileceği düşünülür.', dogrulanmali: true },
  { id: 'kuyruk-yuzgeci', ad: 'Kuyruk yüzgeci (çatallı)', view: 'yan', ozet: 'Çatallı, saydam kuyruk yüzgeci.',
    aciklama: 'Kuyruk yüzgeci çatallıdır ve neredeyse saydamdır; yüzme itişinin büyük kısmını sağlar. Hızlı, ani yön değiştirerek sürü halinde yüzmeye elverişlidir. Uzun yüzgeçli (“longfin/veiltail”) yetiştirme biçimleri bu modelde yoktur.' },
  { id: 'anal-yuzgec', ad: 'Anal yüzgeç', view: 'yan', ozet: 'Karnın altında, arka yarıda küçük yüzgeç.',
    aciklama: 'Karnın altında, gövdenin arka yarısında küçük, saydam bir yüzgeçtir; yüzerken dengeye yardım eder.' },
  { id: 'karin-yuzgeci', ad: 'Karın (pelvik) yüzgeçleri', view: 'yan', ozet: 'Karnın altında bir çift küçük yüzgeç.',
    aciklama: 'Karnın altında, gövdenin ortasına yakın bir çift küçük yüzgeçtir; denge ve yön için kullanılır.' },
  { id: 'gogus-yuzgeci', ad: 'Göğüs (pektoral) yüzgeçleri', view: 'yan', ozet: 'Solungaç kapağının arkasında bir çift küçük yüzgeç.',
    aciklama: 'Solungaç kapağının arkasında, gövdenin iki yanında bir çift küçük, saydam yüzgeçtir. Yerinde durmak, yavaş manevra yapmak ve fren için çırpılır.' },
];

export const partsFor = (sex: Sex, _form?: string): Part[] => PARTS.filter((p) => !p.sex || p.sex === sex);

function finPoint(sex: Sex, id: string, u: number, v: number, form: Form = 'standart'): Vec3 {
  const f = finsFor(sex, form).find((x) => x.id === id)!;
  const f0 = u * (f.base.length - 1), i = Math.min(f.base.length - 2, Math.floor(f0)), t = f0 - i;
  const at = (k: number): Vec3 => [lerp(f.base[k][0], f.tip[k][0], v), lerp(f.base[k][1], f.tip[k][1], v), lerp(f.base[k][2], f.tip[k][2], v)];
  const a = at(i), b = at(i + 1);
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

export function partAnchors(sex: Sex, form: Form = 'standart'): Record<string, FishAnchor> {
  const b = bodyFor(sex, form), out: Record<string, FishAnchor> = {};
  const on = (s: number, phi: number, off = 0.012): FishAnchor => { const r = surfaceAt(b, s, phi, off); return { pos: r.pos, normal: r.normal, mirror: true }; };
  out.govde = on(0.62, 0.55);
  const n0 = b.section(0.003);
  out.agiz = { pos: [n0.x - 0.004, (n0.yTop + n0.yBot) / 2 - 0.002, 0.012], normal: norm3([-0.8, 0.05, 0.6]), mirror: true };
  const e = eyeGeom(sex, form);
  out.goz = { pos: [e.center[0] + e.normal[0] * e.radius, e.center[1] + e.normal[1] * e.radius, e.center[2] + e.normal[2] * e.radius], normal: e.normal, mirror: true };
  out['solungac-kapagi'] = on(0.205, 1.7, 0.014);
  out['mavi-serit'] = on(0.32, Math.PI * stripeW(sex, 0.32), 0.016);
  out['kirmizi-bolge'] = on(0.7, Math.PI * 0.66, 0.014);
  if (sex === 'disi') out['serit-egri'] = on(0.56, Math.PI * stripeW(sex, 0.56), 0.016);
  else out['serit-duz'] = on(0.56, Math.PI * stripeW(sex, 0.56), 0.016);
  out['sirt-yuzgeci'] = { pos: finPoint(sex, 'sirt', 0.5, 0.7, form), normal: null, mirror: false, flex: 0.2 };
  out['yag-yuzgeci'] = { pos: finPoint(sex, 'yag', 0.5, 0.7, form), normal: null, mirror: false, flex: 0.1 };
  out['kuyruk-yuzgeci'] = { pos: finPoint(sex, 'kuyruk', 0.25, 0.8, form), normal: null, mirror: false, flex: 0.9 };
  out['anal-yuzgec'] = { pos: finPoint(sex, 'anal', 0.5, 0.7, form), normal: null, mirror: false, flex: 0.3 };
  out['karin-yuzgeci'] = { pos: finPoint(sex, 'karin', 0.5, 0.7, form), normal: null, mirror: true, flex: 0.3 };
  out['gogus-yuzgeci'] = { pos: finPoint(sex, 'gogus', 0.5, 0.7, form), normal: null, mirror: true, flex: 0.7 };
  return out;
}
