# LEPİSTES (GUPPY) ÜRETİMİ — REHBER, WİKİ VE ARAÇLAR WEB SİTESİ
## Yapay Zekâ / Geliştirici İçin Ana Üretim Promptu (Script Prompt v1.0)

> Bu doküman, bir yapay zekâ kodlama asistanına (veya geliştiriciye) **olduğu gibi** verilebilecek eksiksiz bir görev tanımıdır.
> Not: "Lepstes" ifadesi **Lepistes (Poecilia reticulata, İng. Guppy)** olarak yorumlanmıştır. Farklı bir canlıysa 0. bölümü güncelleyin.

---

## 0. ROL, AMAÇ VE ÇALIŞMA ŞEKLİ

**Sen kıdemli bir full-stack geliştirici, içerik editörü ve akvaryum/lepistes yetiştiriciliği konusunda araştırmacı bir yazarsın.**

**Amaç:** Türkçe dilinde, lepistes üretimi (breeding) konusunda **yeni başlayan, orta seviye ve ileri/deneyimli** yetiştiricilerin hepsine hitap eden; üç parçalı bir web sitesi üret:

1. **Rehber (Guide):** Seviyeye göre sıralı, adım adım öğrenme yolu.
2. **Wiki:** Arama yapılabilir, birbirine bağlı, ansiklopedik madde tabanı (terimler, ırklar/varyetiler, genetik, hastalıklar, ekipman, su kimyası…).
3. **Araçlar (Tools):** Tarayıcıda çalışan yardımcı hesaplayıcılar ve takip araçları.

**Çalışma kuralları (zorunlu):**
- Önce **plan çıkar**, planı onaylatmadan kod yazmaya başlama (yalnızca belirsiz noktaları sor; makul varsayılan varsa sormadan ilerle ve varsayımı belirt).
- İşi **aşamalara (Faz 1–10)** böl; her aşama sonunda çalışır, test edilmiş, commit edilebilir durumda olsun.
- **Uydurma bilgi yazma.** Sayısal/biyolojik iddiaların her biri güvenilir kaynağa dayanmalı (bkz. 9. bölüm). Emin olmadığın bilgiyi `⚠ doğrulanmalı` etiketiyle işaretle ve listele.
- Hayvan refahı önceliklidir: Etik olmayan veya zarar verici uygulamaları (aşırı akraba çiftleştirme baskısı, ayıklamada eziyet vb.) **teşvik etme**; etik alternatifleri ve yasal/çevresel uyarıları (doğaya salmama) ekle.
- Her aşamada: ne yaptığını, hangi dosyaları oluşturduğunu, nasıl test edildiğini özetle.

---

## 1. HEDEF KİTLE VE KİŞİLER (PERSONA)

| Seviye | Persona | İhtiyaç | Site Davranışı |
|---|---|---|---|
| **Başlangıç** | İlk akvaryumunu kuran, "balıklar neden ölüyor?" diyen kişi | Güvenli kurulum, azot döngüsü, ilk çift, yavru bakımı, sade dil | Sade anlatım, görsel/şema, "Önce bunu yap" kutuları, sözlük tooltip'leri |
| **Orta** | 1-3 yıldır tutan, çoğaltan, hat (strain) oluşturmak isteyen | Seçilim, ayrıştırma, beslenme programı, hastalık önleme, rasyonel kapasite | Karşılaştırma tabloları, kontrol listeleri, hesaplayıcılar |
| **İleri** | Yarışma/sergi hedefli, saf hat geliştiren, satış yapan | Genetik (kalıtım modelleri), hat yönetimi, inbreeding katsayısı, standartlar, kayıt tutma, ekonomi | Derin teknik makaleler, Punnett/olasılık araçları, soy ağacı, veri dışa aktarma |

**Kural:** Her makalenin başında seviye rozeti (🟢 Başlangıç / 🟡 Orta / 🔴 İleri) ve tahmini okuma süresi olsun. Başlangıç içeriğinde jargon kullanılırsa ilk geçişte sözlüğe bağlantı verilsin.

---

## 2. TEKNİK MİMARİ (VARSAYILAN, DEĞİŞTİRİLEBİLİR)

Aksi belirtilmedikçe şu yığını kullan; gerekçesiyle belirt:

