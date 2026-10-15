# 🐟 Akvaryum Üreticisi

Tarayıcıda ve Android'de (APK) çalışan, uzun soluklu akvaryum yetiştirme + aquascape oyunu. Arayüz Türkçe. Tek dosya: **`index.html`** (harici görsel/ses yok; her şey kodla üretilir).

Dört sütun: **üretim/genetik**, **aquascape tasarımı**, **öğrenme (ansiklopedi)**, **ilerleme**.

## Oyun özeti
- **Canlılar:** 8 tür: lepistes (26 ırk), endler, molly, platy, kılıç kuyruk, beta, Neocaridina karides, salyangoz. Türler arası melezler. Her canlı genlerinden prosedürel olarak çizilir.
- **Genetik:** XX/XY, cinsiyete bağlı kalıtım, çaprazlama, mutasyon, akrabalı üreme cezası, sperm depolama, soyağacı, Punnett önizleme. Beta için balon yuvası mini oyunu, karides ve salyangoz için kendi üreme düzenleri.
- **Tasarım Stüdyosu:** zemin fırçası, taş/kök, 30 bitki, dekor, ekipman, şablonlar, geri al/yinele, fotoğraf modu.
- **Su kimyası:** azot döngüsü, KH–CO₂–pH, 5 yosun türü, hastalık/ilaç/karantina, bitki büyüme ve budama.
- **Bilgi:** tür/bitki/taş kartları, sözlük, rehberler, Genetik Okulu dersleri.
- **İlerleme:** görevler, 17 başarım (bronz/gümüş/altın), pazar, mağaza, siparişler, araştırma ağacı, profil.
- **Meta:** 7 bölümlük hikâye ve dostluk seviyeleri, haftalık sergi + aquascape yarışması (5 stil jüri puanı), sezonlar ve arşiv, Sabit Hat + Genetik Defter, prestij "Yeni Şube".
- **Ses:** Web Audio ile üretken müzik (Ambient / Lo-fi / Sadece doğa), ambiyans (filtre, hava motoru, yağmur) ve efektler. Müzik sezona (kış çanları, bahar kuşları…), tank içeriğine (çok bitki → zengin armoni, beta → Doğu Asya gamı, biyotop → cırcır katmanı), ekrana (yarışma ruh hali) ve yağmurlu güne göre değişir.
- **Kayıt:** 3 yuva, sürümlü kayıt (şu an v5) ve göç, otomatik yedek, JSON dışa/içe aktarma.

## Çalıştırma
`index.html` dosyasını bir tarayıcıda açın (mobil öncelikli, masaüstü uyumlu).

Kısayollar (Akvaryum): `F` yem · `L` ışık · `S` hız · `+`/`-` yakınlaştır · `1–5` sekmeler · `H` merkez · `Esc` kapat.

## Geliştirme
Kaynak `src/` altında modüller halindedir; `python3 build.py` bunları tek `index.html` dosyasına birleştirir. Modüller dosya adına göre sıralı birleşir; yükleme sırası önemlidir (sonraki dosya `UI` yöntemlerini `Object.assign(UI, {...})` ile ekleyebilir veya sarmalayabilir).

`python3 build.py --native` aynısını `www/index.html` olarak yazar ve Google Fonts bağlantısı yerine `node_modules/@fontsource` yazı tiplerini gömer (APK için).

