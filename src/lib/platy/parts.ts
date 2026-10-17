// Plati anatomi parçaları: Türkçe kısa açıklamalar ve model üzerindeki bağlantı noktaları (saf veri).
import { makeAnchors, type Anchor, type Part, type PartId, type ViewId } from '../livebearer/anchors';
import { M, BODY, type Sex } from './model';

export type { Anchor, Part, PartId, ViewId };

export const PARTS: Part[] = [
  { id: 'agiz', ad: 'Ağız', ozet: 'Küçük, hafif yukarı bakan ağız.', view: 'yan',
    aciklama: 'Platinin ağzı küçüktür ve hafif yukarı bakar (üst konumlu); su yüzeyine yakın yemleri ve yüzeylerdeki alg ile yosun örtüsünü toplamaya uygundur. Platiler hem hayvansal hem bitkisel yemi yer. Ağız küçük olduğu için yemin tane boyutu önemlidir.' },
  { id: 'goz', ad: 'Göz', ozet: 'Başın iki yanında iri gözler.', view: 'yan',
    aciklama: 'İri gözler başın iki yanında durur; göz bebeği siyah, çevresindeki iris genellikle altın ya da gümüş tonludur. Gözde bulanıklık veya dışarı taşma bir sağlık sorunu işareti olabilir.' },
  { id: 'solungac-kapagi', ad: 'Solungaç kapağı (operkulum)', ozet: 'Solungaçları örten, nefesle açılıp kapanan kapak.', view: 'yan', wiki: 'oksijen-havalandirma',
    aciklama: 'Solungaçları koruyan kapaktır; balık nefes aldıkça ritmik biçimde hareket eder. Su yüzeyinde sık ve hızlı nefes alma çoğunlukla oksijen ya da su kalitesi sorununun işaretidir.' },
  { id: 'yan-cizgi', ad: 'Yan çizgi', ozet: 'Su hareketini algılayan duyu sisteminin şematik gösterimi.', view: 'yan', dogrulanmali: true,
    aciklama: 'Yan çizgi sistemi balığın çevresindeki su hareketini ve basınç değişimini algılamasına yardım eder. Bu modelde çizgi yalnızca şematik olarak çizilmiştir; canlı doğuran balıklarda yan çizgi kanalının ne kadar belirgin olduğu kaynakla doğrulanmalıdır.' },
  { id: 'pul', ad: 'Pullar', ozet: 'Üst üste binen yuvarlak pullar.', view: 'yan',
    aciklama: 'Gövde, birbirinin üzerine binen pullarla kaplıdır; pullar ve üzerlerindeki mukus tabakası balığı korur. Pullar sıralar halinde dizilir; parlak ve metalik görünüm pullardaki ışığı yansıtan hücrelerden gelir.' },
  { id: 'gogus-yuzgeci', ad: 'Göğüs yüzgeçleri', ozet: 'Gövdenin iki yanında, denge ve yön için çift yüzgeç.', view: 'yan',
    aciklama: 'Solungaç kapağının hemen arkasındaki çift yüzgeçtir. Denge, yön verme ve yavaş hareket için sürekli çırpılır. Bu yüzgeçlerin gövdeye yapışık tutulması dikkat edilmesi gereken bir belirti olabilir.' },
  { id: 'karin-yuzgeci', ad: 'Karın (pelvik) yüzgeçleri', ozet: 'Karnın altında küçük çift yüzgeç.', view: 'yan',
    aciklama: 'Karnın alt tarafında bulunan küçük çift yüzgeçtir; denge ve yön için kullanılır.' },
  { id: 'sirt-yuzgeci', ad: 'Sırt yüzgeci', ozet: 'Kısa ve dik sırt yüzgeci.', view: 'yan',
    aciklama: 'Platide sırt yüzgeci kısa ve diktir; yüzgeç ışınları dengeyi sağlar. Yüzgecin sürekli kapalı tutulması stres, soğuk su ya da hastalık işareti olabilir. Bazı ticari formlarda (ör. yüksek yüzgeçli “hi-fin”) sırt yüzgeci uzundur; bu şekil varyetesi modellenmemiştir.' },
  { id: 'anal-yuzgec', ad: 'Anal yüzgeç', ozet: 'Dişide karnın arkasında yelpaze biçimli yüzgeç.', sex: 'disi', view: 'yan', wiki: 'gonopodium',
    aciklama: 'Dişide anal yüzgeç yelpaze biçimlidir. Erkekte aynı yüzgeç çubuk biçimli üreme organına (gonopodium) dönüşür; bu fark cinsiyet ayrımının en güvenilir işaretidir.' },
  { id: 'gonopodium', ad: 'Gonopodium', ozet: 'Erkekte anal yüzgecin dönüşmüş, çubuk biçimli üreme organı.', sex: 'erkek', view: 'yan', wiki: 'gonopodium',
    aciklama: 'Erkeğin anal yüzgeci olgunlaşırken çubuk biçimli bir organa dönüşür; buna gonopodium denir ve dişiyi içten döllemek için kullanılır. Erkekler dişiyi sık kovalar; grupta erkek başına birkaç dişi bulundurmak tek bir dişinin bunaltılmasını azaltır (genel hobi tavsiyesi).' },
  { id: 'kuyruk-sapi', ad: 'Kuyruk sapı', ozet: 'Gövdeyi kuyruk yüzgecine bağlayan kaslı bölge.', view: 'yan',
    aciklama: 'Gövdenin kuyruk yüzgecine bağlandığı kaslı bölgedir. Yüzme sırasında gövdedeki kas hareketini kuyruğa iletir.' },
  { id: 'kuyruk-yuzgeci', ad: 'Kuyruk yüzgeci', ozet: 'Kısa, yelpaze biçimli yuvarlak kuyruk yüzgeci.', view: 'yan', wiki: 'kuyruk-curumesi',
    aciklama: 'Platinin standart kuyruğu kısa ve yuvarlaktır; kuyruk yüzgeci balığı ileri iter. Mickey Mouse gibi bazı varyetelerin adı kuyruk tabanındaki lekelerden gelir. Kenarlarda aşınma ve dağılma kuyruk çürümesinin işareti olabilir.' },
  { id: 'gravid-spot', ad: 'Gravid spot', ozet: 'Dişide anal yüzgeç yakınında, gebelikle ilişkili koyu leke.', sex: 'disi', view: 'yan', wiki: 'gravid-spot',
    aciklama: 'Dişinin anal yüzgeci yakınındaki koyu lekedir; gebelik ilerledikçe belirginleşebilir ve karın genişler. Tek başına kesin gebelik kanıtı değildir; koyu renkli (ör. tuxedo) bireylerde görünmeyebilir.' },
];

export const partsFor = (sex: Sex): Part[] => PARTS.filter((p) => !p.sex || p.sex === sex);
export const partAnchors = makeAnchors(M);
export const bodyLength = (sex: Sex): number => BODY[sex].length;