- **Statik odaklı, hızlı site:** Astro **veya** Next.js (SSG) — Markdown/MDX içerik + TypeScript.
- **Stil:** Tailwind CSS + erişilebilir bileşen kütüphanesi (örn. Radix UI).
- **İçerik:** `content/` altında MDX dosyaları + frontmatter (Zod ile şema doğrulama).
- **Arama:** İstemci taraflı tam metin arama (Pagefind veya FlexSearch) — Türkçe karakter ve ek (ekler) toleransı: `ı/i, ş/s, ğ/g, ö/o, ü/u, ç/c` normalizasyonu.
- **Araçlar:** Saf TypeScript hesaplama modülleri (`/lib/calculators/*`) + React/Svelte bileşenleri. Tüm hesaplar **tarayıcıda**, sunucusuz çalışsın.
- **Veri saklama:** Takip araçları için `localStorage`/IndexedDB; JSON **dışa/içe aktarma** zorunlu. Hesap/giriş **yok** (gizlilik).
- **Birim testleri:** Vitest — tüm hesaplayıcı fonksiyonlar için. E2E: Playwright (kritik akışlar).
- **Kalite:** ESLint, Prettier, TypeScript `strict`, CI (GitHub Actions: lint + test + build).
- **Dağıtım:** Statik hosting (Cloudflare Pages / Netlify / GitHub Pages) için hazır `build`.
- **PWA:** Çevrimdışı çalışma (araçlar ve okunmuş makaleler), kurulabilir.
- **Dil:** Türkçe birincil; i18n altyapısı (`tr`, ileride `en`) hazır olsun. Birimler: metrik (°C, litre, cm, gram).

### Dizin yapısı (öneri)
```
/src
  /content
    /guide/{baslangic,orta,ileri}/*.mdx
    /wiki/{terimler,varyeteler,genetik,hastaliklar,ekipman,su-kimyasi,beslenme,yontemler}/*.mdx
  /components      (Callout, LevelBadge, GlossaryTerm, DataTable, ToolShell …)
  /lib
    /calculators   (volume, stocking, water-change, genetics, inbreeding, growth, feed, cost…)
    /storage       (db, export/import, schema migrations)
    /search
  /pages | /app    (rotalar)
  /data            (varyeteler.json, parametre-araliklari.json, ilac-bilgileri.json, kaynaklar.json)
/tests
/public/images
```

---

## 3. BİLGİ MİMARİSİ (SİTE HARİTASI)

```
Ana Sayfa
├─ Rehber
│   ├─ 🟢 Başlangıç Yolu (12–15 ders)
│   ├─ 🟡 Orta Seviye Yolu (12–15 ders)
│   └─ 🔴 İleri Seviye Yolu (12–15 ders)
├─ Wiki (arama + kategori + etiket + A–Z)
├─ Araçlar (hesaplayıcılar + takip panoları)
├─ Sorun Giderme (belirtiden teşhise karar ağacı)
├─ Sözlük
├─ SSS
├─ Kaynaklar & Referanslar
└─ Hakkında / Etik / Sorumluluk Reddi / Katkı Rehberi
```

Ana sayfa: "Nereden başlamalıyım?" 3 seçenekli giriş (seviye testi mini-quiz dahil), öne çıkan araçlar, son güncellenen maddeler, hızlı arama.

---

## 4. REHBER İÇERİK PLANI (HER DERS: HEDEF → ANLATIM → ADIMLAR → HATALAR → KONTROL LİSTESİ → ÖZET → SONRAKİ DERS)

