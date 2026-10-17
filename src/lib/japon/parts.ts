// Japon balığı anatomi parçaları: Türkçe açıklamalar ve model üzerindeki bağlantı noktaları (saf veri).
import { lerp, norm3, surfaceAt, type Vec3 } from '../akvaryum/fishmath';
import type { FishAnchor } from '../akvaryum/fish3d';
import type { FishPart } from '../akvaryum/page';
import { FORM_IDS, bodyFor, eyeExtras, eyeGeom, finsFor, lateralLine, mouthLine, nostrils, wenSpec, type Form, type Sex } from './model';

export type PartId =
  | 'govde' | 'pullar' | 'yan-cizgi' | 'goz' | 'agiz' | 'burun-delikleri' | 'solungac-kapagi'
  | 'sirt-yuzgeci' | 'kuyruk-yuzgeci' | 'anal-yuzgec' | 'karin-yuzgeci' | 'gogus-yuzgeci' | 'tuberkul' | 'karin-dolgun'
  | 'wen' | 'teleskop-goz' | 'balon-kesesi' | 'omuz-kamburu' | 'inci-pul';
export type ViewId = 'yan' | 'ust' | 'alt' | 'on' | 'arka' | 'capraz';

/** formlar: yalnızca bu formlarda; haric: bu formlarda yok */
export interface Part extends FishPart { id: PartId; view: ViewId; formlar?: Form[]; haric?: Form[] }

