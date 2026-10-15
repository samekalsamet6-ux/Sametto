# Doğrulama raporu

Bu dosya, sitedeki bilgilerin hangi kaynağa dayandığını, hangilerinin düzeltildiğini ve hangilerinin **hâlâ doğrulanamadığını** açıkça listeler. Amaç: hata payını en aza indirmek ve emin olunmayan bilgiyi emin gibi sunmamak.

## Araştırma yöntemi ve sınırları
- Çalışmanın yürütüldüğü ortamda çoğu web sitesine (Wikipedia, FishBase, SeriouslyFish, PMC, üniversite siteleri…) **doğrudan erişim kapalıydı** (ağ politikası). Bilgiler **arama sonuçlarının özetleri** üzerinden okundu; hiçbir makalenin tam metni okunamadı.
- Bu nedenle “birincil kaynak” olarak işaretlenen kayıtlarda bile okunan şey genellikle özet/arama özetidir. Her kaynağın notu (`src/data/kaynaklar.json`, `/kaynaklar`) neyin okunduğunu belirtir.
- Hobi kılavuzları (perakendeci, forum, blog) kanıt değil, **topluluk bilgisi** olarak etiketlendi.
- Sayfa başlarındaki “Kanıt” rozeti: *kaynaklı* (ana iddialar hakemli/uzantı/veri tabanı), *karma* (kısmen kaynaklı), *topluluk bilgisi* (hobi uygulaması).

## 1. Düzeltilen / değiştirilen varsayımlar
| Önceki içerik | Araştırma sonucu | Yapılan |
|---|---|---|
| Gebelik 21–30 gün (araç varsayılanı) | Laboratuvar 25–35 gün (ort. ≈ 28), FishBase 4–6 hafta; 21–30 yalnızca hobi kılavuzları | Araç varsayılanı 25–35 gün; kaynak tablosu eklendi |
| Balık başına 4 L (stok aracı) | Guppi-only tank için ~40 L'de 6–8 balık (≈ 5–7 L/balık) | Varsayılan 6 L |
| “X–Y rekombinasyonu kısmi” kesin gibi | Bilimsel olarak tartışmalı (Tripathi 2009 vs. Nanda 2014/Kirkpatrick 2022) | Üç görüş açıkça yazıldı |
| Sperm depolama “aylar” | Kontrollü deney: 9 doğum / 9 ay; doğal popülasyon: ≥ 10 ay | Süreler ve kaynaklar yazıldı |
| Delta kuyruk “bilgi yok” | Tek yetiştirici: delta, çift kılıca baskın (genel model kanıtsız) | Kanıt düzeyiyle eklendi |
| Heterozis “doğrulanmalı” | Nakadate 2003: heterozis %-1,3–42,2, özelliğe göre değişir | Sayılar ve sınırlar eklendi |
| İnbreeding depresyonu genel | 4 guppi çalışması (sağkalım, doğurganlık, renk lekesi, parazit direnci) | Çalışmalar listelendi; “güvenli F eşiği yok” korundu |
| Karantina “süre doğrulanmalı” | Veteriner protokol ≥ 14 gün; üretici ≈ 4 hafta | İkisi de yazıldı |
| Nitrat “hedef doğrulanmalı” | Birim farkı (NO3 vs NO3-N, ×4,43); Camargo 2005: 10 mg NO3-N/L uzun vadede zararlı olabilir, en duyarlı türler için 2 | Birim uyarısı ve değerler eklendi |
| Artemia “parametreler doğrulanmalı” | SRAC 702: 28 °C'de 15–20 saat; >25 °C ve ışık; tuzluluk soya göre 15–35 g/L (FAO 15–70) | Eklendi |
| Torbalama “doğrulanmalı” | Tetra: 1/3 su, 2/3 oksijen; 10–15 dk yüzdürme | Eklendi; “15–20 dk” iddiası kaldırıldı |
| Beyaz benek genel | SRAC 476/UF-IFAS: yalnızca serbest evreler duyarlı; 24 °C üstü tomont < 4 gün; 30 °C üstü üreyemez | Yaşam döngüsü ve sıcaklık eklendi |
| Klor/kloramin | Tiyosülfat amonyağı bırakır (Arlington Su İdaresi) | Uyarı eklendi |
| Ayıklama anlatımı kaynaksız | AVMA 2020 ve RSPCA/OATA kılavuzları | Kabul edilebilir yöntemler ve koşullar eklendi |
| Yavru yemeyi “bitki çözer” | Sığınak etkisi popülasyona bağlı; ağ/kutu ekleri çoğunlukla etkisiz (ilişkili tür) | Kanıt notu eklendi, ayrı doğum tankı öne alındı |
| Sallanma (shimmies) açıklaması | Kaynaklar uyuşmuyor; hakemli çalışma yok | “Topluluk bilgisi/düşük güven” olarak yeniden yazıldı |
| Gyrodactylus yoktu | Guppilerde sık; Cardiff tuz banyosu çalışması | Wiki maddesi, sorun giderme nedeni, “sürtünme” belirtisi eklendi |
| Lepistes yayılışı, boyu, ömrü | FishBase: 5,0 cm SL (erkek)/6,0 cm SL (dişi); olgunluk ~2/3 ay; yayılış Venezuela–Guyana–Trinidad–Barbados–kuzey Brezilya | Eklendi (FishBase özeti) |

