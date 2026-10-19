// Betta form (şekil) varyeteleri: yalnızca yüzgeç/kuyruk biçimini değiştirir; renk varyetesinden bağımsızdır (saf veri).
// Kaynaklar (hobi siteleri ve kulüp standartları): sınıf adları ve açı değerleri kaynağa göre değişir; belirsizler "doğrulanmalı" işaretlidir.
import type { SpeciesForm } from '../akvaryum/types';

export const FORM_GROUPS = ['Kısa yüzgeçli', 'Uzun kuyruklular (kuyruk açısına göre)', 'Yüzgeç dokusu', 'Özel yapılar'] as const;

export const FORMS: SpeciesForm[] = [
  { id: 'plakat', grup: FORM_GROUPS[0], ad: 'Plakat (standart)',
    aciklama: 'Kısa, yuvarlak kuyruklu ve kısa yüzgeçli, vahşi bettaya en yakın biçim; “plakat” (Tay dilinde “dövüşçü”) adı kısa yüzgeçli hat için kullanılır. Bu, sayfadaki başlangıç formudur ve diğer formlar ona göre kıyaslanır. Şematik yorum.' },
  { id: 'veiltail', grup: FORM_GROUPS[1], ad: 'Veiltail (perde kuyruk)',
    aciklama: 'En yaygın uzun yüzgeçli biçim: uzun, aşağı doğru sarkan, tabanı dolgun ve uca doğru yuvarlak-sivri daralan kuyruk; sırt ve anal yüzgeçler de uzundur. Kuyruk açıklığı genellikle 180°’nin çok altındadır. Bazı kaynaklara göre uluslararası yarışma sınıflarında artık ayrı bir veiltail sınıfı yoktur; ad ticarette yaygın olarak kullanılır.' },
  { id: 'spade', grup: FORM_GROUPS[1], ad: 'Spade tail (maça kuyruk)', dogrulanmali: true,
    aciklama: 'Tabanı geniş, uca doğru daralıp sivrilen maça (kürek) biçimli kuyruk. Veiltail ile sık karıştırılır; kaynaklarda ayrım net değildir, bu yüzden şematik bir yorumdur (kaynakla doğrulanmalı).' },
  { id: 'delta', grup: FORM_GROUPS[1], ad: 'Delta',
    aciklama: 'Üçgen (Yunan Δ harfi gibi) kuyruk: arka kenar nispeten düzdür ve yelpaze açıklığı halfmoon’un 180°’sine ulaşmaz; burada yaklaşık 90° civarı bir açı çizilmiştir. Delta ile super delta arasındaki açı sınırı kaynağa göre değişir (kaynakla doğrulanmalı).', dogrulanmali: true },
  { id: 'super-delta', grup: FORM_GROUPS[1], ad: 'Super delta',
    aciklama: 'Delta’dan daha geniş açılan ama halfmoon’un tam yarım dairesine ulaşmayan kuyruk (burada yaklaşık 140° civarı). Sırt ve anal yüzgeçler genişler. Açı sınırı kaynağa göre değişir (kaynakla doğrulanmalı).', dogrulanmali: true },
  { id: 'halfmoon', grup: FORM_GROUPS[1], ad: 'Halfmoon (yarım ay)',
    aciklama: 'Uluslararası yarışma standartlarının ölçütü olan biçim: kuyruk yüzgeci tam 180° açılarak düzgün yarım daire (“D” harfi) oluşturur; sırt ve anal yüzgeçler de geniş yelpazedir ve ışın dallanması yoğundur. Tüm yüzgeçlerin böylesine geniş olması bazı bireylerde yüzmeyi güçleştirebilir. Şematik yorum.' },
  { id: 'overhalfmoon', grup: FORM_GROUPS[1], ad: 'Overhalfmoon (OHM)', dogrulanmali: true,
    aciklama: 'Kuyruğun 180°’yi aşıp üst ve alt kenarlarının gövdeye doğru geri kıvrıldığı halfmoon (örn. 190–220°). Hobi dilinde yaygındır; sınıf ve açı tanımı kaynağa göre değişir, şematik bir yorumdur (kaynakla doğrulanmalı).' },
  { id: 'crowntail', grup: FORM_GROUPS[2], ad: 'Crowntail (taç kuyruk)',
    aciklama: 'Işınlar arasındaki zar çok geri çekilmiştir; ışınlar zarın ötesine diken gibi uzar ve kenar “tarak/taç” gibi görünür. Dikenli doku kuyrukta, sırtta ve analda görülür; ayrıca delta, halfmoon vb. kuyruk şekilleriyle birleşebilir (burada ayrı bir doku olarak, orta açılı yelpaze üzerinde çizilmiştir). Dişide dikenler daha kısadır.' },
  { id: 'combtail', grup: FORM_GROUPS[2], ad: 'Combtail (tarak kuyruk)', dogrulanmali: true,
    aciklama: 'Crowntail’e benzer ama zar daha az geri çekilmiş, uçlarda hafif ışın uzantıları olan “tarak” görünümü; bazı kaynaklarda crowntail’in hafif biçimi ya da “half-sun” ile karıştırılır. Tanım tutarsızdır, şematik yorumdur (kaynakla doğrulanmalı).' },
  { id: 'rosetail', grup: FORM_GROUPS[2], ad: 'Rosetail / feathertail', dogrulanmali: true,
    aciklama: 'Işınlar çok dallanır ve üst üste biner; yüzgeç kenarı gül yaprağı gibi kıvrımlı, dalgalı görünür. Feathertail (tüy kuyruk) daha ince kıvrımlı, rosetail’in uç noktası olarak anlatılır; iki ad sıklıkla birbirinin yerine kullanıldığı için burada tek form olarak şematik çizilmiştir (kaynakla doğrulanmalı).' },
  { id: 'double-tail', grup: FORM_GROUPS[3], ad: 'Double tail (çift kuyruk)',
    aciklama: 'Kuyruk yüzgeci üst ve alt iki ayrı lobdan oluşur (kuyruk sapında ayrı iki kuyruk tabanı); gövde genellikle kısa ve derindir, sırt yüzgeci büyük ve uzundur. Genetik bir değişimdir; halfmoon, plakat gibi tiplerle birleşebilir (burada geniş yelpazeli iki lob olarak çizilmiştir). Gelişimsel sorunlarla ilişkili olabileceği söylenir (kaynakla doğrulanmalı).' },
  { id: 'dumbo', grup: FORM_GROUPS[3], ad: 'Dumbo ear (fil kulak)',
    aciklama: 'Göğüs yüzgeçleri belirgin büyüktür; solungaç kapağının arkasında kulak gibi yana açılıp çırpılır (“elephant ear”). Yalnızca göğüs yüzgeci farklıdır: kuyruk ve sırt yüzgeci ayrı bir hat olabilir, burada standart plakat gövdesiyle gösterilir.' },
];

export const formIds = FORMS.map((f) => f.id);