```
build.py               birleştirici (web ve --native)
src/style.css          tasarım dili ("sualtı cam"), temalar
src/body.html          SVG ikon seti + sayfa iskeleti + ekran bölümleri
src/js/
  00-util.js           matematik, tohumlanabilir RNG, gürültü, DOM yardımcıları
  01-data.js           türler, aleller, kuyruklar, lepistes ırkları, nadirlik
  02-genetics.js       genetik motoru, şema sistemi, soyağacı
  03-fish-art.js       genlerden balık dokusu + omurga tabanlı deformasyon
  04-creature.js       canlı verisi + yüzme simülasyonu
  04b-breeding.js      çiftleştirme, gebelik, doğum, yumurta
  05-scene.js          tank sahnesi, gün/gece, bitkiler, kabarcık, yem
  06-audio.js          üretken müzik, ambiyans, efektler
  07-save.js           yuvalar, sürüm/göç, yedek, XP/seviye
  08-ui.js             ekranlar, canlı kartı, ayarlar, kutlama
  08b-lab.js           Laboratuvar, yavru açılışı, soyağacı
  09-main.js           çekirdek: döngü, görevler, ekonomi bağlantıları
  09a-viewport.js      kamera, yakınlaştırma, dokunma jestleri
  10-tests.js          konsol testleri
  12-scape-data.js     zemin/taş/kök/bitki/ekipman/şablon tabloları
  12b-scape-art.js     taş/kök/dekor sprite + bitki çizicileri
  13-scape.js          aquascape modeli, geri alma
  13b-editor.js        Tasarım Stüdyosu
  13c-photo.js         fotoğraf modu
  14-chem.js           su kimyası + biyoloji simülasyonu
  14b-water-ui.js      su paneli, budama, kuru başlangıç
  15-info-data.js      tür kartı verileri, sözlük, rehberler, dersler
  15b-dex-ui.js        ansiklopedi + bilgi merkezi
  16-economy.js        görev/başarım/pazar/mağaza/sipariş/araştırma
  16b-economy-ui.js    ilerleme ekranları
  17-species.js        tür şemaları, fenotipler, ırk tabloları, melezler
  18-crawlers.js       karides/salyangoz davranışı + çizim
  19-species-ui.js     türe özel Laboratuvar arayüzü
  20-meta.js           hikâye, yarışma/jüri, sezon, sabit hat, prestij (mantık)
  20b-meta-ui.js       hikâye, yarışma, sezon, miras ekranları
  20c-meta-tests.js    Tests.meta() ve Tests.all()
  21-native.js         APK: Android geri tuşu, uygulama yaşam döngüsü
  22-tutorial.js       onboarding: sinematik + 10 adımlık ~5 dk eğitim
  23-music-link.js     müzik bağlamı: sezon, tank içeriği, hava durumu, yarışma ruh hali
  25-fish3d.js         3D balık: WebGL, sprite'tan şişirilmiş ağ, omurga dalga animasyonu, poz makinesi, portrelerde
  26-devgate.js        Geliştirici paneli şifre kilidi
  28-tanks.js          çoklu tank: raflar, tank geçişi, balık taşıma (su şoku), kayıt
  28b-tanks-ui.js      Merkez tank kaydırıcısı, Tanklarım penceresi, taşıma penceresi
  29-anim.js           animasyon cilası: sayaç yuvarlanma, para kabarcıkları, doğum ışıltısı, kum tozu, sıralı liste belirişi
  30-compat.js         uyum matrisi: mizaç, katman, avlanma, su aralığı + stres
  31-habitats.js       biyotop habitatları + habitat bazlı jüri + şablonlar
  32-living.js         asistan, sezon dekorları/etkinlikleri, bildirimler
  33-plan.js           üst plan görünümü, dükkân haritası
  34-traits.js         Özellik Defteri: kuyruk/gövde şekli-rengi, desen, boy koleksiyonu (Ansiklopedi > Özellikler)
  35-boosts.js         ödüllü reklam güçlendirmeleri (AdMob + demo yedek, günlük sınır; ADS_CFG.test=false mağaza öncesi)
  36-cards.js          profil kartı paylaşımı: kod üret/yapıştır, arkadaş listesi (sunucusuz)
  27-equip-art.js      ekipman çizimleri (filtre, ısıtıcı, difüzör, armatür…)
  24-depth.js         Genetik Defter tahminleri, gizli varyasyonlar, hat bonusu, ek başarımlar, koleksiyon ödülleri
```

## Testler
Tarayıcı konsolunda `Tests.all()`. Kapsam: Mendel 3:1, cinsiyete bağlı kalıtım, X–Y çaprazlama, cinsiyet oranı, akrabalık, mutasyon, ırk tanıma, üreme döngüsü, su kimyası, bilgi içeriği, ekonomi, türler (karides F1/F2, melez, beta), meta (jüri, yarışma, hikâye, sezon, kayıt göçü, sabit hat, çarpanlar). Tek tek de çağrılabilir: `Tests.meta()`, `Tests.species()` …

