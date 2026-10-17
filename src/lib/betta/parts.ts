// Betta anatomi parçaları: Türkçe açıklamalar ve model üzerindeki bağlantı noktaları (saf veri).
import { lerp, norm3, surfaceAt, type Vec3 } from '../akvaryum/fishmath';
import type { FishPart } from '../akvaryum/page';
import type { FishAnchor } from '../akvaryum/fish3d';
import { bodyFor, eyeSpec, finsFor, ovipositor, type Sex } from './model';
import { FORMS } from './forms';

export type PartId =
  | 'govde' | 'agiz' | 'goz' | 'solungac-kapagi' | 'labirent' | 'pullar'
  | 'sirt-yuzgeci' | 'kuyruk-yuzgeci' | 'anal-yuzgec' | 'karin-yuzgeci' | 'gogus-yuzgeci' | 'yumurta-borusu';
export type ViewId = 'yan' | 'ust' | 'alt' | 'on' | 'arka' | 'capraz';

export interface Part extends FishPart { id: PartId; view: ViewId }

export const PARTS: Part[] = [
  { id: 'govde', ad: 'Gövde (standart / plakat tipi)', view: 'yan', dogrulanmali: true, ozet: 'Uzun, yanlardan hafif basık gövde; kısa ve kompakt yüzgeçler.',
    aciklama: 'Başlangıçtaki standart gövde, kısa yüzgeçli “plakat” tipinden esinlenir; plakat, vahşi bettalara en yakın görünüm olarak anlatılır. Uzun kuyruklu ve diğer biçimleri “Form” seçicisinden deneyebilirsiniz; gövde bütün formlarda aynı kalır (çift kuyrukta biraz derin çizilir). Gövde uzun ve yanlardan hafif basıktır, baş yassıca, ağız üste dönüktür. Betta splendens Güneydoğu Asya’nın durgun, sığ sularından gelir; kaynaklarda yetişkin boyu yaklaşık birkaç santimdir (kesin değer kaynakla doğrulanmalı). Model şematiktir; oranlar gerçek bir bireyin ölçüsü değildir.' },
  { id: 'agiz', ad: 'Ağız (üste dönük)', view: 'on', ozet: 'Küçük, yukarı bakan ağız.',
    aciklama: 'Ağız küçük ve üste dönüktür (süperior); bu yapı suyun yüzeyinden böcek ve başka küçük canlıları almaya uygundur. Hava solumak için yüzeye çıkan betta, ağzıyla yüzeyden hava yutar. Ağızda kalın dudak ve belirgin dişler yoktur; boğaz dişleri vardır ancak bu modelde gösterilmemiştir.' },
  { id: 'goz', ad: 'Gözler', view: 'yan', ozet: 'Başın iki yanında iri gözler.',
    aciklama: 'Gözler başın iki yanındadır ve gövdeye göre iridir. Balıklarda göz kapağı yoktur; göz sürekli açıktır. Betta, görüntüye (aynasına, başka bir erkeğe) belirgin tepki verir. Cellophane ve opak tiplerde göz rengi (koyu ya da bulutlu) bedenden bağımsız olarak farklı görünebilir.' },
  { id: 'solungac-kapagi', ad: 'Solungaç kapağı (operkulum)', view: 'yan', ozet: 'Solungaçları örten kemikli kapak.',
    aciklama: 'Solungaçları örten kemikli kapaktır; solunum suyunun akışına yardım eder. Erkek bettalar tehdit gösterisinde solungaç kapaklarını ve zarlarını açarak başlarını “yelpaze gibi” genişletir (gill flaring); kısa süreli gösteri normaldir ama sürekli yapılması stres ya da aynadaki/komşu bir erkekle rekabet belirtisi olabilir.' },
  { id: 'labirent', ad: 'Labirent organı (iç organ)', view: 'yan', ozet: 'Havadan oksijen almayı sağlayan, solungaç boşluğunda kıvrımlı yapı.',
    aciklama: 'Bettalar “labirent balıkları” (Anabantoidei) grubundandır: solungaç boşluğunun üstünde, çok kıvrımlı ve kanlanması bol bir doku, hava solumayı sağlar. Bu yüzden betta yüzeye çıkıp ağzıyla hava yutar; yüzeye ulaşamaması sağlıksızdır. Bu bir iç organdır ve modelde çizilmemiştir; noktanın yeri yalnızca “yaklaşık nerede” anlamında şematiktir.' },
  { id: 'pullar', ad: 'Pullar ve renk hücreleri', view: 'yan', dogrulanmali: true, ozet: 'Çevrimsel (sikloid) pullar; renk, derideki pigment ve yansıtıcı hücrelerden gelir.',
    aciklama: 'Gövde, çatı gibi üst üste binen yuvarlak kenarlı pullarla kaplıdır. Renkler hem pigment hücrelerinden (kırmızı, sarı, siyah) hem de ışığı yapısal olarak yansıtan hücrelerden (iridofor; metalik mavi, yeşil ve turkuaz) gelir. “Ejder” tipinde pullar kalın ve metalik görünür. Renkler yaşa, ışığa, beslenmeye ve strese göre değişebilir; varyete adlarının hepsi standart bir sınıflama değildir (kaynakla doğrulanmalı).' },
  { id: 'sirt-yuzgeci', ad: 'Sırt yüzgeci', view: 'yan', ozet: 'Sırtın arka yarısında tek yüzgeç.',
    aciklama: 'Gövdenin arka yarısında, sırtta tek bir yüzgeçtir; yönü korumaya yardım eder. Plakat tipte kısa, yuvarlak üçgenimsidir (uzun yüzgeçli formlarda büyür); erkekte dişiden belirgin biçimde daha büyük ve renklidir. Bu modelde ışınlar yüzgeç dokusunda çizgi olarak gösterilmiştir (ışın sayısı şematiktir).' },
  { id: 'kuyruk-yuzgeci', ad: 'Kuyruk yüzgeci', view: 'yan', ozet: 'Kuyruk sapının ucunda yelpaze biçiminde yüzgeç.',
    aciklama: 'Kuyruk sapının ucundaki yelpaze biçimli yüzgeçtir; yüzme itişinin önemli bir bölümünü sağlar. Plakatta kısa, yuvarlak ya da kürek biçimlidir; erkekte dişiden belirgin büyüktür. Uzun, perde gibi kuyruklu biçimler (veiltail, halfmoon vb.) “Form” seçicisinden seçilir; kuyruk açıklığı ve ışın dokusu forma göre değişir. Yüzme animasyonunda gövde dalgası kuyrukta en büyüktür.' },
  { id: 'anal-yuzgec', ad: 'Anal yüzgeç', view: 'yan', ozet: 'Karnın alt arka bölümünde uzun tabanlı yüzgeç.',
    aciklama: 'Karnın alt arka yarısında, uzun tabanlı tek yüzgeçtir; erkekte dişiden belirgin biçimde daha büyük ve uzundur. Bettalarda anal yüzgeç tabanı uzundur; yüzgeç ışınları ince zarla bağlıdır ve zarar görmeye (ısırma, sert dekor) yatkındır.' },
  { id: 'karin-yuzgeci', ad: 'Karın (pelvik) yüzgeçleri', view: 'yan', ozet: 'Gövdenin altında, önde bir çift uzun ve ince yüzgeç.',
    aciklama: 'Karnın altında, solungaç kapağının biraz gerisinde bir çift ince, uzun yüzgeçtir; ilk ışın uzun ve kalındır. Denge ve yön için kullanılır. Erkeklerde dişilere göre daha uzundur. Bu yüzgeçlerin aşırı kısalması ya da kopması yüzgeç yeme ya da su kalitesi sorunlarına işaret edebilir (kaynakla doğrulanmalı).', dogrulanmali: true },
  { id: 'gogus-yuzgeci', ad: 'Göğüs (pektoral) yüzgeçleri', view: 'yan', ozet: 'Gövdenin yanında küçük, saydam, hızlı çırpan yüzgeç çifti.',
    aciklama: 'Gövdenin iki yanında, solungaç kapağının arkasında küçük ve saydam bir çift yüzgeçtir. Betta yerinde dururken ya da yavaş giderken bunları hızla çırpar; ince hareketi ve duruş kontrolünü sağlar.' },
  { id: 'yumurta-borusu', ad: 'Yumurta borusu noktası (ovipozitör)', sex: 'disi', view: 'alt', ozet: 'Dişide karın altında küçük, beyazımsı çıkıntı.',
    aciklama: 'Dişide, karnın alt orta hattında, karın yüzgeçlerinin hemen arkasında yumurtaların bırakıldığı küçük, beyazımsı bir çıkıntı (ovipozitör; “yumurta noktası”) görülür. Cinsiyeti ayırt etmeye yardım eden işaretlerden biridir; ancak tek başına yeterli değildir: erkeğin daha büyük yüzgeçleri ve canlı rengi, dişinin daha kısa yüzgeçleri ve soluk rengi birlikte değerlendirilir. Genç bireylerde cinsiyet ayrımı zordur.' },
];


