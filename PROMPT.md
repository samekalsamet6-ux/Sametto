# Akvaryum Ustası — Oyun Prompt'u (Script Prompt)

Bu dosya, oyunu başka bir yapay zekâya (veya geliştiriciye) sıfırdan ya da genişleterek yaptırmak için hazırlanmış **ayrıntılı prompt**'tur. `index.html` bu prompt'un çalışan ilk uygulamasıdır.

---
## PROMPT

Tek dosyalık (HTML + CSS + vanilla JS, Canvas 2D, harici bağımlılık yok) bir **akvaryum canlısı yetiştirme ve genetik oyunu** yaz. Arayüz Türkçe olsun. Oyun gerçek zamanlı çalışsın, localStorage'a otomatik kayıt yapsın.

### 1. Temel döngü
Besle → suyu koru → ürüt → yavruları koru → seç/ıslah et → sat, sipariş ve sergiyle para kazan → yeni tür/ekipman/akvaryum al.
- 1 oyun günü ≈ 40 sn (1x/2x/4x/duraklat). Gün/gece döngüsü (ışık, balık hızı, floresan balıklar gece parlar).
- Başlangıç: 160₺, 3 lepistes (2 dişi, 1 erkek), sünger filtre, 2 bitki.

### 2. Türler (canlı doğuranlar – Poeciliidae)
| Tür | Gebelik (oyun günü) | Yavru | Sıcaklık | Not |
|---|---|---|---|---|
| Lepistes (Poecilia reticulata) | 5 | 5–18 | 23–28 °C | Erkek küçük, renkli, büyük kuyruk; dişi büyük |
| Moli (P. sphenops/latipinna) | 8 | 10–28 | 24–29 °C | Yosun yer, büyük, sailfin yelkeni |
| Plati (Xiphophorus maculatus) | 6 | 6–20 | 22–26 °C | Smokin, Mickey Mouse vb. |
Yeni türler para ile açılır (genişletilebilir: kılıç kuyruk, endler, betta vb.).

### 3. Genetik sistemi (oyunun kalbi)
Her balığın 7 geni, her gende **2 allel** (diploid) vardır: gövde rengi, desen, kuyruk şekli, kuyruk rengi, sırt yüzgeci, parlaklık, boy.
- Fenotip = baskınlık (`d`) değeri yüksek olan allel; çekinik allel gizli taşınır. Boy kantitatif (ortalama).
- Yavru her ebeveynden rastgele 1 allel alır (mayoz). Çiftleşme sırasında dişi spermi **depolar** (3 doğuma kadar).
- **Mutasyon** (~%3/gen, serumla ×2): nadir (`rare`) allellerin tek kaynağı; bulununca "yeni varyasyon" bildirimi + XP.
- Akrabalık (ortak ebeveyn/büyükebeveyn): ömür ↓, değer ↓, verim ↓ ("akraba üremesi uyarısı").
- Her allelin bir **değeri** (`v`) vardır; balık fiyatı = tür fiyatı × Π(1+(v−1)·0.32) × boy × sağlık × yaş çarpanı.

**Lepistes** — Renk: Gri(yabani), Mavi, Kırmızı, Yeşil, Turuncu, Sarı/Blond, Mor, Beyaz, Siyah, Albino(çekinik, kırmızı göz), Galaksi*, Flamingo*. Desen: Düz, Benekli, Çizgili, Mozaik, Yılan Derisi, Leopar, Kobra*, Yıldız Tozu*. Kuyruk: Kürek, Yuvarlak, Yelpaze, Delta, Lir, İğne, Peçe, Çift Kılıç*. Kuyruk rengi: Saydam, Uyumlu, Kırmızı, Mavi, Sarı, Turuncu, Siyah kenarlı, Mor, Neon*.
**Moli** — Renk: Siyah, Gümüş, Altın, Beyaz, Gün Batımı, Çikolata, Limon, Platin Mavi*, Gül Kurusu*. Desen: Dalmaçyalı, Mermer, Kaplan, Panda, Kaliko, Kaleydoskop*. Kuyruk: Yuvarlak, Yelpaze, Lir, Peçe, Elmas Kılıç*. Sırt: Normal/Yüksek/Yelken.
**Plati** — Renk: Kırmızı, Turuncu, Sarı, Mavi, Yeşil, Siyah, Beyaz, Neon Kızıl*. Desen: Smokin, Mickey, Kaliko, Yelpaze lekeli, Panda, Harlequin*. Kuyruk: Yuvarlak, Yelpaze, Kuyruklu Yıldız, Lir, Kılıç*.
(\* = yalnızca mutasyon/seçkin balıkla gelen nadir allel)

> Araştırma notu: Gerçek lepistes genetiğinde birçok renk/desen geni **eşeye bağlıdır** (X/Y: Bit, Ssb, Bcp, Rdt, Var…); blond/altın/albino/mavi gövde renkleri ise otosomal ve çekiniktir. Oyun sadeleştirilmiş otosomal model kullanır; "ileri seviye" modu olarak Y-bağlı desen/kuyruk renginin babadan oğula geçmesi eklenebilir. Gerçek gebelik 3–10 hafta (moli büyük türlerde uzun), yavru sayısı 10–100+; yetişkinler yavruları yer → bitki, yavru kutusu, ayırma.