### 🟢 BAŞLANGIÇ YOLU
1. **Lepistes nedir?** Doğal yaşam alanı, canlı doğuran (ovovivipar) yapı, ömür, boyut, mizaç, neden ideal başlangıç balığı (ve neden "kolay" yanılgısı).
2. **Üretime başlamadan önce karar listesi:** Amaç, yer, zaman, yavruları nereye vereceğim, bütçe, yasal/etik notlar.
3. **Akvaryum seçimi ve yerleşimi:** Hacim önerileri (ana tank, doğum/ayrıştırma, yavru tankı), zemin, güvenlik.
4. **Ekipman:** Filtre türleri (sünger filtre öncelikli – yavru güvenliği), ısıtıcı/termostat, havalandırma, ışık, test kitleri, kepçe, ayrıştırma ağı/kutusu.
5. **Azot döngüsü (cycling):** Amonyak→nitrit→nitrat; balıksız/balıklı döngü; test sonuçları tablosu; sabır uyarıları.
6. **Su parametreleri ve hazırlama:** Sıcaklık, pH, GH/KH, klor/kloramin giderme, çeşme suyu analizi, su değişim rutini.
7. **Bitki ve dekor:** Java moss, Ceratophyllum, yüzer bitkiler vb. yavru sığınağı; toksik/uygunsuz dekordan kaçınma.
8. **Balık seçimi ve satın alma:** Sağlıklı balık işaretleri, karantina, ilk grup oranı (dişi:erkek), akraba olmayan hatlar.
9. **Beslenme temelleri:** Ne, ne kadar, ne sıklıkla; aşırı beslemenin zararı.
10. **Üreme biyolojisi (sade):** Çiftleşme, dişide sperm depolama, hamilelik belirtileri (gravid spot), gebelik süresi, doğum.
11. **Doğum ve ilk yavru bakımı:** Ayrıştırma yöntemleri, yetişkinlerin yavru yeme riski, ilk yem (artemia nauplii, toz yem, mikro yem).
12. **Yavru büyütme ilk 8 hafta:** Besleme sıklığı, su değişimi, gelişim kilometre taşları.
13. **Rutin bakım takvimi:** Günlük/haftalık/aylık kontrol listesi (yazdırılabilir).
14. **Sık yapılan 20 hata ve çözümleri.**
15. **Mini sınav + sonraki adım önerisi.**

### 🟡 ORTA SEVİYE YOLU
1. **Hedef belirleme:** Renk/kuyruk/boy standardı; hat (strain) kavramı.
2. **Ayrı tank sistemi tasarımı:** Erkek/dişi ayrımı, bekâr dişiler (virgin female) yönetimi, büyütme kademeleri.
3. **Cinsiyet ayrımı zamanı:** Gonopodium gelişimi, erken ayırma teknikleri.
4. **Seçilim (selection) temelleri:** Neyi ayıklarız, ne zaman, hangi kriterlerle; kayıt tutma.
5. **Çiftleştirme stratejileri:** Çoklu erkek/tek dişi, tek çift, kaçış dişi yöntemi, planlı çiftleşme.
6. **Gelişmiş beslenme:** Canlı yem (artemia, mikro solucan, daphnia), kalite kontrol, besleme programları, yem kaynaklı hastalıklar.
7. **Su kimyası ince ayar:** GH/KH/pH ilişkisi, sertlik ayarı, yağmur/ters ozmoz karışımları, mineral takviyesi.
8. **Hastalık önleme & karantina protokolü.**
9. **Yaygın hastalıklar ve tedavi:** Beyaz benek, kuyruk çürüması, bakteriyel enfeksiyonlar, parazitler, mantar, "sallanma/ince hastalığı" vb. (belirti → teşhis → tedavi → önlem).
10. **Büyüme optimizasyonu:** Yavru yoğunluğu, sıcaklık, su değişimi ve çürük/küçük kalan balık nedenleri.
11. **Üretim ölçeği ve kapasite planlaması.**
12. **Yem/tankı/elektrik maliyet tablosu ve satış temelleri.**
13. **Balık gönderimi/taşıma:** Torbalama, ısı kontrolü, süre.
14. **Mevsimsel yönetim:** Yaz/kış, elektrik kesintisi planı.
15. **Orta seviye sınav + ileri yola geçiş kontrol listesi.**

