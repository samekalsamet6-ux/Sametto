// Anatomi parçaları: Türkçe kısa açıklamalar ve model üzerindeki bağlantı noktaları (saf veri).
import {
  DISC, MOUTH_X, NARES_X, SPINE_U, clasper, discPoint, eyeSpec, gillSlits, pelvicSpec, spineSpec, spiracleSpec, surfaceY, tailPoint,
  type Face, type Sex, type Vec3,
} from './model';

export type PartId =
  | 'disk' | 'disk-kenari' | 'burun-ucu' | 'goz' | 'spirakul' | 'desen'
  | 'agiz' | 'burun-delikleri' | 'solungac-yarigi' | 'pelvik-yuzgec' | 'klasper'
  | 'kuyruk' | 'kuyruk-dikeni';

export type ViewId = 'ust' | 'alt' | 'yan' | 'on' | 'arka' | 'capraz';

export interface Part {
  id: PartId;
  ad: string;
  /** Tek cümlelik özet (liste ve ipucu için) */
  ozet: string;
  aciklama: string;
  /** Yalnızca bu cinsiyette görünür; yoksa ikisinde de */
  sex?: Sex;
  /** Yüzün hangi tarafında: ust, alt ya da her ikisi (kuyruk, kenar) */
  yuz: 'ust' | 'alt' | 'her';
  /** Parçayı en iyi gösteren görünüm */
  view: ViewId;
  dogrulanmali?: boolean;
  /** Güvenlik uyarısı içerir */
  uyari?: boolean;
}