## 2. Doğrulanan ve kaynaklı bilgiler (özet)
- Blond/golden/albino otozomal çekiniktir; snakeskin Y-bağlantılı Ssb geniyle ilişkilidir (Kottler 2013; Phang 1999; Paris 2022).
- Wright F: tam kardeş 0,25; yarım kardeş 0,125; ilk kuzen 0,0625; ebeveyn × yavru 0,25 (standart yol yöntemi; sitedeki birim testleri yeniden üretir).
- Amonyak toksisitesi pH/sıcaklıkla artar; nitrit methemoglobin yapar, klorür korur (SRAC/uzantı yayınları).
- Yüksek sıcaklık (32 °C) üremeyi bozar; en iyi yavru üretimi 25–27 °C (Dzikowski 2001).
- Guppiler tuzlu suya belirli bir ölçüde dayanır; ani maruziyette ölümler 10 ppt'den sonra başlar (Sri Lanka çalışması, küçük örneklem).
- Guppiler Türkiye'de doğal sularda yerleşmiştir (Türkmen 2019; Kırankaya & Ekmekçi 2021): “doğaya salmayın” uyarısı bu yüzden önemlidir.

## 3. Hâlâ doğrulanamayan veya düşük kanıtlı konular
`needs_verification: true` olan sayfalar (`docs/OPEN_QUESTIONS.md`) ve nedenleri:
- **Cinsiyet ayrımı zamanı (gonopodium 3–6 hafta):** yalnızca hobi kaynakları; hakemli staging çalışması bulunamadı.
- **Kadife hastalığı:** yalnızca hobi/perakende kaynakları; bakır dozları kaynaklar arasında çelişiyor; veteriner kaynağı okunamadı.
- **Sallanma (shimmies):** kaynaklar uyuşmuyor; hakemli çalışma yok.
- **X-bağlantılı özellikler:** hangi hobi özelliğinin X-bağlantılı olduğunu gösteren okunabilir kaynak yok (yalnızca “42 özellikten 2'si”, ikincil).
- **Yarışma standartları (IFGA):** birincil kural kitabı okunamadı; yalnızca ikincil anlatımlar.
- **Standart yem programı, yem sıklığı:** hakemli program yok; hobi aralıkları (3–8 öğün) etiketli.
- **Hafta-hafta yavru boy tablosu, doğum boyu:** güvenilir değer bulunamadı; büyüme aracı bu yüzden referans eğri içermez.
- **Dişi:erkek oranı:** erkek tacizi belgelenmiştir ama önerilen oran için bilimsel kaynak yok.
- **Su değişimi yüzdesi ve sıklığı:** rehberler birbirinden farklı (haftalık %20–%25'ten %50–70'e); bilimsel standart yok.
- **Su sertliği/pH aralıkları:** üç farklı hobi aralığı; hakemli değer yok.
- **Fishless cycling amonyak dozu (2–4 mg/L) ve süre:** topluluk bilgisi.
- **Ich için tuz/ısı protokolleri:** hobi kılavuzları (ör. %0,1–0,3, ~30 °C, 10–14 gün); hakemli doğrulama sınırlı, bu yüzden doz önerilmez.
- **Taşıma öncesi aç bırakma, kısa tatil dayanıklılığı:** topluluk uygulaması.

## 4. Araçlardaki varsayımlar
| Araç | Varsayım | Durum |
|---|---|---|
| Balık sayısı | 6 L/balık; filtre, bitki, su değişimi, yavru çarpanları | Temel değer hobi kılavuzlarından; **çarpanlar kaynaksız sezgi** (sayfada uyarı) |
| Gebelik takvimi | 25–35 gün | Kaynaklı aralık; kullanıcı değiştirebilir |
| Yem planlayıcı | Yeni doğan 4, genç 3, yetişkin 2 öğün | Hobi uygulaması (sayfada uyarı) |
| Sorun giderme | Belirti–neden ağırlıkları | Sezgisel puanlama; kesin teşhis değil (sayfada uyarı); uzman gözden geçirmeli |
| Etiket oranı ölçekleyici | Yok | Yalnızca etiketten alınan değeri hacimle çarpar |
| Büyüme takipçisi | Referans eğri yok | Bilinçli |
| Maliyet, pedigri, Punnett, Wright F | Matematiksel | Birim testli |

## 5. Önerilen sonraki doğrulamalar
1. Ağ erişimi açılırsa: FishBase, SeriouslyFish, PMC makalelerinin tam metinleri; IFGA kural kitabı; Noga *Fish Disease*; SRAC 476/479 ve UF/IFAS FA006'nın tuz-sıcaklık bölümleri.
2. Konuya hâkim bir akvaryum veteriner hekimi: hastalık sayfaları, sorun giderme ağırlıkları.
3. Deneyimli bir guppi yetiştiricisi: gonopodium zamanlaması, besleme programı, tank yoğunluğu, hat yönetimi.