## Aşama durumu
- [x] **1 – Çekirdek:** tasarım dili, gezinti, kayıt, lepistes genetiği, balık çizici, yüzme, canlı kartı, müzik
- [x] **2 – Üreme:** sperm depolama, gebelik, akrabalı üreme, Laboratuvar, Punnett, soyağacı
- [x] **3 – Tasarım Stüdyosu:** zemin, taş/kök/bitki/dekor, ekipman, şablonlar, fotoğraf modu
- [x] **4 – Kimya & Biyoloji:** azot döngüsü, KH–CO₂–pH, yosun, hastalık, karantina
- [x] **5 – Ansiklopedi & Bilgi:** kartlar, sözlük, rehberler, Genetik Okulu
- [x] **6 – İlerleme:** görevler, başarımlar, pazar, mağaza, siparişler, araştırma
- [x] **7 – Türler:** endler, molly, platy, kılıç kuyruk, beta, karides, salyangoz, melezler
- [x] **8 – Meta & Cila:** hikâye, yarışmalar, sezonlar, Sabit Hat, prestij
- [x] **Aşama 9 – Şartname boşlukları:** onboarding, lo-fi + bağlama duyarlı müzik, Genetik Defter/gizli varyasyonlar, çoklu tank + tank geçişi, uyum matrisi, habitat biyotopları, ışık spektrumu, üst plan, sezon etkinlikleri + sınırlı dekor, asistan, bildirimler, 3D balık, gerçek tank ölçüleri, ekipman çizimleri
- [x] **Aşama 10 – Kalite sağlamlaştırma:** tüm ekranlar için otomatik tarama (NaN/undefined metin, taşma, konsol hatası), dokunma alanları ≥44 px, çevrimdışı dönüşte canlı/bitki korunur, bozuk kayıtta yedekten yükleme + kurtarma penceresi (uydurma veri onarılmaz), arka plan önbelleği
- [x] **APK:** Capacitor yapılandırması, çevrimdışı yazı tipleri, geri tuşu, GitHub Actions ile derleme

Henüz doğrulanmayanlar: gerçek cihazda dokunma jestleri ve akıcılık, müziğin kulakla değerlendirilmesi, imzalı yayın sürümü.

## Android APK (Capacitor)
Oyun bir WebView içinde çalışır (çevrimdışı, yazı tipleri gömülü). Uygulama kimliği `com.sametto.akvaryum`.

**Bulutta (önerilen):**
1. GitHub → **Actions** → **Android APK** → **Run workflow** (`.github/workflows/android.yml`; `src/` altındaki değişikliklerde `claude/new-session-m0dtk5` dalına push da tetikler).
2. Çalışma yeşil olunca sayfanın en altındaki **Artifacts** bölümünden `akvaryum-debug-apk` zip'ini indirin, içindeki `app-debug.apk`'yı telefona kurun (bilinmeyen kaynaklara izin verin; Play Protect uyarısında "Yine de yükle").
3. Çalışma yaklaşık 2–5 dakika sürer. Android SDK GitHub'ın makinesinde hazırdır, ayrıca kurulmaz.

**Yerelde:** Node 20 + JDK 17 + Android SDK ile
```
npm install
python3 build.py --native
npx cap add android
npx capacitor-assets generate --android --assetPath resources
npx cap sync android
cd android && ./gradlew assembleDebug
```
Çıktı: `android/app/build/outputs/apk/debug/app-debug.apk`. Dikey kilit için `AndroidManifest.xml` içindeki `<activity` etiketine `android:screenOrientation="portrait"` eklenir (workflow bunu otomatik yapar).

**İlgili dosyalar:** `package.json`, `capacitor.config.json`, `resources/` (simge ve açılış görseli), `src/js/21-native.js` (geri tuşu: pencere/fotoğraf modunu kapatır, ana ekranda çift basışla çıkış; arka plana geçince kayıt + ses duraklatma).

Bu bir **debug** APK'dır. Play Store için imzalı AAB ayrıca yapılandırılmalıdır.

**Not:** Oyun kayıtları cihazın içinde (localStorage) tutulur; uygulamayı silmek kayıtları siler. Önemli ilerlemeyi Ayarlar'dan dışa aktararak yedekleyin.

## Yayın öncesi kontrol listesi
- `src/js/35-boosts.js` içinde `ADS_CFG.test = false` yap (gerçek reklamlar).
- `docs/gizlilik-politikasi.md` dosyasını bir web adresinde yayınla (ör. GitHub Pages); Play Console ve AdMob'a bu adresi gir.
- Play Console: hedef kitleye çocukları ekle (Aileler politikası), veri güvenliği formunu doldur (yerel veri + AdMob), içerik derecelendirmesi.
- AdMob: uygulamayı çocuklara yönelik olarak işaretle; reklam içeriğini G ile sınırla.
- Release imzası (keystore) üret; debug APK mağazaya yüklenemez.