export const PARTS: Part[] = [
  { id: 'disk', ad: 'Disk (göğüs yüzgeçleri + gövde)', yuz: 'her', view: 'ust', ozet: 'Baş, gövde ve göğüs yüzgeçlerinin kaynaşmasıyla oluşan yassı, yuvarlağımsı gövde.',
    aciklama: 'Vatozun yassı “diski”, göğüs (pektoral) yüzgeçlerinin baş ve gövdeyle yanlara doğru kaynaşmasından oluşur. İskelet kemik değil kıkırdaktır (köpekbalıklarında olduğu gibi). Tatlı su vatozlarında (Potamotrygonidae) disk yuvarlak ile oval arasındadır; bu modelde şematik olarak yuvarlatılmış bir eşkenar dörtgene yakın çizilmiştir. Oran türe ve bireye göre değişir.' },
  { id: 'disk-kenari', ad: 'Disk kenarı (dalga hareketi)', yuz: 'her', view: 'yan', dogrulanmali: true, ozet: 'Yüzmek için dalgalanan ince yüzgeç kenarı.',
    aciklama: 'Vatozlar, disk kenarını öndeki bölgeden arkaya ilerleyen dalgalarla oynatarak süzülür. “Yüzme animasyonu” bu dalgayı şematik olarak gösterir; gerçek dalga biçimi, sıklığı ve genliği türe, hıza ve yaşa göre değişir.' },
  { id: 'burun-ucu', ad: 'Burun ucu (rostrum)', yuz: 'ust', view: 'ust', dogrulanmali: true, ozet: 'Diskin ön ucu.',
    aciklama: 'Diskin ön ucudur. Tatlı su vatozlarında genellikle yuvarlak ya da hafif sivri ve kısadır; bu modelde şematik olarak hafif sivri gösterilmiştir. Gerçek burun biçimi türe göre değişir ve kaynakla doğrulanmalıdır.' },
  { id: 'goz', ad: 'Gözler (üstte)', yuz: 'ust', view: 'ust', ozet: 'Başın üst yüzünde, hafif yükselti üzerinde iki göz.',
    aciklama: 'Gözler diskin üst yüzünde, başın iki yanında hafif yükselti üzerindedir; böylece vatoz dipte yarı gömülü yatarken çevresini görebilir. Gözün hemen arkasında nefes deliği (spirakül) bulunur. Albinolarda göz pigmentsiz ve kırmızımsıdır.' },
  { id: 'spirakul', ad: 'Spirakül (nefes deliği)', yuz: 'ust', view: 'ust', ozet: 'Gözün hemen arkasındaki bir çift su giriş deliği.',
    aciklama: 'Gözün arkasında, üst yüzde bir çift açıklıktır. Vatozlar dipte yatarken solunum suyunun bir kısmını buradan alır; su solungaçlardan geçip alt yüzdeki solungaç yarıklarından çıkar. Böylece ağzın kumla temas ettiği durumlarda bile solunum sürebilir. Spirakülün sürekli kapalı ya da çok hızlı oynaması hastalık veya su sorunu belirtisi olabilir (kaynakla doğrulanmalı).' },
  { id: 'desen', ad: 'Sırt deseni (göz benekleri / ocelli)', yuz: 'ust', view: 'ust', dogrulanmali: true, ozet: 'Üst yüzdeki benek, halka ve ağ desenleri.',
    aciklama: 'Üst yüzdeki renk deseni türleri ayırt etmede kullanılan özelliklerdendir: Potamotrygon türlerinde halkalı göz benekleri (ocelli), benekler, lekeler ve ağ (retikülasyon) desenleri görülür. Desen bireyden bireye ve yaşla değişir; yalnızca desene bakarak tür kimliği koymak güvenilir değildir. Renk varyetelerine “Renk / desen” listesinden bakın.' },
  { id: 'agiz', ad: 'Ağız (alt yüzde)', yuz: 'alt', view: 'alt', ozet: 'Alt yüzde, burnun gerisinde yassı dişli ağız.',
    aciklama: 'Ağız alt yüzde, burun deliklerinin hemen gerisindedir. Dişler küçük ve yassıdır; kabuklu, solucan ve küçük balık gibi yemleri ezmeye uygundur. Ağız alt yüzde olduğu için vatoz yemi çoğunlukla zeminden alır.' },
  { id: 'burun-delikleri', ad: 'Burun delikleri (nares)', yuz: 'alt', view: 'alt', ozet: 'Ağzın önünde bir çift koku deliği ve aralarında deri perdesi.',
    aciklama: 'Ağzın önünde bir çift burun deliği bulunur; aralarındaki deri kıvrımı (nazal perde) su akışını yönlendirir. Koku, vatozun zeminde yem bulmasında önemli bir duyudur. Alt yüzde ayrıca elektrik alanlarını algılayan duyu organları (Lorenzini ampulleri) bulunur; bu modelde gösterilmemiştir.' },
  { id: 'solungac-yarigi', ad: 'Solungaç yarıkları (5 çift)', yuz: 'alt', view: 'alt', ozet: 'Alt yüzde ağzın arkasında beş çift solungaç açıklığı.',
    aciklama: 'Alt yüzde, ağzın arkasında her yanda beş solungaç yarığı bulunur; solungaçlardan geçen su buradan dışarı çıkar. Köpekbalıkları ve vatozlarda kemikli balıklardaki gibi solungaç kapağı (operkulum) yoktur.' },
  { id: 'pelvik-yuzgec', ad: 'Pelvik (karın) yüzgeçleri', yuz: 'her', view: 'arka', ozet: 'Diskin arkasında, kuyruk köküne yakın küçük bir çift yüzgeç.',
    aciklama: 'Diskin arka bölümünde, kuyruk köküne yakın küçük bir çift yüzgeçtir; arka kenarları diskin kenarından hafifçe taşabilir. Erkeklerde iç kenarında eşleşme organları (klasper) gelişir.' },
  { id: 'klasper', ad: 'Klasperler (erkekte)', yuz: 'her', view: 'alt', sex: 'erkek', dogrulanmali: true, ozet: 'Erkekte pelvik yüzgeçlerin iç kenarında çubuk biçimli iki eşleşme organı.',
    aciklama: 'Erkeklerde pelvik yüzgeçlerin iç kenarında bir çift çubuk biçimli eşleşme organı bulunur; iç döllenmeyi sağlar. Dişilerde yoktur ve cinsiyeti ayırt etmenin en pratik yoludur. Tatlı su vatozları yavruyu canlı doğurur. Genç bireylerde klasperler küçük olduğundan cinsiyet belirlemek zor olabilir; boyutu ve olgunlaşma yaşı türe göre değişir ve kaynakla doğrulanmalıdır.' },
  { id: 'kuyruk', ad: 'Kuyruk', yuz: 'her', view: 'ust', ozet: 'Diskin gerisinden uzanan, uca doğru incelen kırbaç benzeri kuyruk.',
    aciklama: 'Kuyruk diskin gerisinden uzanır ve uca doğru incelir; yüzmede balıklardaki kuyruk yüzgeci kadar itici değildir. Kökü kalın ve yassıdır, savunma için dikeni taşır. Bazı Potamotrygon türlerinde kuyruğun ucuna yakın bölgede deri kıvrımları ve koyu bantlar görülebilir; bu modelde yalnızca bant tonlaması vardır.' },
  { id: 'kuyruk-dikeni', ad: 'Kuyruk dikeni (zehirli)', yuz: 'ust', view: 'yan', uyari: true, dogrulanmali: true, ozet: 'Kuyruğun üstünde, savunma için dişli ve zehirli diken.',
    aciklama: 'Kuyruğun üst yüzünde, köke yakın bir yerde kenarları dişli, sivri bir diken bulunur; dikeni saran deri dokusunda zehir hücreleri vardır. Diken savunma içindir: vatoz sıkıştırıldığında ya da üzerine basıldığında kuyruğunu kaldırıp savurabilir. Yaralanma çok acı verici olabilir ve enfeksiyon riski taşır. Diken zaman zaman dökülüp yenilenir. Vatozu çıplak elle tutmaktan, ağa sıkıştırmaktan ve su içindeyken ani hareketlerden kaçının; yaralanırsanız bekletmeden tıbbi yardım alın. İlk yardım ve ayrıntılı kullanım için güvenilir kaynak ve hekim önerisi esastır. Bu sayfa bakım ya da müdahale rehberi değildir.' },
];

