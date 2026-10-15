export interface Symptom { id: string; label: string; group: 'Yüzüş ve davranış' | 'Görünüm' | 'Üreme ve yavru' | 'Genel' }
export interface Cause {
  id: string;
  title: string;
  wiki?: string;
  /** belirti id -> ağırlık (1-3) */
  weights: Record<string, number>;
  firstSteps: string[];
  tests: string[];
}

export const symptoms: Symptom[] = [
  { id: 'yuzeyde-nefes', label: 'Yüzeyde nefes alıyor / solungaçlar hızlı', group: 'Yüzüş ve davranış' },
  { id: 'yuzgec-kapali', label: 'Yüzgeçlerini kapalı tutuyor, köşede duruyor', group: 'Yüzüş ve davranış' },
  { id: 'surtunme', label: 'Eşyalara sürtünüyor / vücudunu sallıyor', group: 'Yüzüş ve davranış' },
  { id: 'sallanma', label: 'Yerinde sallanıyor', group: 'Yüzüş ve davranış' },
  { id: 'yem-yemiyor', label: 'Yem yemiyor', group: 'Yüzüş ve davranış' },
  { id: 'beyaz-noktalar', label: 'Tuz tanesi gibi beyaz noktalar', group: 'Görünüm' },
  { id: 'ince-toz-ortu', label: 'İnce, toz benzeri örtü', group: 'Görünüm' },
  { id: 'yuzgec-asinmasi', label: 'Yüzgeç kenarları aşınıyor / kısalıyor', group: 'Görünüm' },
  { id: 'pamuk-tuy', label: 'Pamuk benzeri beyaz tüylenme', group: 'Görünüm' },
  { id: 'sisme-pul-kabarma', label: 'Karın şişmesi / pulların kabarması', group: 'Görünüm' },
  { id: 'yara', label: 'Açık yara veya kırmızı bölge', group: 'Görünüm' },
  { id: 'renk-soluyor', label: 'Renkler soluyor', group: 'Görünüm' },
  { id: 'ince-karin', label: 'Çok ince / çökük karın', group: 'Görünüm' },
  { id: 'yavru-olumleri', label: 'Yavrular ölüyor', group: 'Üreme ve yavru' },
  { id: 'yavrular-kucuk', label: 'Yavrular küçük kalıyor / büyümüyor', group: 'Üreme ve yavru' },
  { id: 'dogum-olmuyor', label: 'Dişi hamile görünüyor ama doğurmuyor', group: 'Üreme ve yavru' },
  { id: 'ani-toplu-olum', label: 'Kısa sürede birden çok balık öldü', group: 'Genel' },
];