### 🔴 İLERİ SEVİYE YOLU
1. **Lepistes genetiğine giriş:** Kromozomlar, alel, baskın/çekinik, eşey kromozomları (XY), Y-bağlantılı, X-bağlantılı ve otozomal özellikler.
2. **Özellik kalıtım haritası:** Hangi özellik hangi kalıtım tipine sahip (kaynaklı tablo; belirsiz olanlar işaretli).
3. **Punnett ve olasılık hesapları:** Tek gen, iki gen, eşey-bağlantılı örnekler; beklenen oranlar ve gerçekçi sapmalar.
4. **Hat yönetimi:** Akraba çiftleştirme (inbreeding), hat çiftleştirme (linebreeding), dış kan (outcross), heterozis; inbreeding katsayısı.
5. **İnbreeding depresyonu:** Belirtiler (kısırlık, zayıf yavru, deformasyon), önlem ve rotasyon planları.
6. **Standartlar ve yarışma:** IFGA vb. standartlar, puanlama kriterleri, sergiye hazırlık. *(Güncel kural kitapları doğrulanmalı.)*
7. **Soy ağacı ve kayıt sistemi:** Birey/hat kodlama, pedigri tutma, veri tabanı şablonu.
8. **İleri seçilim:** Çoklu özellik seçimi, seçilim baskısı, kontrol grubu, nesil bazlı iyileştirme takibi.
9. **Gelişmiş canlı yem kültürleri:** Artemia, mikro solucan, Moina, kültür kurulumu, hijyen.
10. **Büyük ölçekli sistemler:** Merkezi filtrasyon, otomatik su değişimi, biyogüvenlik.
11. **Biyogüvenlik ve hastalık yönetimi:** Karantina sistemleri, ilaç dirençliliği, dezenfeksiyon.
12. **Ticari yetiştiricilik:** Maliyet analizi, fiyatlandırma, kalite güvence, etik satış, yasal gereklilikler (ülkeye göre kontrol).
13. **Yeni varyete geliştirme:** Hedef-tanım, çaprazlama tasarımı, kaç nesil, kayıt, isimlendirme.
14. **Bilimsel çalışmalar:** Okuma rehberi, literatür özetleri, kanıt düzeyi.
15. **Vaka çalışmaları** (anonim senaryolar): "Hat çöktü – neden?", "Renk kayboldu – neden?".

**Her ders için zorunlu bileşenler:** Öğrenme hedefleri · Ön koşullar · Gerekli araçlar/bağlantılı hesaplayıcı · Adım adım prosedür · ⚠ Uyarı kutuları · 🛠 Sorun giderme · ✅ Kontrol listesi · 📚 Kaynaklar · ➡ Sonraki ders.

---

## 5. WİKİ YAPISI VE MADDE ŞABLONU

### Kategoriler (minimum kapsam)
- **Terimler/Sözlük (A–Z):** gonopodium, gravid spot, sürü, strain, line breeding, outcross, fry, nauplii, GH/KH, TDS vb. (≥150 madde)
- **Varyeteler & kuyruk tipleri:** Delta, Fantail, Veiltail, Swordtail, Spadetail, Roundtail, Pintail, Lyretail, Flagtail vb. + renk/desen grupları (Mozaik, Snakeskin, Grass, Cobra, Tuxedo, Blond, Albino, Metal, Moscow, Endler ilişkisi vb.) *(Her madde: tanım, görsel ihtiyacı, genetik not, standart yorumu, üretim zorluğu.)*
- **Genetik:** Kalıtım tipleri, özellik listesi, hesaplama örnekleri.
- **Hastalıklar & parazitler:** Her biri için standart şablon (belirti, neden, bulaşma, teşhis, tedavi seçenekleri, önleme, ne zaman veteriner/uzman).
- **Su kimyası:** Sıcaklık, pH, GH, KH, amonyak/nitrit/nitrat, TDS, klor, oksijen.
- **Ekipman:** Filtre, ısıtıcı, test kitleri, ışık, ağlar, doğum kutuları, sistem rafları.
- **Beslenme:** Kuru, canlı, dondurulmuş yem; protein/yağ oranları; besleme planları.
- **Yöntemler:** Ayrıştırma, doğum, çiftleştirme, seçilim, kayıt tutma.
- **Bitkiler & dekor.**
- **Etik, yasal, çevresel konular.**

### Wiki madde frontmatter şeması
```yaml
title: ""
slug: ""
category: ""
level: baslangic|orta|ileri
summary: "160 karakter"
tags: []
related: [slug, slug]
sources: [kaynak-id]
last_reviewed: YYYY-MM-DD
confidence: yuksek|orta|dusuk   # içerik kanıt düzeyi
needs_verification: false
```

Her wiki sayfası: **özet kutusu → detay → ilişkili maddeler → kaynaklar → "bu sayfa yardımcı oldu mu?" geri bildirim**. Maddeler birbirine otomatik link (backlinks) ve sözlük tooltip'i ile bağlansın.

---

## 6. YARDIMCI ARAÇLAR (TOOLS) — DETAYLI GEREKSİNİMLER

Her araç: ayrı sayfa, giriş doğrulama, açıklayıcı örnek verisi, birim seçimi, sonuç yorumu, "nasıl hesaplandı" açılır paneli, yazdır/PDF, sonucu paylaşılabilir URL parametresi, **sorumluluk reddi**, vitest testleri.

