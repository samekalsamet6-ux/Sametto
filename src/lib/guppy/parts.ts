// Anatomi parçaları: Türkçe kısa açıklamalar ve model üzerindeki bağlantı noktaları (saf veri).
import { BODY, analFin, bodySurfacePoint, dorsalFin, eyeSpec, gonopodium, pectoralFin, pelvicFin, tailFin, type Sex, type Vec3 } from './model';

export type PartId =
  | 'agiz' | 'goz' | 'solungac-kapagi' | 'yan-cizgi' | 'pul' | 'gogus-yuzgeci' | 'karin-yuzgeci'
  | 'sirt-yuzgeci' | 'anal-yuzgec' | 'gonopodium' | 'kuyruk-sapi' | 'kuyruk-yuzgeci' | 'gravid-spot';

export type ViewId = 'yan' | 'ust' | 'on' | 'arka' | 'alt' | 'capraz';

export interface Part {
  id: PartId;
  ad: string;
  /** Tek cümlelik özet (liste ve ipucu için) */
  ozet: string;
  /** Kısa açıklama */
  aciklama: string;
  /** Yalnızca bu cinsiyette görünür; yoksa ikisinde de */
  sex?: Sex;
  /** İlgili wiki maddesi (var olan bir dosya olmalı) */
  wiki?: string;
  /** Kaynakla doğrulanmalı uyarısı gösterilsin mi */
  dogrulanmali?: boolean;
  view: ViewId;
}

export const PARTS: Part[] = [
  { id: 'agiz', ad: 'Ağız', ozet: 'Küçük, yukarı bakan (üst konumlu) ağız.', view: 'yan',
    aciklama: 'Ağız küçük ve hafif yukarı bakar; bu yapı su yüzeyine yakın yemleri almaya uygundur. Ağız küçük olduğu için yemin tane boyutu önemlidir.' },
  { id: 'goz', ad: 'Göz', ozet: 'Başın iki yanında iri gözler.', view: 'yan',
    aciklama: 'İri gözler başın iki yanında durur; göz bebeği (pupil) siyah, çevresindeki iris ise varyeteye göre renk değiştirir. Albinolarda pigment eksikliği nedeniyle göz kırmızımsı görünür. Gözde bulanıklık veya dışarı taşma bir sağlık sorunu işareti olabilir.' },
  { id: 'solungac-kapagi', ad: 'Solungaç kapağı (operkulum)', ozet: 'Solungaçları örten, nefesle açılıp kapanan kapak.', view: 'yan', wiki: 'oksijen-havalandirma',
    aciklama: 'Solungaçları koruyan kemikli kapaktır. Balık nefes aldıkça ritmik biçimde hareket eder. Sık, hızlı veya su yüzeyinde nefes alma; çoğunlukla oksijen ya da su kalitesi sorununun işaretidir.' },
  { id: 'yan-cizgi', ad: 'Yan çizgi', ozet: 'Su hareketini algılayan duyu sisteminin şematik gösterimi.', view: 'yan', dogrulanmali: true,
    aciklama: 'Yan çizgi sistemi balığın çevresindeki su hareketini ve basınç değişimini algılamasına yardım eder. Bu modelde çizgi yalnızca şematik olarak çizilmiştir; lepistes gibi canlı doğuran balıklarda pullar üzerindeki yan çizgi kanalının ne kadar belirgin olduğu kaynakla doğrulanmalıdır.' },
  { id: 'pul', ad: 'Pullar', ozet: 'Çatı kiremidi gibi üst üste binen yuvarlak pullar.', view: 'yan',
    aciklama: 'Gövde, birbirinin üzerine binen ince pullarla kaplıdır; bunlar derinin üzerindeki koruyucu mukus tabakasıyla birlikte balığı korur. Parlak renkler derideki pigment ve ışığı yansıtan hücrelerden gelir.' },
  { id: 'gogus-yuzgeci', ad: 'Göğüs yüzgeçleri', ozet: 'Gövdenin iki yanında, denge ve yön için çift yüzgeç.', view: 'yan',
    aciklama: 'Solungaç kapağının hemen arkasında yer alan çift yüzgeçtir. Denge, yön verme ve yavaş hareket için sürekli çırpılır. Bu yüzgeçlerin bir yana yapışık tutulması dikkat edilmesi gereken bir belirti olabilir.' },
  { id: 'karin-yuzgeci', ad: 'Karın (pelvik) yüzgeçleri', ozet: 'Karnın altında küçük, çift yüzgeç.', view: 'yan',
    aciklama: 'Karnın alt tarafında yer alan küçük çift yüzgeçtir; denge ve yön için kullanılır.' },
  { id: 'sirt-yuzgeci', ad: 'Sırt yüzgeci', ozet: 'Tek sırt yüzgeci; erkekte uzun ve renkli.', view: 'yan',
    aciklama: 'Sırtta tek yüzgeç bulunur ve dengeyi sağlar. Erkeklerde genellikle uzun ve renklidir, dişilerde kısa ve sönüktür. Yüzgeçlerin sürekli kapalı tutulması stres ya da hastalık işareti olabilir.' },
  { id: 'anal-yuzgec', ad: 'Anal yüzgeç', ozet: 'Dişide karnın arkasında yelpaze biçimli yüzgeç.', sex: 'disi', view: 'yan', wiki: 'gonopodium',
    aciklama: 'Dişide anal yüzgeç yelpaze biçimlidir. Erkekte aynı yüzgeç çubuk biçimli üreme organına (gonopodium) dönüşür; bu fark cinsiyet ayrımının en güvenilir işaretidir.' },
  { id: 'gonopodium', ad: 'Gonopodium', ozet: 'Erkekte anal yüzgecin dönüşmüş, çubuk biçimli üreme organı.', sex: 'erkek', view: 'yan', wiki: 'gonopodium',
    aciklama: 'Erkeğin anal yüzgeci olgunlaşırken çubuk biçimli bir organa dönüşür; buna gonopodium denir ve dişiyi döllemek için kullanılır. Genç erkeklerde belirmesi, erkekleri dişilerden ayırma zamanının geldiğini gösterir.' },
  { id: 'kuyruk-sapi', ad: 'Kuyruk sapı', ozet: 'Gövdeyi kuyruk yüzgecine bağlayan ince, kaslı bölge.', view: 'yan',
    aciklama: 'Gövdenin kuyruk yüzgecine bağlandığı ince ve kaslı bölgedir. Yüzme sırasında gövdedeki kas hareketini kuyruğa iletir.' },
  { id: 'kuyruk-yuzgeci', ad: 'Kuyruk yüzgeci', ozet: 'İtiş gücü veren, ışınlı ve zarlı büyük yüzgeç.', view: 'yan', wiki: 'kuyruk-curumesi',
    aciklama: 'Kuyruk yüzgeci balığı ileri iter. İnce yüzgeç ışınları ve aralarındaki saydam zardan oluşur. Erkeklerde genellikle büyük, delta ya da yelpaze biçimli ve renklidir; dişilerde daha küçük ve sönüktür. Kenarlarda aşınma ve dağılma kuyruk çürümesinin işareti olabilir.' },
  { id: 'gravid-spot', ad: 'Gravid spot', ozet: 'Dişide anal yüzgeç yakınında, gebelikle ilişkili koyu leke.', sex: 'disi', view: 'yan', wiki: 'gravid-spot',
    aciklama: 'Dişinin anal yüzgeci yakınındaki koyu lekedir. Gebelik ilerledikçe belirginleşebilir ve karın genişler. Tek başına kesin gebelik kanıtı değildir.' },
];

