export type Tier = 'baslangic' | 'orta' | 'ileri';
export interface Question {
  id: string;
  tier: Tier;
  q: string;
  options: string[];
  correct: number;
  explain: string;
  wiki?: string;
}

export const questions: Question[] = [
  { id: 'b1', tier: 'baslangic', q: 'Azot döngüsünde maddeler hangi sırayla oluşur?', options: ['Nitrat → nitrit → amonyak', 'Amonyak → nitrit → nitrat', 'Nitrit → amonyak → nitrat'], correct: 1, explain: 'Balık atıklarından amonyak oluşur; bakteriler onu nitrite, sonra nitrata çevirir.', wiki: 'azot-dongusu' },
  { id: 'b2', tier: 'baslangic', q: 'Döngüsü tamamlanmış sağlıklı bir tankta amonyak ve nitrit ölçümü ne olmalı?', options: ['Yüksek', '0', 'Fark etmez'], correct: 1, explain: 'Her ikisi de balıklar için zehirlidir; olgun tankta 0 ölçülmelidir.', wiki: 'amonyak' },
  { id: 'b3', tier: 'baslangic', q: 'Lepistes nasıl çoğalır?', options: ['Yumurta bırakır', 'Canlı yavru doğurur', 'Köpükten yuva yapar'], correct: 1, explain: 'Lepistes ovovivipardır: yavrular serbest yüzer halde doğar.', wiki: 'ovovivipar' },
  { id: 'b4', tier: 'baslangic', q: 'Yavru tankında Java moss gibi sığınaklar neden önemlidir?', options: ['Sadece süs içindir', 'Yetişkinler yavruları yiyebilir; bitki saklanma alanı sağlar', 'Suyu ısıtır'], correct: 1, explain: 'Sığınak yavru sağkalımını artırır.', wiki: 'java-moss' },
  { id: 'b5', tier: 'baslangic', q: 'Filtre süngeri nasıl temizlenmelidir?', options: ['Sıcak musluk suyuyla yıkanır', 'Akvaryumdan alınan suda sıkılarak', 'Deterjanla'], correct: 1, explain: 'Klorlu su ve deterjan faydalı bakterileri öldürür.', wiki: 'sunger-filtre' },
  { id: 'b6', tier: 'baslangic', q: 'Yeni kurulan akvaryuma aynı gün balık eklemek…', options: ['Sorun değildir', 'Risklidir: önce azot döngüsü kurulmalıdır', 'Sadece kış aylarında risklidir'], correct: 1, explain: 'Bakteri topluluğu yokken amonyak ve nitrit birikir.', wiki: 'azot-dongusu' },

  { id: 'o1', tier: 'orta', q: 'Karantinanın temel amacı nedir?', options: ['Balıkları kilo aldırmak', 'Hastalığın ana sisteme girmesini engellemek', 'Yavruları ayırmak'], correct: 1, explain: 'Yeni balıklar ayrı ve gözlem altında tutularak hastalık riski azaltılır.', wiki: 'karantina' },
  { id: 'o2', tier: 'orta', q: 'Hat üretiminde neden bakire dişi kullanılır?', options: ['Daha renkli olurlar', 'Babalık kesin bilinir', 'Daha çok yavru doğururlar'], correct: 1, explain: 'Dişiler spermi saklayabildiğinden, babalık kesinliği için çiftleşmemiş dişi gerekir.', wiki: 'bakire-disi' },
  { id: 'o3', tier: 'orta', q: 'Seçilimde sağlık ve doğurganlık için en doğru yaklaşım hangisidir?', options: ['Yalnızca renge bakılır', 'Sağlık ve doğurganlık da kriter olmalıdır', 'Sağlık sonradan düşünülür'], correct: 1, explain: 'Güzel ama zayıf veya kısır bireyler hattı sürdürülemez kılar.', wiki: 'secilim' },
  { id: 'o4', tier: 'orta', q: 'Ters ozmoz suyunu mineral eklemeden tek başına kullanmak…', options: ['Güvenlidir', 'Riskli olabilir: mineral ve tampon eksikliği pH çökmesine yol açabilir', 'Sertliği artırır'], correct: 1, explain: 'RO suyu mineralden arındırılmıştır; genellikle çeşme suyuyla karıştırılır veya mineral eklenir.', wiki: 'ters-ozmoz-suyu' },
  { id: 'o5', tier: 'orta', q: 'İlaç dozu için en güvenilir yol hangisidir?', options: ['Forumdaki rastgele bir oran', 'Ürün etiketi ve uzman görüşü', 'Tahmini bir göz kararı'], correct: 1, explain: 'Yanlış doz balığa ve faydalı bakterilere zarar verebilir.', wiki: 'bakteriyel-enfeksiyon' },
  { id: 'o6', tier: 'orta', q: 'Erkekleri gonopodium tam şekillenmeden ayırmanın amacı nedir?', options: ['Dişileri çiftleşmemiş tutmak', 'Erkeklerin renklenmesini hızlandırmak', 'Yem tasarrufu'], correct: 0, explain: 'Gonopodium tamamlandığında dişiler çoktan çiftleşmiş olabilir.', wiki: 'cinsiyet-ayirimi' },

  { id: 'i1', tier: 'ileri', q: 'İki taşıyıcının (Bb × Bb) çaprazlamasında çekinik fenotip (bb) olasılığı nedir?', options: ['%50', '%25', '%75'], correct: 1, explain: 'Beklenen oran 1 BB : 2 Bb : 1 bb.', wiki: 'punnett-karesi' },
  { id: 'i2', tier: 'ileri', q: 'Tam kardeş çiftleşmesinden doğan yavrunun inbreeding katsayısı (F) nedir?', options: ['0,0625', '0,125', '0,25'], correct: 2, explain: 'Yol yöntemiyle iki ortak ata: 2 × (1/2)^3 = 0,25.', wiki: 'inbreeding-katsayisi' },
  { id: 'i3', tier: 'ileri', q: 'Y-bağlantılı bir özellik ideal durumda nasıl aktarılır?', options: ['Babadan oğullara', 'Anneden kızlara', 'Her iki cinsiyete eşit'], correct: 0, explain: 'Y yalnızca babadan oğula geçer; lepistesteki X–Y rekombinasyonu istisnalar yaratabilir.', wiki: 'y-bagli-kalitim' },
  { id: 'i4', tier: 'ileri', q: 'Blond, golden ve albino için bilimsel kaynaklarda bildirilen kalıtım tipi nedir?', options: ['Y-bağlantılı', 'Otozomal çekinik', 'X-bağlantılı baskın'], correct: 1, explain: 'Bu arka plan renk genleri otozomal çekinik olarak tanımlanır.', wiki: 'arka-plan-renk-genleri' },
  { id: 'i5', tier: 'ileri', q: 'Küçük bir örneklemde gözlenen oran 3:1 beklentisinden sapıyorsa ne düşünmelisiniz?', options: ['Kalıtım modeli mutlaka yanlıştır', 'Küçük örneklemde sapma normaldir; daha çok sayım gerekir', 'Oranlar hiç değişmez'], correct: 1, explain: 'Mendel oranları beklenen olasılıklardır.', wiki: 'punnett-karesi' },
  { id: 'i6', tier: 'ileri', q: 'Bir forumda okuduğunuz bilgiyi nasıl değerlendirirsiniz?', options: ['Kesin kanıt kabul ederim', 'Deneyim olarak alır, kanıt için kaynağı ararım', 'Hiç dikkate almam'], correct: 1, explain: 'Topluluk bilgisi değerlidir ama tek başına kanıt değildir.' },
];