| # | Araç | Girdi | Çıktı | Notlar |
|---|---|---|---|---|
| 1 | **Akvaryum hacim & net su hesaplayıcı** | En/boy/yükseklik, zemin/dekor payı | Brüt/net litre | Dikdörtgen, silindir, köşe tank |
| 2 | **Stok (balık sayısı) planlayıcı** | Net litre, filtre, bitki, hedef | Önerilen yetişkin sayısı + uyarılar | "Kural" yerine aralık ver; yavru yükü hesaba kat |
| 3 | **Su değişimi planlayıcı** | Hacim, nitrat ölçümü, hedef | Değişim oranı, sıklık, çeşme suyu dengeleme | Nitrat birikim grafiği |
| 4 | **Azot döngüsü takipçisi** | Günlük amonyak/nitrit/nitrat | Döngü ilerleme grafiği, "tamamlandı" durumu | Veri kaydı + dışa aktarma |
| 5 | **Sertlik/pH/TDS dönüştürücü** | GH/KH (dGH, ppm, mg/L), TDS | Dönüşüm + karışım hesabı | ters ozmoz–çeşme suyu karışım oranı |
| 6 | **Isı & oksijen uyarı aracı** | Sıcaklık | Metabolizma, gebelik süresi ve oksijen etkisi notları | |
| 7 | **Gebelik & doğum takvimi** | Çiftleşme/ayrıştırma tarihi, sıcaklık | Beklenen doğum aralığı | Sıcaklığa bağlı aralık (kaynakla doğrula) |
| 8 | **Yavru büyüme takipçisi** | Doğum tarihi, ölçüm (mm), sayım | Büyüme eğrisi, hedef karşılaştırma, uyarı | Yaş–boy referans eğrileri (kaynaklı) |
| 9 | **Yavru yoğunluğu & kapasite hesaplayıcı** | Yavru sayısı, yaş, tank litresi | Önerilen bölme/tank | |
| 10 | **Yem planlayıcı** | Balık sayısı/yaşı | Günlük yem grafiği, sıklık, canlı yem programı | |
| 11 | **Artemia (nauplii) kuluçka rehberi/zamanlayıcı** | Tuzluluk, sıcaklık | Çıkış süresi, tuz/su oranı, hasat saati | |
| 12 | **İlaç/tuz dozaj hesaplayıcı** | Net litre, ürün tipi | Doz, süre, su değişimi planı | ⚠ Ürün etiketi öncelikli; genel tuz banyoları için kaynaklı aralık; tehlike uyarıları |
| 13 | **Genetik Punnett hesaplayıcı** | Anne/baba genotipi, kalıtım tipi (otozomal baskın/çekinik, X-bağlantılı, Y-bağlantılı) | Yavru oran tablosu + beklenen sayı | Kalıtımı kesin bilinen özelliklerle sınırla; belirsizse uyarı |
| 14 | **İnbreeding katsayısı (Wright F) hesaplayıcı** | Soy ağacı (3–5 nesil) | F değeri + yorum | Birim testleri klasik örneklerle doğrulansın |
| 15 | **Soy ağacı/pedigri oluşturucu** | Birey kayıtları | Görsel soy ağacı, yazdır, JSON/CSV | |
| 16 | **Hat (strain) kayıt defteri** | Birey/doğum/seçilim/notlar | Filtrelenebilir tablo, nesil istatistikleri | IndexedDB |
| 17 | **Seçilim puan kartı** | Kriterler (renk, kuyruk simetrisi, boy, vücut) | Ağırlıklı puan, kıyas | Kullanıcı kriter ağırlıklarını özelleştirir |
| 18 | **Maliyet & kârlılık hesaplayıcı** | Elektrik, yem, tank, ilaç, satış fiyatı, verim | Maliyet/balık, başa baş, aylık tablo | Para birimi seçimi |
| 19 | **Bakım takvimi/hatırlatıcı oluşturucu** | Rutin tipi | .ics takvim dosyası, yazdırılabilir liste | Bildirim yok, .ics ile |
| 20 | **Hastalık teşhis yardımcısı** | Belirti seçimi (çok seçimli) | Olası nedenler + sorun giderme sayfası bağlantısı | Kesin teşhis iddiası yok, "olası" dili |
| 21 | **Seviye belirleme quizi** | 15–20 soru | Seviye + önerilen rehber yolu | |
| 22 | **Taşıma/gönderim hesaplayıcı** | Balık sayısı, süre, mevsim | Torba hacmi, oksijen, ısı notları | |