export const partsFor = (sex: Sex): Part[] => PARTS.filter((p) => !p.sex || p.sex === sex);

export interface Anchor {
  pos: Vec3;
  /** Yüzeye dik yön (dışa); null = her yönden görünür */
  normal: Vec3 | null;
  /** z işareti çevrilerek kameranın bulunduğu yana yansıtılabilir */
  mirror: boolean;
  /** Hareket dalgasının y'ye uygulanması için yarıçap (0 = hareketsiz) */
  rho: number;
  /** Kuyruk boyunca konum (yana sallanma için); yoksa undefined */
  tailU?: number;
}

const n3 = (v: Vec3): Vec3 => { const l = Math.hypot(...v) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

function onDisc(sex: Sex, face: Face, x: number, z: number, nrm: Vec3, off = 0.01, mirror = true): Anchor {
  const y = surfaceY(sex, face, x, z) + (face === 'ust' ? off : -off);
  return { pos: [x, y, z], normal: n3(nrm), mirror, rho: Math.min(1, Math.hypot(x / DISC[sex].aB, z / DISC[sex].b)) };
}

/** Modelin dinlenme duruşundaki bağlantı noktaları (+z yan tarafı için) */
export function partAnchors(sex: Sex): Partial<Record<PartId, Anchor>> {
  const out: Partial<Record<PartId, Anchor>> = {};
  const D = DISC[sex];
  out.disk = onDisc(sex, 'ust', 0.1, -0.35, [0, 1, 0], 0.02, true);
  const rim = discPoint(sex, 0.99, Math.PI * 0.5 + 0.55);
  out['disk-kenari'] = { pos: [rim[0], 0.01, rim[1]], normal: n3([0.3, 0.25, 0.9]), mirror: true, rho: 1 };
  const nose = discPoint(sex, 0.97, Math.PI);
  out['burun-ucu'] = { pos: [nose[0], surfaceY(sex, 'ust', nose[0], 0) + 0.02, 0], normal: n3([-0.7, 0.5, 0]), mirror: false, rho: 0.97 };
  const eye = eyeSpec(sex);
  out.goz = { pos: [eye.center[0], eye.center[1] + eye.radius * 0.9, eye.center[2]], normal: eye.normal, mirror: true, rho: Math.hypot(eye.center[0] / D.aF, eye.center[2] / D.b) };
  const sp = spiracleSpec(sex);
  out.spirakul = { pos: [sp.center[0], sp.center[1] + 0.03, sp.center[2]], normal: n3([0.1, 0.95, 0.3]), mirror: true, rho: Math.hypot(sp.center[0] / D.aF, sp.center[2] / D.b) };
  out.desen = onDisc(sex, 'ust', 0.45, 0.42, [0.1, 0.8, 0.45], 0.02);
  out.agiz = onDisc(sex, 'alt', MOUTH_X - 0.03, 0, [0, -1, 0], 0.02, false);
  out['burun-delikleri'] = onDisc(sex, 'alt', NARES_X, 0.115, [-0.1, -1, 0.1], 0.02);
  const gs = gillSlits(sex, 1)[2];
  out['solungac-yarigi'] = { pos: [gs[3][0], gs[3][1] - 0.02, gs[3][2]], normal: n3([0, -1, 0.1]), mirror: true, rho: 0.35 };
  const pv = pelvicSpec(sex, 1);
  out['pelvik-yuzgec'] = { pos: [pv.cx + pv.rx * 0.8, -0.02, pv.cz + 0.02 * Math.sign(pv.cz)], normal: null, mirror: true, rho: 1 };
  const c = clasper(sex, 1);
  if (c) out.klasper = { pos: [c.path[3][0], c.path[3][1] - 0.035, c.path[3][2]], normal: null, mirror: true, rho: 1 };
  const tu = 0.62;
  const tp = tailPoint(sex, tu);
  out.kuyruk = { pos: [tp[0], tp[1], tp[2]], normal: null, mirror: true, rho: Math.max(0, 0.9 * (1 - tu * 2)), tailU: tu };
  const s = spineSpec(sex);
  out['kuyruk-dikeni'] = { pos: [s.base[0] + s.dir[0] * s.length * 0.55, s.base[1] + s.dir[1] * s.length * 0.55 + 0.04, s.base[2]], normal: n3([0, 1, 0.5]), mirror: true, rho: Math.max(0, 0.9 * (1 - SPINE_U * 2)), tailU: SPINE_U };
  return out;
}