export const partsFor = (sex: Sex): Part[] => PARTS.filter((p) => !p.sex || p.sex === sex);

export interface Anchor {
  pos: Vec3;
  /** Yüzeye dik yön; null = yüzgeç gibi iki yandan da görünür */
  normal: Vec3 | null;
  /** z işareti çevrilerek kameranın bulunduğu yana yansıtılabilir */
  mirror: boolean;
}

const mid = (r: Vec3[], u: number): Vec3 => r[Math.round((r.length - 1) * u)];

function surf(sex: Sex, t: number, a: number): Anchor {
  const p = bodySurfacePoint(sex, t, a, 0.02);
  const bottom = bodySurfacePoint(sex, t, 0)[1];
  const top = bodySurfacePoint(sex, t, Math.PI)[1];
  // yaklaşık dış yön: gövde ekseninden yüzeye
  const dy = p[1] - (bottom + top) / 2;
  const l = Math.hypot(dy, p[2]) || 1;
  return { pos: p, normal: [0, dy / l, p[2] / l], mirror: true };
}

/** Modelin dinlenme duruşundaki bağlantı noktaları (+z yan tarafı için) */
export function partAnchors(sex: Sex): Partial<Record<PartId, Anchor>> {
  const eye = eyeSpec(sex);
  const R = eye.radius;
  const out: Partial<Record<PartId, Anchor>> = {};
  const nose = bodySurfacePoint(sex, 0.012, 1.4, 0.02);
  out.agiz = { pos: nose, normal: [-0.6, 0, 0.8], mirror: true };
  out.goz = { pos: [eye.center[0] + eye.normal[0] * R, eye.center[1] + eye.normal[1] * R, eye.center[2] + eye.normal[2] * R], normal: eye.normal, mirror: true };
  out['solungac-kapagi'] = surf(sex, 0.255, 1.75);
  out['yan-cizgi'] = surf(sex, 0.66, Math.PI / 2);
  out.pul = surf(sex, 0.5, 1.2);
  out['gogus-yuzgeci'] = { pos: mid(pectoralFin(sex, 1).rays[4], 0.7), normal: null, mirror: true };
  out['karin-yuzgeci'] = { pos: mid(pelvicFin(sex, 1).rays[2], 0.8), normal: null, mirror: true };
  out['sirt-yuzgeci'] = { pos: mid(dorsalFin(sex).rays[Math.floor(dorsalFin(sex).rays.length * 0.65)], 0.8), normal: null, mirror: false };
  const anal = analFin(sex);
  if (anal) out['anal-yuzgec'] = { pos: mid(anal.rays[3], 0.8), normal: null, mirror: false };
  const g = gonopodium(sex);
  if (g) out.gonopodium = { pos: [g.path[3][0], g.path[3][1] - 0.02, 0], normal: null, mirror: false };
  out['kuyruk-sapi'] = surf(sex, 0.9, Math.PI / 2);
  const tail = tailFin(sex);
  out['kuyruk-yuzgeci'] = { pos: mid(tail.rays[Math.round(tail.rays.length * 0.72)], 0.8), normal: null, mirror: false };
  if (sex === 'disi') out['gravid-spot'] = surf(sex, 0.6, 0.78);
  return out;
}

export const bodyLength = (sex: Sex): number => BODY[sex].length;