**Ortak teknik koşullar:** Saf fonksiyonlar (UI’dan bağımsız), tip güvenli, sınır durum testleri (0, negatif, büyük sayılar, boş girdi), Türkçe ondalık (`,`) desteği.

### Hesap formüllerinde dikkat
- Genetik: Mendel oranları **beklenen** değerdir; küçük örneklemde sapma normaldir — bunu sonuç ekranında açıkla.
- Wright katsayısı: yol (path) yöntemiyle; ortak ata tanımı ve döngüler için algoritma açıkça belgelensin.
- Stok planlayıcı: tek bir "litre başına cm" sabiti kullanma; filtre, bitki ve yavru yükünü ayrı faktörler olarak modelle ve belirsizliği aralıkla göster.
- İlaç dozları: yalnızca **etiket talimatına yönlendiren** yapı; hesaplayıcı yalnızca kullanıcıdan alınan "mg/L veya ml/L" etiket değerini hacimle çarpar.

---

## 7. SORUN GİDERME (KARAR AĞACI)

Etkileşimli akış: "Balıklarım ___" → belirti seçimi (yüzgeç kapalı, yüzeyde nefes, sallanma, beyaz noktalar, şişme, yavru ölümleri, doğum olmuyor, hamile ama doğurmuyor, renk soluyor…) → olası nedenler (olasılık sırasıyla) → test önerisi → acil önlem → kalıcı çözüm → ilgili wiki maddesi.

---

## 8. TASARIM, UX VE ERİŞİLEBİLİRLİK

- **Görsel kimlik:** Temiz, akvaryum temalı (derin mavi/yeşil + canlı vurgu rengi), okunabilir tipografi, bol boşluk. Açık/koyu tema.
- **Mobil öncelikli** (akvaryum başında telefonla kullanım), büyük dokunma hedefleri, tek elle kullanım.
- **Gezinti:** Yapışkan üst menü, kırıntı (breadcrumb), içindekiler (TOC), "önceki/sonraki ders".
- **Erişilebilirlik:** WCAG 2.2 AA; klavye gezintisi, ARIA, kontrast, `prefers-reduced-motion`, alt metinleri.
- **Performans:** Lighthouse ≥ 95 (Performans/Erişilebilirlik/SEO/En İyi Uygulamalar); görseller AVIF/WebP, lazy-load.
- **Boş durumlar / hata durumları** tasarlansın.
- **Yazdırma stilleri:** Kontrol listeleri ve araç sonuçları temiz yazdırılsın.
- **Görseller:** Telif sorunu olmayan, kendi çizim (SVG diyagram) veya lisanslı görseller; `credits.md` içinde atıf. Diyagram ihtiyacı: azot döngüsü, tank düzeni, gonopodium, kuyruk tipleri, Punnett örneği, soy ağacı.

---

## 9. İÇERİK KALİTESİ, DOĞRULUK VE KAYNAK POLİTİKASI

1. Her sayısal iddia için **en az bir kaynak** (akademik makale, üniversite/uzantı yayını, FishBase vb. veri tabanı, saygın dernek/standart belgesi, deneyimli yetiştirici literatürü). Forum bilgisi tek başına kaynak değildir; "topluluk uygulaması" olarak etiketlenir.
2. `data/kaynaklar.json` içinde kaynak künyesi (yazar, yıl, başlık, URL, erişim tarihi).
3. **Güvenlik kritik içerik** (ilaç, tuz, kimyasal, elektrik) için ekstra uyarı ve "uzman/veteriner" yönlendirmesi.
4. Doğrulanması gereken tipik değerler (kaynakla teyit edilip yazılacak): ideal sıcaklık aralığı, pH/GH/KH aralıkları, gebelik süresi–sıcaklık ilişkisi, doğum başına yavru sayıları, olgunlaşma yaşı, sperm depolama süresi, kalıtım tipleri (özellik bazında), tuz banyosu konsantrasyonları. **Bu değerleri bu doküman senin yerine vermiyor; kaynaktan doğrula.**
5. Her sayfada `last_reviewed` ve `confidence` alanı; 12 aydan eski sayfalar otomatik "gözden geçirilmeli" etiketi alsın.
6. Dil: net, saygılı, suçlayıcı olmayan; ünlü marka tavsiyesinden kaçın (veya marka-bağımsız özellik listesi ver); sponsorluk/ilişki varsa açıkla.
7. Yapay zekâ ile üretilen tüm içerik, yayından önce **insan editör kontrol listesi**nden geçmeli (`CONTENT_REVIEW.md`).

