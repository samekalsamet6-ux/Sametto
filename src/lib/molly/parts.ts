// Molly anatomi parçaları: Türkçe kısa açıklamalar ve model üzerindeki bağlantı noktaları (saf veri).
import { makeAnchors, type Anchor, type Part, type PartId, type ViewId } from '../livebearer/anchors';
import { M, BODY, type Sex } from './model';
import { PART_OVERRIDES } from './forms';

export type { Anchor, Part, PartId, ViewId };

export const PARTS: Part[] = [
  { id: 'agiz', ad: 'Ağız', ozet: 'Küçük, yukarı bakan ağız; yassı baş.', view: 'yan',
    aciklama: 'Mollinin başı yassıdır ve ağzı küçük, yukarı bakar (üst konumlu). Bu yapı su yüzeyine yakın yemleri ve yüzeylerdeki alg ile yosun örtüsünü toplamaya uygundur; mollyler bitkisel ağırlıklı beslenmeyi sever. Ağız küçük olduğu için yemin tane boyutu önemlidir.' },
  { id: 'goz', ad: 'Göz', ozet: 'Başın iki yanında iri gözler.', view: 'yan',
    aciklama: 'İri gözler başın iki yanında durur; göz bebeği siyah, çevresindeki iris varyeteye göre altın ya da gümüş tonludur. Gözde bulanıklık veya dışarı taşma bir sağlık sorunu işareti olabilir.' },
  { id: 'solungac-kapagi', ad: 'Solungaç kapağı (operkulum)', ozet: 'Solungaçları örten, nefesle açılıp kapanan kapak.', view: 'yan', wiki: 'oksijen-havalandirma',
    aciklama: 'Solungaçları koruyan kapaktır; balık nefes aldıkça ritmik biçimde hareket eder. Su yüzeyinde sık ve hızlı nefes alma çoğunlukla oksijen ya da su kalitesi sorununun işaretidir. Mollyler yüzeyden hava soluyormuş gibi görünebilir; bu davranış kötü su koşullarında artar.' },
  { id: 'yan-cizgi', ad: 'Yan çizgi', ozet: 'Su hareketini algılayan duyu sisteminin şematik gösterimi.', view: 'yan', dogrulanmali: true,
    aciklama: 'Yan çizgi sistemi balığın çevresindeki su hareketini ve basınç değişimini algılamasına yardım eder. Bu modelde çizgi yalnızca şematik olarak çizilmiştir; canlı doğuran balıklarda yan çizgi kanalının ne kadar belirgin olduğu kaynakla doğrulanmalıdır.' },
  { id: 'pul', ad: 'Pullar', ozet: 'Üst üste binen, büyük ve belirgin pullar.', view: 'yan',
    aciklama: 'Gövde, birbirinin üzerine binen pullarla kaplıdır; pullar ve üzerlerindeki mukus tabakası balığı korur. Mollyde pullar iridir ve sıralar halinde seçilebilir; parlak ve metalik görünüm pullardaki ışığı yansıtan hücrelerden gelir.' },
  { id: 'gogus-yuzgeci', ad: 'Göğüs yüzgeçleri', ozet: 'Gövdenin iki yanında, denge ve yön için çift yüzgeç.', view: 'yan',
    aciklama: 'Solungaç kapağının hemen arkasındaki çift yüzgeçtir. Denge, yön verme ve yavaş hareket için sürekli çırpılır. Bu yüzgeçlerin gövdeye yapışık tutulması dikkat edilmesi gereken bir belirti olabilir.' },
  { id: 'karin-yuzgeci', ad: 'Karın (pelvik) yüzgeçleri', ozet: 'Karnın altında küçük çift yüzgeç.', view: 'yan',
    aciklama: 'Karnın alt tarafında bulunan küçük çift yüzgeçtir; denge ve yön için kullanılır.' },
  { id: 'sirt-yuzgeci', ad: 'Sırt yüzgeci', ozet: 'Belirgin, geniş sırt yüzgeci; erkekte daha yüksek.', view: 'yan',
    aciklama: 'Mollyde sırt yüzgeci gövdeye göre geniştir ve çok sayıda ışından oluşur; erkeklerde genellikle daha yüksek ve gösterişlidir. Yüzgecin sürekli kapalı tutulması stres, soğuk su ya da hastalık işareti olabilir. Bu modeldeki yüzgeç standart boydadır; yelken (sailfin) molly türlerindeki çok yüksek, yelken benzeri sırt yüzgeci modellenmemiştir.' },
  { id: 'anal-yuzgec', ad: 'Anal yüzgeç', ozet: 'Dişide karnın arkasında yelpaze biçimli yüzgeç.', sex: 'disi', view: 'yan', wiki: 'gonopodium',
    aciklama: 'Dişide anal yüzgeç yelpaze biçimlidir. Erkekte aynı yüzgeç çubuk biçimli üreme organına (gonopodium) dönüşür; bu fark cinsiyet ayrımının en güvenilir işaretidir.' },
  { id: 'gonopodium', ad: 'Gonopodium', ozet: 'Erkekte anal yüzgecin dönüşmüş, çubuk biçimli üreme organı.', sex: 'erkek', view: 'yan', wiki: 'gonopodium',
    aciklama: 'Erkeğin anal yüzgeci olgunlaşırken çubuk biçimli bir organa dönüşür; buna gonopodium denir ve dişiyi içten döllemek için kullanılır. Erkekler dişiyi sık kovalar; grupta erkek başına birkaç dişi bulundurmak tek bir dişinin bunaltılmasını azaltır (genel hobi tavsiyesi).' },
  { id: 'kuyruk-sapi', ad: 'Kuyruk sapı', ozet: 'Gövdeyi kuyruk yüzgecine bağlayan kaslı bölge.', view: 'yan',
    aciklama: 'Gövdenin kuyruk yüzgecine bağlandığı kaslı bölgedir. Yüzme sırasında gövdedeki kas hareketini kuyruğa iletir.' },
  { id: 'kuyruk-yuzgeci', ad: 'Kuyruk yüzgeci', ozet: 'Yuvarlak (kürek biçimli) kuyruk yüzgeci.', view: 'yan', wiki: 'kuyruk-curumesi',
    aciklama: 'Mollinin standart kuyruğu yuvarlak, kürek biçimlidir; kuyruk yüzgeci balığı ileri iter. Kuyruğu lira biçimli (lyretail) olan ticari formlar da vardır, ancak bu modelde yalnızca standart yuvarlak kuyruk gösterilmiştir. Kenarlarda aşınma ve dağılma kuyruk çürümesinin işareti olabilir.' },
  { id: 'gravid-spot', ad: 'Gravid spot', ozet: 'Dişide anal yüzgeç yakınında, gebelikle ilişkili koyu leke.', sex: 'disi', view: 'yan', wiki: 'gravid-spot',
    aciklama: 'Dişinin anal yüzgeci yakınındaki koyu lekedir; gebelik ilerledikçe belirginleşebilir ve karın genişler. Siyah (karbon) gibi koyu varyetelerde leke görünmeyebilir; bu yüzden tek başına kesin gebelik kanıtı sayılmaz.' },
];

export const partsFor = (sex: Sex, form?: string): Part[] => {
  const ov = form ? PART_OVERRIDES[form] : undefined;
  return PARTS.filter((p) => !p.sex || p.sex === sex).map((p) => (ov?.[p.id] ? { ...p, ...ov[p.id] } : p));
};
export const partAnchors = makeAnchors(M);
export const bodyLength = (sex: Sex): number => BODY[sex].length;