/** Forma özgü ek cümleler (parça metnine eklenir); yalnızca biçimi gerçekten değişen parçalar */
function formNote(form: string, id: PartId, sex: Sex): string {
  const f = FORMS.find((x) => x.id === form);
  if (!f || form === 'plakat') return '';
  const fem = sex === 'disi' ? ' Dişide bu uzantılar erkekten daha kısa ve dardır (şematik).' : '';
  if (id === 'kuyruk-yuzgeci') return ` Seçili form — ${f.ad}: ${f.aciklama}${fem}`;
  if (id === 'sirt-yuzgeci' && form !== 'dumbo') return ` Bu formda sırt yüzgeci plakata göre daha büyük ve geriye doğru daha geniş çizilmiştir${form === 'double-tail' ? ' (çift kuyrukta özellikle iri)' : ''}.${fem}`;
  if (id === 'anal-yuzgec' && form !== 'dumbo') return ` Bu formda anal yüzgeç plakata göre daha uzun ve geniştir.${fem}`;
  if (id === 'gogus-yuzgeci' && form === 'dumbo') return ` Fil kulak formunda göğüs yüzgeçleri çok büyüktür ve yana kulak gibi açılır; hızlı çırpmaları yine de gözlenir.${fem}`;
  if (id === 'govde' && form === 'double-tail') return ' Çift kuyrukta gövde biraz daha derin ve kısa çizilmiştir (şematik).';
  return '';
}