---

## 10. SEO, ANALİTİK, GİZLİLİK

- Anlamlı URL’ler (`/wiki/genetik/otozomal-cekinik`), `title`/`description`, OpenGraph, JSON-LD (`Article`, `FAQPage`, `HowTo`, `BreadcrumbList`), `sitemap.xml`, `robots.txt`, kanonik etiketler.
- Türkçe anahtar kelime stratejisi: "lepistes üretimi", "lepistes yavru bakımı", "lepistes genetiği", "lepistes hastalıkları", "lepistes su değerleri" vb. için kümeli içerik (pillar + cluster).
- Gizlilik odaklı analitik (örn. Plausible/Umami) veya hiç analitik yok; çerez bandı gerekmeyecek biçimde.
- KVKK uyumlu: yalnızca yerel veri; sunucuya kişisel veri gönderilmez.

---

## 11. AŞAMALI ÜRETİM PLANI (HER AŞAMADA ÇIKTI + KABUL KRİTERİ)

| Faz | İş | Kabul Kriteri |
|---|---|---|
| **1. Keşif & Plan** | Gereksinim özeti, varsayımlar, teknoloji gerekçesi, sayfa listesi, içerik envanteri | Onaylı plan dokümanı |
| **2. İskelet** | Proje kurulumu, lint/test/CI, layout, tema, nav, i18n, içerik şeması | `build` + `lint` + `test` geçer |
| **3. İçerik altyapısı** | MDX işleme, frontmatter doğrulama, sözlük tooltip, TOC, ilgili maddeler, arama | Örnek 5 sayfa tüm özelliklerle çalışır |
| **4. Başlangıç içeriği** | 15 ders + ilgili wiki maddeleri | Kaynaklı, kontrol listeli, düzenlenmiş |
| **5. Orta içerik** | 15 ders + hastalık/beslenme/su kimyası maddeleri | Aynı |
| **6. İleri içerik** | 15 ders + genetik/hat yönetimi maddeleri | Aynı |
| **7. Araçlar (1. dalga)** | Hacim, stok, su değişimi, azot döngüsü, gebelik takvimi, yem, bakım takvimi | Birim testleri ≥ %90 hesap kapsamı |
| **8. Araçlar (2. dalga)** | Genetik Punnett, inbreeding, pedigri, kayıt defteri, büyüme, maliyet, ilaç dozajı, teşhis | Doğrulanmış örnek senaryolar |
| **9. Sorun giderme + quiz + SSS** | Karar ağacı, seviye quizi | E2E testleri |
| **10. Cilalama & yayın** | Erişilebilirlik, performans, SEO, PWA, içerik gözden geçirme, 404/hata sayfaları, README, katkı rehberi | Lighthouse ≥ 95, axe ihlali yok, tüm link kontrolü geçer |

**Her fazın sonunda şunu raporla:** (1) yapılanlar, (2) dosya listesi, (3) çalıştırılan testler ve sonuçları, (4) `⚠ doğrulanmalı` içerik listesi, (5) sıradaki faz için sorular.

---

## 12. VERİ MODELLERİ (TASLAK)

```ts
type Level = 'baslangic' | 'orta' | 'ileri';

interface FishRecord {
  id: string; strainId: string; sex: 'M' | 'F' | 'U';
  birthDate: string; sireId?: string; damId?: string;
  traits: Record<string, string>; notes?: string;
  status: 'aktif' | 'satildi' | 'oldu' | 'ayiklandi';
}

interface BatchRecord {            // doğum / yavru grubu
  id: string; damId: string; sireIds: string[];
  birthDate: string; count: number;
  measurements: { date: string; avgLengthMm: number; sampleSize: number }[];
}

interface WaterLog {
  date: string; tankId: string;
  tempC?: number; ph?: number; gh?: number; kh?: number;
  nh3?: number; no2?: number; no3?: number; tds?: number; note?: string;
}

interface TankConfig { id: string; name: string; netLiters: number; purpose: 'ana'|'dogum'|'yavru'|'karantina'|'secilim'; }
```
Veri şeması sürümlü olsun (`schemaVersion`), içe aktarmada doğrulama ve geçiş (migration) yapılsın.