### 4. Simülasyon
- **Su**: amonyak, nitrat, O₂, sıcaklık, pH, berraklık, yosun. Atık→amonyak→(filtre)→nitrat→(su değişimi/bitki). Işık+nitrat yosunu büyütür; moliler yosun yer. Isıtıcı hedefi ayarlanır.
- **Stres**: kötü su, soğuk/sıcak, kalabalık, hastalık → sağlık düşer → ölüm. Ölü balık kaldırılmazsa suyu kirletir.
- **Hastalıklar**: Beyaz benek (soğuk/stres), yüzgeç çürümesi (kirli su); bulaşır; ilaç veya su düzeltme ile geçer.
- **Yem**: pul, canlı yem (doğurganlık+renk), yosun tableti, yavru tozu; yenmeyen yem çürür.
- **Davranış**: yem kovalama, kur yapma (kalpler), yavrular bitkiye saklanır, gece yavaşlar, hasta balık dipte durur, aç yetişkin yavru yer.
- **Yavru kutusu**: ayrı alan, güvenli doğum.

### 5. Ekonomi & hedefler
Satış (%90), müşteri siparişleri (belirli gen kombinasyonu → yüksek ödül, süreli), 10 günde bir **Akvaryum Sergisi** (jüri puanı), itibar/XP seviyesi, 12 başarım, 4 akvaryum, 4 tank boyu, 4 arka plan, bitki/dekor, ekipman (3 kademe filtre, ısıtıcı, hava taşı, LED).

### 6. Arayüz & grafik gereksinimleri
- Canvas: gradyan su, ışık hüzmeleri, dalgalı yüzey, çakıl, sallanan bitkiler, çizimle dekorlar (kale, mağara, sandık…), baloncuklar, gece karartması, bulanıklık/yosun katmanı.
- **Prosedürel balık çizimi**: bezier gövde, kuyruk parametreleri (uzunluk, yükseklik, çatal, sivrilik, kılıç, dalgalanma), desenler (benek, çizgi, mozaik, yılan derisi, dalmaçyalı, panda…), metalik/altın parlaklık, floresan, albino kırmızı gözü, hamile leke, yaşa/cinsiyete göre boyut, hasta benekleri.
- HUD (para, gün/saat, XP, varyasyon sayısı), su kalite göstergeleri + mini grafik, filtreli balık listesi (mini portre), olay günlüğü, bildirimler.
- Modallar: balık detayı (portre, durum çubukları, **genotip tablosu**, taşıyıcı bilgisi, soy), mağaza (5 sekme), siparişler, **ansiklopedi** (keşfedilen alleller, kilitli ???), **üreme planlayıcı** (Punnett olasılık çubukları, akrabalık uyarısı), istatistik grafikleri (para, nüfus, tür/yaş dağılımı), başarımlar, sergi, menü/yardım.
- Mobil uyumlu düzen, WebAudio efektleri (baloncuk, kalp, doğum, para), ses kapatma.

### 7. Kod kalitesi
Veri odaklı (tür/allel tabloları), tek `G` durum nesnesi, saf fonksiyonlar (`phenotype`, `breed`, `fishValue`), versiyonlu kayıt, hata yakalamalı localStorage.

### 8. Genişletme fikirleri
Eşeye bağlı genler, sperm yarışı, sezonlar/olaylar (elektrik kesintisi, hastalık salgını), yarış/sergi kategorileri, çevrimdışı ilerleme, daha fazla tür (kılıç kuyruk, betta, kiklet), soy ağacı grafiği, ihracat/ithalat piyasası ve fiyat dalgalanması, mobil dokunmatik sürükle-bırak dekor.

---
## Kaynaklar
- Lepistes renk/desen genlerinin eşeye bağlılığı: Zoological Science 16 (BioOne) — [Linkage analysis of three sex-linked color pattern genes](https://bioone.org/journals/zoological-science/volume-16/issue-6/zsj.16.893/Linkage-Analysis-and-Mapping-of-Three-Sex-Linked-Color-Pattern/10.2108/zsj.16.893.full), [Variegated tail pattern](https://bioone.org/journals/zoological-science/volume-16/issue-3/zsj.16.431/Genetic-Basis-of-the-Variegated-Tail-Pattern-in-the-Guppy/10.2108/zsj.16.431.full)
- Lepistes kuyruk tipleri: [tankarium.com](https://www.tankarium.com/?p=10313)
- Moli çeşitleri/gebelik/yavru yeme: [Sailfin Molly](https://www.thatpetplace.com/Poecilia-velifera-assorted-sailfin-molly-208514), [Dalmatian Molly](https://www.thatpetplace.com/Poecilia-latipinna-dalmatian-molly-213579)