export const causes: Cause[] = [
  {
    id: 'azot', title: 'Amonyak / nitrit sorunu (döngü veya aşırı yük)', wiki: 'azot-dongusu',
    weights: { 'yuzeyde-nefes': 3, 'yuzgec-kapali': 2, 'ani-toplu-olum': 2, 'yavru-olumleri': 2, 'yem-yemiyor': 1, sallanma: 1, 'yuzgec-asinmasi': 1, 'renk-soluyor': 1 },
    firstSteps: ['Amonyak ve nitriti ölçün.', 'Yüksekse, klor giderici ile hazırlanmış ve sıcaklığı eşitlenmiş suyla kısmi su değişimi yapın.', 'Yemlemeyi azaltın; ölü balık ve artık yemi alın.', 'Havalandırmayı artırın.'],
    tests: ['Amonyak', 'Nitrit', 'Nitrat', 'pH'],
  },
  {
    id: 'oksijen', title: 'Düşük oksijen veya yüksek sıcaklık', wiki: 'oksijen-havalandirma',
    weights: { 'yuzeyde-nefes': 3, 'ani-toplu-olum': 1 },
    firstSteps: ['Havalandırmayı ve yüzey hareketini artırın.', 'Sıcaklığı kontrol edin; aşırı sıcaksa kademeli düşürün.', 'Kalabalık varsa yoğunluğu azaltın.'],
    tests: ['Sıcaklık', 'Amonyak/nitrit (nefes darlığı onlardan da olabilir)'],
  },
  {
    id: 'beyaz-benek', title: 'Beyaz benek hastalığı (ich) olasılığı', wiki: 'beyaz-benek',
    weights: { 'beyaz-noktalar': 3, surtunme: 2, 'yuzgec-kapali': 1, sallanma: 1 },
    firstSteps: ['Hasta balıkları karantinaya almayı değerlendirin.', 'Su değerlerini kontrol edin ve sıcaklığı sabitleyin.', 'Tedavi için ürün etiketine veya uzman görüşüne başvurun; doz uydurmayın.'],
    tests: ['Su testi', 'Gözlem: noktalar yüzgeç ve gövdede mi?'],
  },
  {
    id: 'kadife', title: 'Kadife hastalığı (velvet) olasılığı', wiki: 'kadife-hastaligi',
    weights: { 'ince-toz-ortu': 3, 'yuzeyde-nefes': 2, surtunme: 2, 'yuzgec-kapali': 1, 'ani-toplu-olum': 1 },
    firstSteps: ['Karantinaya alın; ışıkla yandan bakarak ince örtüyü doğrulayın.', 'Teşhisi zor bir hastalıktır: güvenilir kaynak veya uzmana danışın.'],
    tests: ['Su testi', 'El feneriyle yan ışık gözlemi'],
  },
  {
    id: 'gyrodactylus', title: 'Deri kurtçukları (Gyrodactylus) olasılığı', wiki: 'gyrodactylus',
    weights: { 'yuzgec-kapali': 2, surtunme: 3, 'renk-soluyor': 1, yara: 1 },
    firstSteps: ['Yeni balıkları ve hasta balığı ayırın; tüm tankın etkilenmiş olabileceğini düşünün.', 'Tedavi için ürün etiketine veya veteriner hekime başvurun; tuz banyoları türe göre farklı etki gösterir.', 'Su kalitesini düzeltin; stres bağışıklığı düşürür.'],
    tests: ['Gözlem: yüzgeçler vücuda yapışık mı, deride bulanıklık var mı?', 'Su testi'],
  },
  {
    id: 'yuzgec-curumesi', title: 'Yüzgeç / kuyruk çürümesi', wiki: 'kuyruk-curumesi',
    weights: { 'yuzgec-asinmasi': 3, 'yuzgec-kapali': 1 },
    firstSteps: ['Önce su kalitesini düzeltin (nitrat dahil).', 'Yüzgeç ısırması (saldırganlık) ihtimalini de gözleyin.', 'Ağır vakada uzman görüşü alın.'],
    tests: ['Amonyak, nitrit, nitrat'],
  },
  {
    id: 'bakteriyel', title: 'Bakteriyel enfeksiyon olasılığı', wiki: 'bakteriyel-enfeksiyon',
    weights: { 'sisme-pul-kabarma': 3, yara: 3, 'yem-yemiyor': 1, 'yuzgec-asinmasi': 1 },
    firstSteps: ['Hasta balığı ayırın.', 'Su kalitesini düzeltin.', 'Pulların kabarması / karın şişmesi ağır olabilir: uzman görüşü alın.'],
    tests: ['Su testi', 'Gözlem: tek balık mı, çoğu mu?'],
  },
  {
    id: 'mantar', title: 'Mantar benzeri örtü', wiki: 'mantar-enfeksiyonu',
    weights: { 'pamuk-tuy': 3, yara: 1 },
    firstSteps: ['Yara, kötü su veya zayıflık gibi zemini arayın.', 'Su değerlerini düzeltin.', 'Tedavi için ürün etiketine veya uzmana başvurun.'],
    tests: ['Su testi'],
  },
  {
    id: 'stres-soguk', title: 'Stres, soğuk veya sıcaklık dalgalanması', wiki: 'sallanma-hastaligi',
    weights: { sallanma: 3, 'yuzgec-kapali': 2, 'yem-yemiyor': 1, 'renk-soluyor': 1 },
    firstSteps: ['Sıcaklığı ve ısıtıcıyı kontrol edin.', 'Su değerlerini ölçün.', 'Ani değişimlerden ve kalabalıktan kaçının.'],
    tests: ['Sıcaklık (ikinci termometreyle doğrulayın)', 'Amonyak/nitrit'],
  },
  {
    id: 'klor-sok', title: 'Su değişimi sonrası şok (klor/kloramin, sıcaklık, pH farkı)', wiki: 'klor-kloramin',
    weights: { 'ani-toplu-olum': 2, 'yuzeyde-nefes': 1, 'yuzgec-kapali': 1 },
    firstSteps: ['Son su değişimini hatırlayın: giderici kullanıldı mı? Sıcaklık eşit miydi?', 'Gerekirse ek giderici ve hafif havalandırma.', 'Sonraki değişimleri küçük ve kademeli yapın.'],
    tests: ['pH', 'Sıcaklık', 'Su idaresi: klor mu kloramin mi?'],
  },
  {
    id: 'beslenme', title: 'Yetersiz veya dengesiz beslenme', wiki: 'yem-cesitleri',
    weights: { 'yavrular-kucuk': 3, 'renk-soluyor': 2, 'ince-karin': 2, 'yavru-olumleri': 1 },
    firstSteps: ['Yem çeşidini ve sıklığını gözden geçirin.', 'Yavrular için sık ve ince yem / canlı yem kullanın.', 'Yemin tarihini ve saklama koşullarını kontrol edin.'],
    tests: ['Yem kaydı', 'Su testi'],
  },
  {
    id: 'kalabalik', title: 'Aşırı kalabalık', wiki: 'yavru-yogunlugu',
    weights: { 'yavrular-kucuk': 2, 'yavru-olumleri': 1, 'yuzeyde-nefes': 1 },
    firstSteps: ['Balık sayısını ve hacmi gözden geçirin.', 'Büyüklerle küçükleri ayırın.', 'Nitratı düşük tutmak için su değişimini sıklaştırın.'],
    tests: ['Nitrat'],
  },
  {
    id: 'yavru-yeme', title: 'Yetişkinler yavruları yiyor', wiki: 'dogum-kutusu-ayristirma-agi',
    weights: { 'yavru-olumleri': 2 },
    firstSteps: ['Yavrular için yoğun sığınak (Java moss, yüzer bitki) sağlayın.', 'Gerekirse ayrı doğum / yavru tankı kullanın.'],
    tests: ['Gözlem: yavrular doğumdan hemen sonra mı kayboluyor?'],
  },
  {
    id: 'gebelik', title: 'Gebelik belirtisi yanıltıcı olabilir veya doğum henüz gelmedi', wiki: 'gravid-spot',
    weights: { 'dogum-olmuyor': 3 },
    firstSteps: ['Gravid spot ve karın şekli tek başına kesin kanıt değildir.', 'Sıcaklığı kontrol edin; düşük sıcaklık süreyi uzatabilir.', 'Dişiyi gereksiz müdahaleyle strese sokmayın.'],
    tests: ['Sıcaklık', 'Takvim: tahmini tarih (gebelik aracı)'],
  },
];
