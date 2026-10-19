// Pleko (Ancistrus) anatomi parçaları: Türkçe açıklamalar ve model üzerindeki bağlantı noktaları (saf veri).
import { lerp, surfaceAt, type Vec3 } from '../akvaryum/fishmath';
import type { FishAnchor } from '../akvaryum/fish3d';
import type { FishPart } from '../akvaryum/page';
import { tulFor } from './forms';
import { OPERCULUM, bodyFor, bristles, eyeSpec, finsFor, mouthSpec, type Sex } from './model';

export type PartId =
  | 'govde' | 'plakalar' | 'odontodlar' | 'goz' | 'agiz' | 'bristle-erkek' | 'bristle-disi' | 'solungac-kapagi'
  | 'sirt-yuzgeci' | 'yag-yuzgeci' | 'kuyruk-yuzgeci' | 'anal-yuzgec' | 'karin-yuzgeci' | 'gogus-yuzgeci';
export type ViewId = 'yan' | 'ust' | 'alt' | 'on' | 'arka' | 'capraz';

export interface Part extends FishPart { id: PartId; view: ViewId }

export const PARTS: Part[] = [
  { id: 'govde', ad: 'Gövde (üstten basık)', view: 'ust', dogrulanmali: true, ozet: 'Geniş, yassı baş; düz karın; kuyruğa doğru incelen, sırtı hafif kemerli gövde.',
    aciklama: 'Pleko (Loricariidae) kedibalıkları dipte yaşamaya uyumludur: gövde üstten basıktır, yani yükseklikten çok geniştir; karın düze yakın, baş geniş ve yassıdır, kuyruk sapı ise gövdeye göre ince ve yuvarlaktır. Bu model, bristlenose adıyla bilinen Ancistrus cinsinin akvaryumda yaygın tutulan biçimini şematik olarak anlatır; L144 gibi sayılar bilimsel tür adı değil ticari/katalog kodlarıdır. Oranlar eğitim amaçlı bir yorumdur; kesin boy ve oran türe ve bireye göre değişir ve kaynakla doğrulanmalıdır.' },
  { id: 'plakalar', ad: 'Kemikli plakalar (zırh)', view: 'yan', ozet: 'Pul yerine, yanlarda sıralar halinde dizili kemikli levhalar.',
    aciklama: 'Plekoların gövdesi pullarla değil, deri içinde gelişmiş kemikli levhalarla (dermal plakalar) örtülüdür; yanlarda birkaç boylamsal sıra halinde, sırtta ve yanlarda belirgindir. Bu zırh yırtıcılara karşı koruma sağlar. Karın bölgesinin ön tarafı genellikle çıplak, yumuşak deriyle örtülüdür. Modelde dört sıra plaka çizilmiştir; gerçek sıra ve levha sayısı türe göre değişir (şematik).' },
  { id: 'odontodlar', ad: 'Odontodlar (diken benzeri dermal dişçikler)', view: 'ust', dogrulanmali: true, ozet: 'Plakaların üstündeki, diş yapısında minik diken çıkıntılar.',
    aciklama: 'Odontod, dişle aynı yapı taşından (dentin ve mineli kaplama) oluşan, deri plakalarının üzerinde yer alan küçük dikencik demektir. Plekolarda baş ve gövde plakalarında, özellikle yüzgeç dikenlerinde ve yanak bölgesinde bulunur; sürtünme ve savunmada işe yarar. Bazı Ancistrus erkeklerinde yanakta gizlenip dışarı çıkabilen odontodlar anlatılır; dişilerde bunlar daha az gelişmiş ya da yoktur (kaynaklara göre; doğrulanmalı). Modelde yalnızca baş kabartması olarak gösterilmiştir.' },
  { id: 'goz', ad: 'Gözler (L144: soluk mavi)', view: 'ust', ozet: 'Başın üstünde, iri gözler.',
    aciklama: 'Gözler başın üst yan kısmındadır; aşağıdan ağızla beslenen bir dip balığında yukarıyı görmeye uygundur. Balıklarda göz kapağı yoktur. Gözün rengi forma göre değişir: ortak formda koyu kahverengi, albinoda pembe-kırmızı, “L144 / limon mavi göz” adıyla satılan formda ise soluk maviden maviye uzanan bir ton anlatılır. Kaynaklardan biri, gözü mavi ya da siyah olanın limon form, pembe-kırmızı olanın albino olduğunu söyler; bu ayrım genel bir kuraldır, kaynakla doğrulanmalıdır.' },
  { id: 'agiz', ad: 'Vantuz ağız (alt yüzde)', view: 'alt', ozet: 'Baş altında, etli dudaklı yuvarlak emici disk.',
    aciklama: 'Ağız başın altındadır ve etli dudaklarla çevrili yuvarlak bir emici (vantuz) diske dönüşmüştür; bu sayede balık akıntıda taşa, ağaç köküne ya da camın yüzeyine tutunabilir. Çeneler küçüktür ve yüzeyi kazımaya uygun, kaşığa benzer ince dişlere sahiptir; alg ve bakteri-biyofilm tabakasını sıyırır. Ağız alta baktığı için en iyi Alt görünümde görülür. Modelde dudak diski, yarık ve dudak üzerindeki papiller (sivilceler) şematiktir; dişler çizilmemiştir.' },
  { id: 'bristle-erkek', ad: 'Bristle’lar (dallı baş tentaklleri)', sex: 'erkek', view: 'ust', ozet: 'Erkekte burun kenarında ve başın önünde dallı, etli çıkıntılar.',
    aciklama: 'Ancistrus’a “bristlenose” (kıllı burun) adını veren yapı, burun kenarındaki yumuşak, etli tentaklerdir. Olgun erkeklerde çok daha büyük ve belirgindir, uçları dallanır ve burun kenarında iki geriye uzanan sıra oluşturur. Dişilerde ise yok ya da yalnızca burun kenarında küçük, basit çıkıntılar vardır; bu, cinsiyeti ayırmanın en bilinen yoludur. Tentak boyu ve dallanma düzeni türe ve yaşa göre değişir; genç erkeklerde henüz gelişmemiş olabilir. Modeldeki sayı ve boy şematiktir.' },
  { id: 'bristle-disi', ad: 'Kısa bristle’lar (dişi)', sex: 'disi', view: 'ust', ozet: 'Dişide yalnızca burun kenarında birkaç küçük, dalsız çıkıntı ya da hiç.',
    aciklama: 'Dişi Ancistrus’larda başta erkeklerdeki gibi büyük, dallı tentaklar yoktur; en çok burun kenarında az sayıda küçük, basit çıkıntı bulunabilir ya da hiç bulunmayabilir. Bu fark, cinsiyeti ayırmanın en kolay yoludur ama tek ölçüt değildir: genç bireylerde tentaklar henüz gelişmemiştir, bu yüzden küçük balıklarda ayrım güvenilir değildir. Dişide ayrıca karın gövdesi daha dolgun, baş daha dar çizilmiştir (şematik).' },
  { id: 'solungac-kapagi', ad: 'Solungaç kapağı (operkulum) ve yanak', view: 'yan', ozet: 'Başın arkasında solungaçları örten sert plaka.',
    aciklama: 'Solungaçları örten, plekolarda kemikli ve baş zırhına kaynaşmış kapaktır. Pleko dipte yaşadığı için solungaç suyu yanlara ve arkaya verir. Yanak bölgesinde (kapak önünde) odontod çıkıntıları bulunabilir; erkeklerde daha gelişmiştir (doğrulanmalı).' },
  { id: 'sirt-yuzgeci', ad: 'Sırt yüzgeci (yelken)', view: 'yan', ozet: 'Sırtta, baştan hemen sonra yükselen yüksek ve geniş yüzgeç.',
    aciklama: 'Baştan hemen sonra sırtta, yüksek ve yelken benzeri bir yüzgeç vardır; ilk ışını kalın bir dikendir, arkaya doğru ışınlar alçalır. Ancistrus’ta bu yüzgeç dikkat çekicidir ve hareket sırasında dengeyi korumaya yardımcıdır; tehdit altında dik tutulabilir. Tül (uzun yüzgeç) formlarda bu yüzgeç belirgin biçimde uzar; tül, renkten bağımsız, seçilimle üretilmiş bir özelliktir (bu modelde kullanıcı isteğiyle gösterilir).' },
  { id: 'yag-yuzgeci', ad: 'Yağ yüzgeci (adipoz)', view: 'yan', dogrulanmali: true, ozet: 'Sırtta, kuyruk sapına yakın küçük, ışınsız yüzgeç; önünde diken.',
    aciklama: 'Sırtın arka bölümünde, kuyruğa yakın küçük, etli ve ışınsız bir yüzgeçtir; yağ (adipoz) yüzgeci denir. Pek çok Loricariidae’de ön kenarında küçük bir diken (kimi kaynakta “adipoz diken”) bulunur; bu ayrıntı tür ve kaynağa göre değişir ve kaynakla doğrulanmalıdır. Yüzgeç yüzmeye değil yönlendirmeye az katkı sağlar.' },
  { id: 'kuyruk-yuzgeci', ad: 'Kuyruk yüzgeci', view: 'yan', ozet: 'Kuyruk sapının ucunda, hafif çatallı iki loblu yüzgeç.',
    aciklama: 'Kuyruk sapının ucunda yer alan, hafif çatallı, iki loblu yüzgeçtir. Pleko dipte çoğu zaman hareketsiz kalır, kuyruk yüzgeci ani kaçışlarda ve yüzme başlangıcında kullanılır. Tül (uzun yüzgeç) formlarda lobların uçları belirgin uzayıp perde gibi sarkar. Yüzme animasyonunda gövde dalgası kuyrukta en büyüktür.' },
  { id: 'anal-yuzgec', ad: 'Anal yüzgeç', view: 'alt', ozet: 'Karnın alt arka bölümünde küçük, sivri yüzgeç.',
    aciklama: 'Karnın arka yarısında, kuyruğa yakın, küçük tek bir yüzgeçtir. Pleko yüzerken dengeyi korumaya yardım eder. Tül formlarda biraz uzar. Düz karnı nedeniyle ve alt görünümde daha iyi görülür.' },
  { id: 'karin-yuzgeci', ad: 'Karın (pelvik) yüzgeçleri', view: 'alt', ozet: 'Karnın altında bir çift geniş, yatay yelpaze.',
    aciklama: 'Karnın altında, göğüs yüzgeçlerinin gerisinde bir çift geniş yüzgeçtir; pleko durdurken yatay olarak yana yayılıp zemine yaslanır ve tutunmaya, durmaya yardım eder. Dişi ve erkekte benzer görünür. Tül formlarda belirgin uzar (kullanıcı isteğiyle gösterilen uzunluk).' },
  { id: 'gogus-yuzgeci', ad: 'Göğüs (pektoral) yüzgeçleri ve dikenleri', view: 'ust', uyari: true, ozet: 'Başın hemen gerisinde iki yana açılan büyük yüzgeçler; ön ışın kalın bir diken.',
    aciklama: 'Başın gerisinde iki yana açılan, geniş yelpaze biçimli yüzgeçlerdir; ön ışın kalın, sert bir dikendir. Pleko bu yüzgeçleri tutunmak ve zeminde yürüyüşte destek olarak kullanır; tehdit altında dikenleri dışa açıp kilitleyebilir. Dikenler ağa ve dekora takılabilir ve ele batabilir; tutarken dikkat edin. Erkeklerde bazı türlerde bu dikenin üzerinde odontod/tentak bulunur (doğrulanmalı). Tül formlarda yüzgeç belirgin uzar.' },
];