---

## 13. TEST VE KABUL KRİTERLERİ

- Tüm hesaplayıcılar: bilinen girdi–çıktı çiftleri, sınır ve hata durumları.
- Genetik: klasik 3:1 / 1:2:1 / X- ve Y-bağlantılı örnekler elle doğrulanmış olmalı.
- Wright F: ebeveyn–yavru çiftleşmesi (F=0,25), tam kardeş (F=0,25), yarım kardeş (F=0,125) gibi referans örnekler birim testinde yer almalı.
- E2E: arama, rehber ilerleme, bir araçtan veri kaydet → dışa aktar → içe aktar akışı.
- Erişilebilirlik: axe taraması CI’da.
- Kırık link, eksik kaynak ve eksik frontmatter CI’da hata verir.

---

## 14. ETİK VE SORUMLULUK

- Sorumluluk reddi: bilgiler eğitim amaçlıdır; ilaç/tedavi için uzman görüşü gerekir.
- Çevresel uyarı: Lepistes yabancı/istilacı olabilir; **asla doğaya salınmamalı.**
- Ayıklama (culling) konusu: gereksiz acı vermeyen, kabul gören insancıl yöntemlerle ve nazik dille ele alınsın; zorunlu kılınmasın, alternatifler (satış, bağış, hobi grupları) sunulsun.
- Satış yapanlar için: şeffaf bilgi, hastalıklı balık satmama, yerel mevzuata uyma hatırlatması.

---

## 15. TESLİM EDİLECEKLER

1. Çalışan web sitesi kaynak kodu + `README.md` (kurulum, geliştirme, içerik ekleme).
2. `/content` altında tüm rehber ve wiki içeriği.
3. `/lib/calculators` altında test edilmiş araç modülleri.
4. `CONTENT_REVIEW.md` (insan editör kontrol listesi) ve `OPEN_QUESTIONS.md` (doğrulanması gereken bilgiler).
5. `CONTRIBUTING.md`, `LICENSE`, `credits.md`.
6. CI iş akışı ve dağıtım talimatı.

---

## 16. BAŞLANGIÇ KOMUTU (AI'YA İLK MESAJ)

> "Yukarıdaki dokümanı oku. **Faz 1**'i uygula: (a) varsayımlarını ve sorularını listele, (b) önerdiğin teknoloji yığınını gerekçelendir, (c) sayfa/rota listesini ve içerik envanterini (rehber dersleri, wiki madde başlıkları, araç listesi) çıkar, (d) risk ve doğrulama gerektiren konuları belirt. Onayım gelmeden kod yazma."

---

## EK A — İÇERİK YAZIM STİL REHBERİ
- Başlangıç: kısa cümle, günlük dil, benzetme, "Neden?" açıklamaları.
- Orta: kıyas tabloları, karar kriterleri, örnek senaryolar.
- İleri: terminoloji, formül, kaynaklı tartışma, istisnalar ve belirsizlikler açıkça belirtilir.
- Her makale: 1 cümlelik özet, 3–5 maddelik "Hızlı Bilgi", ana metin, "Sık Hatalar", "Kontrol Listesi", kaynaklar.

## EK B — ÖRNEK WİKİ MADDESİ İSKELETİ (Hastalık)
```
# [Hastalık Adı]
Hızlı Bilgi: etken · belirti · bulaşıcılık · ciddiyet
## Belirtiler (görsel ihtiyacı işaretli)
## Nedenler ve Risk Faktörleri
## Teşhis (neleri ayırt etmeli)
## Tedavi Seçenekleri (etiket talimatı öncelikli, uyarılar)
## Önleme
## Ne Zaman Uzmana Danışmalı?
## İlgili Maddeler · Kaynaklar · Son gözden geçirme
```

## EK C — "ÇIKTI KALİTESİ" SON KONTROL SORULARI (AI her aşamada kendine sorsun)
1. Bu bilgi kaynağa dayanıyor mu, yoksa tahmin mi? Tahminse işaretledim mi?
2. Başlangıç seviyesi okuyucu bunu anlar mı, yanlış yönlendirilir mi?
3. Güvenlik/refah açısından riskli bir öneri var mı?
4. Araç sonuçları testle doğrulandı mı?
5. Mobil, klavye ve ekran okuyucuyla kullanılabilir mi?
6. İçerikler arası tutarlılık (aynı değer her yerde aynı mı)?