export const PARTS: Part[] = [
  { id: 'govde', ad: 'Gövde (common/comet tipi, tek kuyruklu)', view: 'yan', dogrulanmali: true, ozet: 'Orta derinlikli, yanlardan basık, uzun gövde; tek sırt, tek anal, tek kuyruk yüzgeci.',
    aciklama: 'Japon balığı (Carassius auratus), Doğu Asya kökenli bir sazan akrabasıdır. “Form” seçicisi gövde biçimini değiştirir: common, comet ve Bristol shubunkin yabani sazana yakın uzun, orta derinlikli, tek kuyruklu gövdelerdir; fantail, ryukin, oranda, lionhead, telescope, bubble eye ve pearlscale ise yumurta/yuvarlak gövdeli, çift kuyruklu süs (fancy) biçimleridir. Hepsi şematik yorumdur. Gövde oranı gerçek bir bireyin ölçüsü değildir; oran ve boy hatta ve bireye göre değişir (kaynakla doğrulanmalı). Japon balıkları çok büyüyebilir; küçük akvaryumda uzun vadeli bakım için uygun değildir, ayrıntı için güvenilir kaynak gerekir.' },
  { id: 'pullar', ad: 'Pullar', view: 'yan', ozet: 'Çatı gibi üst üste binen, yuvarlak kenarlı pullar.',
    aciklama: 'Gövde, üst üste binen yuvarlak kenarlı (sikloid) pullarla kaplıdır; üzerlerini ince bir mukus tabakası örter. Renkler pullarda ve altındaki deride bulunan pigment hücrelerinden gelir: turuncu-sarı tonlar karotenoid pigmentlerden, siyah ise melanin pigmentinden kaynaklanır. Metalik parlaklık ışığı yansıtan hücrelerden (guanin kristalleri) oluşur. Shubunkin’de “sedefli” (nacreous) pullar yarı saydamdır. Pul kaybı ya da mukus bozulması sağlık sorununa işaret edebilir (kaynakla doğrulanmalı).', dogrulanmali: true },
  { id: 'yan-cizgi', ad: 'Yan çizgi', view: 'yan', ozet: 'Gövde yanında, solungaç kapağından kuyruğa uzanan duyu çizgisi.',
    aciklama: 'Gövdenin iki yanında, solungaç kapağından kuyruk köküne uzanan, pullardaki küçük deliklerden oluşan duyu çizgisidir. Su akıntısındaki ve basınçtaki küçük titreşimleri algılar; balık böylece karanlıkta ya da bulanık suda çevresini hisseder. Modelde noktalı bir çizgi olarak gösterilmiştir.' },
  { id: 'goz', ad: 'Gözler', view: 'yan', ozet: 'Başın iki yanında, gövdeye göre büyük gözler.',
    aciklama: 'Gözler başın iki yanındadır ve görüş alanı çok geniştir; balıkta göz kapağı yoktur. Japon balıkları renkleri ayırt edebilir. Telescope biçiminde gözler dışarı taşar, bubble eye biçiminde yukarı bakar; bu biçimlerde göz için ayrı parçalar vardır.' },
  { id: 'agiz', ad: 'Ağız (bıyıksız)', view: 'on', ozet: 'Küçük, öne bakan ağız; bıyık yoktur.',
    aciklama: 'Ağız küçük ve öne bakar (terminal). Yakın akraba olan sazan ve koi balıklarından farklı olarak japon balığında bıyık (barbel) bulunmaz. Ağızda diş yoktur; yem, boğazdaki farklı bir yapıyla (boğaz dişleri) ezilir. Boğaz dişleri modelde gösterilmemiştir. Japon balıkları midesiz bir sindirim sistemine sahiptir; sık ve az yem verilmesi gerektiği anlatılır (kaynakla doğrulanmalı).', dogrulanmali: true },
  { id: 'burun-delikleri', ad: 'Burun delikleri', haric: ['lionhead'], view: 'on', ozet: 'Gözün önünde her yanda iki küçük koku deliği.',
    aciklama: 'Gözün önünde, her yanda iki küçük burun deliği vardır; bunlar koku alma organına açılır, solunumla ilgisi yoktur. Japon balığının koku duyusu yem bulmada ve yakın bireyleri tanımada kullanılır (kaynakla doğrulanmalı).', dogrulanmali: true },
  { id: 'solungac-kapagi', ad: 'Solungaç kapağı (operkulum)', view: 'yan', ozet: 'Solungaçları örten kemikli kapak.',
    aciklama: 'Solungaçları örten kemikli kapaktır; solunum suyunun akışını düzenler. Kapağın sürekli çok hızlı hareket etmesi, oksijen ya da su kalitesi sorununu gösterebilir. Üreme döneminde erkeklerde bu bölgede küçük beyaz tüberküller çıkabilir (kaynakla doğrulanmalı).', dogrulanmali: true },
  { id: 'sirt-yuzgeci', ad: 'Sırt yüzgeci (uzun tabanlı)', haric: ['lionhead', 'balon-goz'], view: 'yan', ozet: 'Sırtın ortasından arkaya uzanan tek, uzun tabanlı yüzgeç.',
    aciklama: 'Gövdenin sırtında, tek ve uzun tabanlı yüzgeçtir; önde sert, arka kenarı tırtıklı bir ışın bulunur, arkadaki ışınlar yumuşaktır. Yönü ve dengeyi sağlar. Lionhead ve bubble eye gibi bazı süs biçimlerinde bu yüzgeç hiç yoktur; fantail, ryukin ve oranda gibi biçimlerde ise daha dik ve yüksektir.' },
  { id: 'kuyruk-yuzgeci', ad: 'Kuyruk yüzgeci (tek, çatallı)', view: 'yan', ozet: 'Tek parçalı, çatallı kuyruk yüzgeci.',
    aciklama: 'Kuyruk yüzgeci tek parçalı ve çatallıdır; itiş gücünün büyük kısmını sağlar. Comet tipinde daha uzun ve derin çatallı, common tipte daha kısa, Bristol shubunkinde büyük ve yuvarlaktır. Fantail, ryukin, oranda, lionhead, telescope, bubble eye ve pearlscale gibi süs biçimlerinde ise kuyruk ikiye ayrık (çift) ve genellikle perdeli/uzundur; üstten bakınca iki lob ayrı görünür.' },
  { id: 'anal-yuzgec', ad: 'Anal yüzgeç (tek)', view: 'yan', ozet: 'Karnın alt arka bölümünde tek yüzgeç.',
    aciklama: 'Gövdenin alt arka bölümünde, tek ve orta uzunlukta yüzgeçtir; sert, tırtıklı bir ön ışını vardır. Common, comet ve Bristol shubunkinde tektir; çift kuyruklu süs biçimlerinde genellikle çiftlidir (iki yanda birer lob) ve model bunu iki yüzgeç olarak çizer.' },
  { id: 'karin-yuzgeci', ad: 'Karın (pelvik) yüzgeçleri', view: 'yan', ozet: 'Karnın altında bir çift yüzgeç.',
    aciklama: 'Karnın altında, gövdenin ortasında bir çift yüzgeçtir; yön, denge ve yavaş manevralar için kullanılır.' },
  { id: 'gogus-yuzgeci', ad: 'Göğüs (pektoral) yüzgeçleri', view: 'yan', ozet: 'Solungaç kapağının arkasında bir çift yüzgeç.',
    aciklama: 'Solungaç kapağının arkasında, gövdenin iki yanında bir çift yüzgeçtir; yerinde durma, yavaş yüzme ve dönüşlerde çırpılır.' },
  { id: 'tuberkul', ad: 'Üreme tüberkülleri (erkek)', sex: 'erkek', view: 'yan', dogrulanmali: true, ozet: 'Üreme döneminde solungaç kapağı ve göğüs yüzgecinde beyaz benekler.',
    aciklama: 'Üreme mevsiminde olgun erkeklerin solungaç kapağında ve göğüs yüzgeçlerinin ön ışınlarında küçük, beyaz, kabarık noktalar (üreme tüberkülleri) belirir; bu işaret erkeği dişiden ayırmanın en bilinen yoludur ama yalnızca üreme döneminde görülür, dışında cinsiyet ayrımı güçtür. Tüberküller hastalık (örneğin beyaz benek/ich) ile karıştırılabilir; şüphede güvenilir kaynak ya da veteriner önerisi gerekir (kaynakla doğrulanmalı). Bu model üreme dönemi görünümünü şematik olarak gösterir.' },
  { id: 'karin-dolgun', ad: 'Dolgun karın (dişi, üreme dönemi)', sex: 'disi', view: 'ust', dogrulanmali: true, ozet: 'Üreme döneminde yumurtalı dişinin karnı belirgin biçimde dolgundur.',
    aciklama: 'Üreme döneminde yumurtalı dişide karın yanlara doğru belirgin biçimde dolgunlaşır; üstten bakınca erkeğe göre daha geniş görünür. Üreme dışında erkek ve dişi gövdeleri çok benzer olduğundan cinsiyet ayrımı güçtür; şişkin karın ise beslenme ya da hastalık (ör. yüzme kesesi, sıvı birikmesi) belirtisi de olabilir (kaynakla doğrulanmalı). Bu modelde dişi gövdesi şematik olarak daha dolgun çizilmiştir.' },
  { id: 'wen', ad: 'Wen (baş büyümesi)', formlar: ['oranda', 'lionhead'], view: 'on', dogrulanmali: true, ozet: 'Başta yumrulu, etli deri büyümesi (oranda: başlık; lionhead: baş ve yanaklar).',
    aciklama: 'Oranda ve lionhead gibi süs biçimlerinde başın üstünde ve (lionhead’de) yanaklarda gelişen yumrulu, etli deri dokusudur. Büyüklüğü yaşa, soya ve beslenmeye göre değişir ve genellikle ilk yıllarda gelişir; çok büyük wen gözü, solungaç ve ağız çevresini kapatıp hijyen ve görüş sorunlarına yol açabilir (kaynakla doğrulanmalı). Modelde şematik, yumrulu bir elipsoit olarak çizilmiştir; gerçek wen dokusu ve dağılımı bireye göre çok farklıdır.' },
  { id: 'teleskop-goz', ad: 'Teleskop gözler (dışarı taşan)', formlar: ['teleskop'], view: 'on', dogrulanmali: true, ozet: 'Telescope biçiminde yanlara doğru koni gibi dışarı taşan iri gözler.',
    aciklama: 'Telescope (teleskop, siyah olanlarda “moor”) biçiminde gözler başın iki yanında koni gibi dışarı taşar ve büyüktür. Yetiştirilmiş bir göz biçimidir; görüş alanı ve derinlik algısı normal gözlülerden farklı olabilir ve çıkıntılı gözler sert dekorda ya da rekabette yaralanmaya yatkındır (kaynakla doğrulanmalı). Modelde göz sapı şematik bir koni olarak çizilmiştir.' },
  { id: 'balon-kesesi', ad: 'Sıvı keseleri (bubble eye)', formlar: ['balon-goz'], view: 'on', dogrulanmali: true, ozet: 'Bubble eye biçiminde gözlerin altında sarkan, sıvı dolu iki torba.',
    aciklama: 'Bubble eye (balon göz) biçiminde gözler yukarı bakar ve altlarında sıvı dolu, ince cidarlı iki kese sarkar; keselerin yüzme sırasında salındığı anlatılır. Keseler çok hassastır, sert yüzeylerde ya da kenarlarda kolayca yırtılabilir ve enfeksiyon riski taşır; bu yüzden bu biçimin bakımı özel dikkat gerektirir (kaynakla doğrulanmalı). Modelde keseler şematik yarı saydam küreler olarak çizilmiştir.' },
  { id: 'omuz-kamburu', ad: 'Omuz kamburu (ryukin)', formlar: ['ryukin'], view: 'yan', dogrulanmali: true, ozet: 'Ryukin biçiminde başın hemen arkasında belirgin sırt kamburu.',
    aciklama: 'Ryukin biçiminin en belirgin özelliği, başın arkasında omuz hizasında yükselen kambur sırttır; gövde kısa ve derindir, sırt yüzgeci yüksek ve diktir. Kamburun derecesi bireye göre değişir ve iyi gelişmiş olması hatta gözetilen bir özellik olarak anılır; bu şematik modelde omuz yüksekliği artırılarak gösterilmiştir (kaynakla doğrulanmalı).' },
  { id: 'inci-pul', ad: 'İnci (kubbeli) pullar', formlar: ['inci'], view: 'yan', dogrulanmali: true, ozet: 'Pearlscale biçiminde pulların kabarık, inci tanesi gibi kubbeli olması.',
    aciklama: 'Pearlscale (inci pullu) biçiminde pullar düz değil, ortası kabarık, “inci tanesi” gibi kubbelidir; gövde de top gibi yuvarlaktır. Kubbeli pulların derinliği bireye göre değişir ve pul kaybı sonrası yeniden çıkan pullar farklı görünebilir (kaynakla doğrulanmalı). Modelde kabartma haritasıyla şematik gösterilmiştir.' },
];