export const partsFor = (sex: Sex, _form?: string): Part[] => PARTS.filter((p) => !p.sex || p.sex === sex);

/** Yüzgeç yüzeyinde (u: kök boyunca, v: kökten uca) bir nokta */
function finPoint(sex: Sex, tul: number, id: string, u: number, v: number): Vec3 {
  const f = finsFor(sex, tul).find((x) => x.id === id)!;
  const f0 = u * (f.base.length - 1), i = Math.min(f.base.length - 2, Math.floor(f0)), t = f0 - i;
  const at = (k: number): Vec3 => [lerp(f.base[k][0], f.tip[k][0], v), lerp(f.base[k][1], f.tip[k][1], v), lerp(f.base[k][2], f.tip[k][2], v)];
  const a = at(i), b = at(i + 1);
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

export function partAnchors(sex: Sex, form?: string): Record<string, FishAnchor> {
  const tul = tulFor(form);
  const b = bodyFor(sex), out: Record<string, FishAnchor> = {};
  const on = (s: number, phi: number, off = 0.014): FishAnchor => { const r = surfaceAt(b, s, phi, off); return { pos: r.pos, normal: r.normal, mirror: true }; };
  out.govde = on(0.4, 0.55);
  out.plakalar = on(0.64, 1.0);
  out.odontodlar = on(0.13, 0.32, 0.016);
  const e = eyeSpec(sex);
  out.goz = { pos: [e.center[0] + e.normal[0] * e.radius, e.center[1] + e.normal[1] * e.radius, e.center[2] + e.normal[2] * e.radius], normal: e.normal, mirror: true };
  const m = mouthSpec(sex);
  out.agiz = { pos: [m.c[0] + 0.012, m.c[1] - m.bulge - 0.004, 0], normal: [0, -1, 0], mirror: false };
  const bl = bristles(sex)[1] ?? bristles(sex)[0];
  const tip = bl.stalk[bl.stalk.length - 1];
  out[sex === 'erkek' ? 'bristle-erkek' : 'bristle-disi'] = { pos: [tip[0] - 0.004, tip[1] + 0.012, tip[2]], normal: null, mirror: true, flex: 0 };
  out['solungac-kapagi'] = on(OPERCULUM.s + 0.018, 1.15, 0.016);
  out['sirt-yuzgeci'] = { pos: finPoint(sex, tul, 'sirt', 0.4, 0.78), normal: null, mirror: true, flex: 0.2 };
  out['yag-yuzgeci'] = { pos: finPoint(sex, tul, 'yag', 0.5, 0.8), normal: null, mirror: true, flex: 0.15 };
  out['kuyruk-yuzgeci'] = { pos: finPoint(sex, tul, 'kuyruk', 0.15, 0.8), normal: null, mirror: false, flex: 0.9 };
  out['anal-yuzgec'] = { pos: finPoint(sex, tul, 'anal', 0.5, 0.75), normal: null, mirror: false, flex: 0.3 };
  out['karin-yuzgeci'] = { pos: finPoint(sex, tul, 'karin', 0.5, 0.7), normal: null, mirror: true, flex: 0.3 };
  out['gogus-yuzgeci'] = { pos: finPoint(sex, tul, 'gogus', 0.5, 0.7), normal: null, mirror: true, flex: 0.6 };
  return out;
}
