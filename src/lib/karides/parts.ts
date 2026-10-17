// Anatomi parçaları: Türkçe kısa açıklamalar (saf veri). Modeldeki bağlantı noktaları viewer.ts içinde kurulur.
import type { Sex } from './model';

export type PartId =
  | 'rostrum' | 'karapaks' | 'goz' | 'anten' | 'antenul' | 'agiz' | 'yuruyen-bacak' | 'kiskac'
  | 'karin' | 'yuzme-bacagi' | 'telson' | 'uropod' | 'eyer' | 'yumurta' | 'appendix';

export type ViewId = 'ust' | 'alt' | 'yan' | 'on' | 'arka' | 'capraz';

export interface Part {
  id: PartId;
  ad: string;
  ozet: string;
  aciklama: string;
  sex?: Sex;
  /** Parçayı en iyi gösteren görünüm */
  view: ViewId;
  dogrulanmali?: boolean;
  uyari?: boolean;
}

export const PARTS: Part[] = [
  { id: 'rostrum', ad: 'Rostrum (burun çıkıntısı)', view: 'yan', ozet: 'Karapaksın önünden uzanan, dişli ince çıkıntı.',
    aciklama: 'Karapaksın ön ucundan ileri uzanan sert, bıçak benzeri çıkıntıdır. Karideslerde (Caridea) üst ve alt kenarında küçük dişler bulunur; diş sayısı ve biçimi türlere göre ayırt edicidir. Neocaridina’da kısa ve görece düzdür. Bu modelde diş sayısı şematiktir.' },
  { id: 'karapaks', ad: 'Karapaks (baş-göğüs kabuğu)', view: 'yan', ozet: 'Baş ve göğüs bölümünü örten tek parça kabuk.',
    aciklama: 'Karidesin başı ile göğsü kaynaşmıştır (sefalotoraks) ve üstü karapaks denen kabukla örtülüdür. Kabuğun iki yan kenarı, altında solungaç odasını (branşiyal oda) çevreler; su bu odada dolaşır ve solungaçlar burada bulunur. Kabuk sert olduğundan karides büyürken periyodik olarak kabuk değiştirir (ecdysis); bu sırada eski kabuk sırtta yarılarak çıkar. Pigment hücreleri nedeniyle renk desenleri daha çok karapaksta ve karında görünür.' },
  { id: 'goz', ad: 'Saplı gözler', view: 'on', ozet: 'Başın önünde iki yanda kısa saplar üzerinde bileşik gözler.',
    aciklama: 'Bileşik gözler, rostrumun iki yanından çıkan hareketli saplar üzerinde durur; karides gövdesini oynatmadan geniş bir alanı görebilir. Neocaridina’nın gözleri çoğunlukla koyu (siyahımsı) görünür. Bu modelde göz küre olarak şematik çizilmiştir; yüzlerce küçük birimden oluşan gerçek yapı gösterilmemiştir.' },
  { id: 'anten', ad: 'Antenler (2. çift anten)', view: 'ust', ozet: 'Gövdeden uzun, ince, duyu görevli bir çift anten.',
    aciklama: 'Uzun ve ince kırbaç biçimli anten çifti dokunma ve kimyasal duyuda (koku/tat benzeri) görev yapar; karides yem ararken ve çevreyi tararken bunları sallar. Antenin tabanında “antenal pul” (skafoserit) denen küçük, yassı bir yaprak bulunur. Bu modelde antenler sürekli hafifçe sallanan zincirlerle gösterilmiştir.' },
  { id: 'antenul', ad: 'Antenüller (1. çift anten)', view: 'ust', ozet: 'Kısa, çatallı bir çift duyu uzantısı.',
    aciklama: 'Antenlerin önündeki daha kısa çifttir ve uca doğru iki ince kamçıya ayrılır. Koku/kimyasal algıda ve denge organının (statosist) bulunduğu taban bölümüyle yönelim algısında rol oynar. Bu modelde iki çatal şematik gösterilmiştir.' },
  { id: 'agiz', ad: 'Ağız parçaları (çene ve maksilliped)', view: 'alt', ozet: 'Alt yüzde ağız çevresinde yem tutan ve parçalayan küçük uzantılar.',
    aciklama: 'Ağız, baş bölümünün alt yüzündedir. Çeneler (mandibula) yemi ezer; çevresindeki maksiller ve üç çift maksilliped yemi tutup ağıza taşır. Karides çoğunlukla zemindeki yosun, biyofilm ve organik kırıntıları bu parçalarla işler. Bu modelde yalnızca ağız çevresindeki başlıca uzantılar şematik gösterilmiştir.' },
  { id: 'yuruyen-bacak', ad: 'Yürüme bacakları (pereiopodlar, 5 çift)', view: 'yan', ozet: 'Göğüsten çıkan 5 çift bacak; zeminde yürümek ve yem tutmak için.',
    aciklama: 'Göğüs bölümünden çıkan 5 çift bacağa pereiopod denir; çoğu eklemli, ince ve kısa parçalardan oluşur. Karides zeminde ve bitkilerde bunlarla yürür, tutunur ve yem işler. İlk iki çiftte küçük kıskaç (şela) bulunur; arka üç çift ise uçta tırnak benzeri tek parça ile biter. Bu modelde beş çift bacak dört halkalıdır; gerçek bacaktaki eklem sayısı daha fazladır (şematik).' },
  { id: 'kiskac', ad: 'Küçük kıskaçlar (ilk iki çift bacak)', view: 'on', ozet: 'Birinci ve ikinci bacak çiftlerinin ucundaki minik pensler.',
    aciklama: 'İlk iki bacak çiftinin ucunda küçük bir şişkin kısım ve iki parmaklı minik pens (şela/kıskaç) bulunur. Yem parçalarını tutmak, kemirmek ve vücut temizliği (tüy ve yosun toplama) için kullanılır; avlanma veya savunma için güçlü bir silah değildir. İkinci çift genellikle ilkinden biraz daha uzundur (şematik).' },
  { id: 'karin', ad: 'Karın (pleon), 6 halka', view: 'yan', ozet: 'Altı halkadan oluşan, kıvrılabilen kasla dolu karın bölümü.',
    aciklama: 'Karın (pleon) altı eklemli halkadan oluşur ve her halka sırt ile yanlarda bir plakayla (tergum ve plöron) örtülüdür. Halkalar birbirine geçmeli olduğundan karın hızla bükülüp kıvrılabilir; karides tehlikede kuyruğunu kıvırarak geriye doğru fırlar. Dişilerde plöronlar yumurtaları örtecek şekilde daha dolgun, karın daha yuvarlak çizilmiştir (şematik).' },
  { id: 'yuzme-bacagi', ad: 'Yüzme bacakları (pleopodlar, 5 çift)', view: 'alt', ozet: 'Karnın altında ilk beş halkada küçük kürek biçimli bacaklar.',
    aciklama: 'Karnın altında, ilk beş halkanın her birinde bir çift küçük, iki dallı yüzme bacağı (pleopod) bulunur. Art arda (önden arkaya doğru dalga gibi) çırpılarak su akıntısı yaratır; karideste yavaş yüzmeye, suyun yumurtaların ve gövdenin üzerinden akmasına yarar. Bu modelde “hareket” açıkken çırpma dalgası şematik gösterilir.' },
  { id: 'telson', ad: 'Telson (kuyruk ortası)', view: 'ust', ozet: 'Karın sonunda orta kuyruk plakası.',
    aciklama: 'Telson, vücudun son bölümüdür ve altıncı halkadan sonra gelen yassı, uca doğru daralan ortadaki kuyruk plakasıdır. Uçta ve kenarlarında küçük dikenler ve tüycükler bulunur; kuyruk yelpazesinin orta parçasını oluşturur. Şematik olarak sivri uçlu bir plaka çizilmiştir.' },
  { id: 'uropod', ad: 'Uropodlar (kuyruk yelpazesi yanları)', view: 'ust', ozet: 'Telsonun iki yanında birer çift yassı yelpaze yaprağı.',
    aciklama: 'Altıncı halkadan çıkan çift uropod ile telson birlikte “kuyruk yelpazesi”ni oluşturur. Karides kuyruğunu hızla kıvırdığında bu yelpaze geniş bir yüzey olarak suyu iterek geriye doğru fırlatır. Yelpaze yaprakları genellikle saydam ya da gövdeden açık renklidir; bu modelde iç ve dış dal tek yaprak olarak şematik gösterilmiştir.' },
  { id: 'eyer', ad: 'Eyer (dişide, sırtta)', view: 'ust', sex: 'disi', dogrulanmali: true, ozet: 'Olgun dişide karapaksın arkasında sırtta görünen sarımsı-yeşil alan.',
    aciklama: 'Üremeye hazır dişilerin karapaksı arka kısmında, yumurtalıkların gelişmesiyle sırtta sarımsı-yeşilimsi bir “eyer” görülebilir. Saydam gövdeli bireylerde daha belirgindir. Bu modelde eyer, karapaksın arkasında yumuşak bir leke olarak gösterilmiştir; gerçek görünüm ve süre bireye göre değişir (kaynakla doğrulanmalı).' },
  { id: 'yumurta', ad: 'Yumurtalar (berry)', view: 'alt', sex: 'disi', dogrulanmali: true, ozet: 'Dişide karnın altında yüzme bacaklarına tutunmuş yumurta kümesi.',
    aciklama: 'Dişi yumurtalarını döllendikten sonra karnının altında, yüzme bacaklarına tutturup taşır; bu duruma halk arasında “berry” (böğürtlen/meyve) denir. Yumurtalar sarımsı-yeşilimsi, gelişince koyulaşabilir ve yavrular su içinde yüzüp zemine yerleşir. Süre sıcaklığa bağlı olarak değişir (kaynakla doğrulanmalı). Bu modelde dişide “Yumurtalı (berry)” seçeneği ile gösterilir; eyer ile yumurta normalde farklı evrelerdir ve burada anlaşılırlık için birlikte çizilebilir.' },
  { id: 'appendix', ad: 'Appendix masculina (erkekte)', view: 'alt', sex: 'erkek', dogrulanmali: true, ozet: 'Erkekte ikinci yüzme bacağında küçük ek çıkıntı.',
    aciklama: 'Birçok karides türünde erkeklerin ikinci çift yüzme bacağında “appendix masculina” adlı küçük bir çıkıntı bulunduğu anlatılır; çiftleşmeyle ilişkilidir. Çıplak gözle görülmesi zordur ve türe göre değişir; bu modelde yalnızca küçük bir şematik çıkıntıdır (kaynakla doğrulanmalı). Erkekler genelde dişilerden daha küçük, ince ve soluk renklidir.' },
];

export const partsFor = (sex: Sex): Part[] => PARTS.filter((p) => !p.sex || p.sex === sex);