export const partsFor = (sex: Sex, form?: string): Part[] => {
  const f = (FORM_IDS as readonly string[]).includes(form ?? '') ? (form as Form) : 'standart';
  return PARTS.filter((p) => (!p.sex || p.sex === sex) && (!p.formlar || p.formlar.includes(f)) && !(p.haric ?? []).includes(f));
};

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
  out.govde = on(0.62, 0.62);
  out.pullar = on(0.45, 1.05);
  const ll = lateralLine(sex, 22, form);
  const m = ll[Math.floor(ll.length * 0.55)];
  out['yan-cizgi'] = { pos: [m[0], m[1], m[2]], normal: norm3(surfaceAt(b, m[0] + 0.5, Math.PI * 0.5, 0).normal), mirror: true };
  const e = eyeGeom(sex, form);
  out.goz = { pos: [e.center[0] + e.normal[0] * e.radius, e.center[1] + e.normal[1] * e.radius, e.center[2] + e.normal[2] * e.radius], normal: e.normal, mirror: true };
  const ml = mouthLine(sex, 1, form);
  out.agiz = { pos: [ml[0][0] - 0.006, ml[0][1], 0.012], normal: norm3([-0.8, 0.05, 0.6]), mirror: true };
  const ns = nostrils(sex, form)[0];
  out['burun-delikleri'] = { pos: [ns.pos[0], ns.pos[1] + 0.012, ns.pos[2]], normal: norm3([-0.2, 0.8, 0.6]), mirror: true };
  out['solungac-kapagi'] = on(0.222, 1.55, 0.016);
  if (finsFor(sex, form).some((x) => x.id === 'sirt')) out['sirt-yuzgeci'] = { pos: finPoint(sex, 'sirt', 0.4, 0.62, form), normal: null, mirror: true, flex: 0.2 };
  out['kuyruk-yuzgeci'] = { pos: finPoint(sex, 'kuyruk', 0.25, 0.78, form), normal: null, mirror: false, flex: 0.9 };
  out['anal-yuzgec'] = { pos: finPoint(sex, 'anal', 0.5, 0.7, form), normal: null, mirror: false, flex: 0.3 };
  out['karin-yuzgeci'] = { pos: finPoint(sex, 'karin', 0.5, 0.7, form), normal: null, mirror: true, flex: 0.3 };
  out['gogus-yuzgeci'] = { pos: finPoint(sex, 'gogus', 0.5, 0.7, form), normal: null, mirror: true, flex: 0.6 };
  const wen = wenSpec(sex, form);
  if (wen) out.wen = { pos: [wen.center[0], wen.center[1] + wen.radii[1] * (1 + wen.amp * 0.5) + 0.012, wen.center[2] + 0.012], normal: norm3([0, 1, 0.3]), mirror: true };
  if (form === 'teleskop') out['teleskop-goz'] = { pos: [e.center[0] + 0.01, e.center[1] + e.radius * 0.8, e.center[2] + e.radius * 0.9], normal: norm3([0, 0.4, 1]), mirror: true };
  const sac = eyeExtras(sex, form).sac;
  if (sac) out['balon-kesesi'] = { pos: [sac.center[0], sac.center[1] - sac.radii[1] * 0.6, sac.center[2] + sac.radii[2] * 0.85], normal: norm3([0, -0.3, 1]), mirror: true };
  if (form === 'ryukin') out['omuz-kamburu'] = on(0.3, 0.1, 0.014);
  if (form === 'inci') out['inci-pul'] = on(0.5, 1.2, 0.014);
  if (sex === 'erkek') out.tuberkul = on(0.178, 1.15, 0.016);
  else out['karin-dolgun'] = on(0.45, 2.1, 0.014);
  return out;
}