export const partsFor = (sex: Sex, form?: string): Part[] =>
  PARTS.filter((p) => !p.sex || p.sex === sex).map((p) => {
    const n = form ? formNote(form, p.id, sex) : '';
    return n ? { ...p, aciklama: p.aciklama + n } : p;
  });

/** Yüzgeç yüzeyinde (u: kök boyunca, v: kökten uca) bir nokta */
function finPoint(sex: Sex, form: string | undefined, id: string, u: number, v: number): Vec3 {
  const f = finsFor(sex, form).find((x) => x.id === id)!;
  const f0 = u * (f.base.length - 1), i = Math.min(f.base.length - 2, Math.floor(f0)), t = f0 - i;
  const at = (k: number): Vec3 => [lerp(f.base[k][0], f.tip[k][0], v), lerp(f.base[k][1], f.tip[k][1], v), lerp(f.base[k][2], f.tip[k][2], v)];
  const a = at(i), b = at(i + 1);
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

export function partAnchors(sex: Sex, form?: string): Record<string, FishAnchor> {
  const b = bodyFor(sex, form), out: Record<string, FishAnchor> = {};
  const on = (s: number, phi: number, off = 0.012): FishAnchor => { const r = surfaceAt(b, s, phi, off); return { pos: r.pos, normal: r.normal, mirror: true }; };
  out.govde = on(0.5, 1.15);
  const n0 = b.section(0.003);
  out.agiz = { pos: [n0.x - 0.004, (n0.yTop + n0.yBot) / 2 + 0.004, 0.016], normal: norm3([-0.8, 0.1, 0.6]), mirror: true };
  const e = eyeSpec(sex, form);
  out.goz = { pos: [e.center[0] + e.normal[0] * e.radius, e.center[1] + e.normal[1] * e.radius, e.center[2] + e.normal[2] * e.radius], normal: e.normal, mirror: true };
  out['solungac-kapagi'] = on(0.236, 1.55, 0.015);
  out.labirent = on(0.215, 0.62, 0.015);
  out.pullar = on(0.6, 0.95, 0.012);
  out['sirt-yuzgeci'] = { pos: finPoint(sex, form, 'sirt', 0.5, 0.72), normal: null, mirror: false, flex: 0.2 };
  out['kuyruk-yuzgeci'] = { pos: finPoint(sex, form, 'kuyruk', 0.5, 0.72), normal: null, mirror: false, flex: 0.8 };
  out['anal-yuzgec'] = { pos: finPoint(sex, form, 'anal', 0.55, 0.7), normal: null, mirror: false, flex: 0.4 };
  out['karin-yuzgeci'] = { pos: finPoint(sex, form, 'karin', 0.5, 0.65), normal: null, mirror: true, flex: 0.3 };
  out['gogus-yuzgeci'] = { pos: finPoint(sex, form, 'gogus', 0.5, 0.65), normal: null, mirror: true, flex: 0.7 };
  const ov = ovipositor(sex, form);
  if (ov) out['yumurta-borusu'] = { pos: [ov.pos[0], ov.pos[1] - 0.012, 0], normal: norm3([0, -1, 0.05]), mirror: false };
  return out;
}
