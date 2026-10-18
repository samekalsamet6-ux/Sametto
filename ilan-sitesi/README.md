# Su Pazarı — balık ilanları (yerel geliştirme sürümü)

Akvaryum balığı ilanları için küçük bir web uygulaması. Farkı: her ilanda **satıcının yüklediği gerçek fotoğraflar zorunludur** ve ilan sayfasında yanında, seçilen tür / şekil / renk için **temsili bir 3B model** gösterilir. 3B modeller, bu depodaki `../src/lib/<tür>/index.ts` tür modüllerinden gelir (salt okunur kullanılır; kopyalanmaz).

> Bu klasör (`ilan-sitesi/`) depodaki Astro sitesinden bağımsızdır; kendi `package.json` dosyası vardır. Dağıtım yapılandırması yoktur: yalnızca yerel geliştirme içindir.

## Çalıştırma

Gereksinim: Node 22.13+ (`node:sqlite` ve `.ts` dosyalarını doğrudan çalıştırma için; 22.22 ile denendi).

```bash
cd ilan-sitesi
npm install                # vite, vitest, playwright test, typescript, axe-core (hepsi saf JS)
npm run seed               # örnek (DEMO) ilanlar + yer tutucu fotoğraflar
npm run dev                # http://127.0.0.1:5180  (Vite ara katman olarak çalışır)
```

Demo hesap (seed sonrası): `ornek.satici@example.test` / `ornek-parola-123`.

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme sunucusu (istemci kodu Vite ile anında derlenir) |
| `npm run build` | İstemci paketini `dist/client` altına üretir |
| `npm start` | Üretim kipi: derlenmiş paketi sunar, CSP başlığı ekler (`npm run build` gerekir) |
| `npm run seed` | Örnek ilanları ekler (zaten varsa atlar) |
| `npm run catalog` | `shared/catalog.json` dosyasını tür modüllerinden yeniden üretir |
| `npm test` | Birim + sunucu (API) testleri (vitest) |
| `npm run e2e` | Playwright uçtan uca testleri (masaüstü + mobil, `--workers=2`) |
| `npm run typecheck` | `tsc --noEmit` |

`three` için ikinci bir kopya kurulmaz: tür modülleri kök `node_modules/three` paketini kullanır (`vite.config.ts` içinde `resolve.alias` + `dedupe`).

Uçtan uca testler için tarayıcı yolu ortam değişkeniyle verilir (hiçbir zaman `playwright install` çalıştırılmaz), WebGL yazılım (SwiftShader) ile çalışır:

```bash
CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome npm run e2e
```

E2E sunucusu ayrı veri klasörünü (`data/e2e`) kullanır, üretim derlemesini çalıştırır ve örnek veriyi kendisi ekler.

Ayarlar `.env.example` içinde (`PORT`, `HOST`, `COOKIE_SECURE`, `TRUST_PROXY`, `DATA_DIR`). `.env` git'e eklenmez.

**Yönetici atama** (yalnızca sunucuda, veri klasörüne erişimi olan işletmeci): önce hesap siteden normal kayıtla açılır, sonra
`npm run make-admin -- kisi@ornek.com` çalıştırılır (`--remove` ile geri alınır). Yönetici, `users.is_admin` veritabanı bayrağıdır; web arayüzünden ya da kayıt e-postasından verilemez. Eski `ADMIN_EMAIL` ayarı kaldırıldı (yok sayılır).

> Not (ilçe): `listings.district` sütunu açılışta otomatik eklenir (mevcut veri silinmez, eski satırlarda NULL). İl→ilçe listesi depoda olmadığından ilçe serbest metindir; sabit il/ilçe seçicisi ileride yapılabilecek bir iyileştirmedir.

## Kapsam (yalnızca bunlar)

1. **Normal ilanlar**: tür (3B kataloğundaki 12 tür ya da "diğer" = 3B yok), şekil, renk, cinsiyet, adet, fiyat (TL), şehir + ilçe (ilçe zorunlu serbest metin, 2-60 karakter; eski ilanlarda ilçe boştur ve yalnızca şehir gösterilir), açıklama; **1–5 gerçek fotoğraf zorunlu**.
2. **İlan detayı**: gerçek fotoğraflar + "Temsili 3B görünüm — gerçek balık fotoğrafları solda" etiketli 3B model (görünür olunca tembel yüklenir; WebGL yoksa yedek metin). İlan formunda tür/şekil/renk/cinsiyet değiştikçe güncellenen canlı 3B önizleme.
3. **Arama**: tür, şekil, renk, şehir, ilçe (isteğe bağlı alt dize araması, büyük/küçük harf duyarsız), fiyat aralığı; liste görünümünde yalnızca ilk gerçek fotoğraf (3B yok).
4. **Hesaplar**: e-posta + parola, çıkış, giriş hız sınırı; satıcı iletişimi (isteğe bağlı WhatsApp/telefon: düz metin + `wa.me` bağlantısı); "şikayet et" düğmesi; yalnızca `is_admin` bayrağı olanlara açık minimal `/admin/raporlar` (diğerlerine 404); yönetici şikayet edilen ilanı `POST /admin/ilan/:id/kaldir` ile kaldırabilir.
5. **Satıcı profili + Akvaryum** (`/satici/:id`): satıcının ilanları ve satıcının kendi eklediği balıklarla (tür, şekil, renk, cinsiyet; katalogdan) kurulan, ziyaretçilerin döndürüp yakınlaştırabildiği temsili 3B akvaryum. Sahne her zaman "temsili 3B görünüm — satıcının gerçek stoğu değildir" etiketiyle gösterilir. Düzenleme: `/profil/akvaryum` (yalnızca giriş yapmış sahibi).

## Kapsam dışı (bilerek eklenmedi)

Ödeme, site içi mesajlaşma, değerlendirme/yorum, genetik, uyumluluk denetimi, AR, rozetler, ilan düzenleme; akvaryumda bitki/dekor sistemi, yemleme, sosyal özellikler, mesajlaşma, genetik, uyumluluk denetimi, e-posta doğrulama/parola sıfırlama, çoklu dil, dağıtım.

## Akvaryum (satıcı profili)

- **Veri**: `aquarium_fish` (kullanıcı, tür, şekil, renk, cinsiyet, `position` = gösterim sırası; eski veritabanlarına `position` sütunu açılışta eklenir). Sunucuda katalogla doğrulanır (`validateFish`): tür 3B modeli olan bir katalog türü olmalı ("diğer" yok), şekil/renk o türe ait olmalı, cinsiyet türün sunduğu seçeneklerden biri olmalı ("bilinmiyor" yok; 3B için kesin cinsiyet gerekir). Aynı doğrulama ve sınırlar DB katmanında (`addAquariumFish`, tek işlemde) da uygulanır.
- **Sınırlar** (çizim bütçesi için; `server/validation.ts`): akvaryum başına en çok **12 balık**; en çok **3 karides** (model ~240 çizim çağrısı/adet); **japon + pleco + vatoz toplamda en çok 4** (35-60 çağrı, büyük yüzgeçler). Ekleme/silme hız sınırı: kullanıcı başına saatte 60.
- **Uç noktalar** (hepsi oturum + CSRF + Origin denetimli, yalnızca kendi akvaryumunuz): `GET /profil/akvaryum`, `POST /profil/akvaryum/ekle`, `POST /profil/akvaryum/:id/sil` (başkasının balığı için 404). Herkese açık görünüm `GET /satici/:id`.
- **Düzenleyici**: tür/şekil/renk/cinsiyet seçicileri ilan formuyla aynı katalog mantığını kullanır (`client/catalog-select.ts`) ve seçilen balığın canlı 3B önizlemesini gösterir (JavaScript ister).
- **Sahne** (`client/akvaryum-sahne.ts`, saf yerleşim/yol hesabı `client/tank-motion.ts`): tek `WebGLRenderer`; balıklar tür modüllerinin renderer'sız `createFishGroup` API'siyle gelir (geometri/doku paylaşımlı), paylaşılan görünüm `applyLook`, her karede `sortFishGroups` (saydam yüzgeçler doğru sıralanır). Cam kutu (su gradyanı, kum zemin, ince cam + kenar çizgileri, sis); balıklar tür başına ölçeklenir, kendi döngüsel yolunda (faz/yön/periyot balık başına farklı) yüzer; zeminde yaşayanlar (pleco, corydoras, vatoz, karides) zemine yakın ve yavaş, diğerleri su sütununda ayrı şeritlerde gezer. Konum, gerçek sınır kutusuna göre cam kutunun içinde ve kumun üstünde tutulur (birim testle doğrulanır). Balıklar arası çarpışma kaçınması yoktur; şeritler çakışmayı azaltır ama balıklar birbirinin içinden geçebilir.
- **Kontroller**: işaretçi sürükleme = döndür, iki parmak = yakınlaştır, tekerlek (yalnızca tuval odaktayken ya da Ctrl ile; sayfa kaydırmasını çalmaz), klavye (tuval odaktayken ok tuşları döndürür, `+`/`-` yakınlaştırır, `Home` sıfırlar) ve ekrandaki düğmeler. Dikey kaydırma mobilde sayfaya aittir (`touch-action: pan-y`).
- **Yüklenme/duraklatma**: sahne görünür olunca tembel yüklenir (three + yalnızca kullanılan türlerin modülleri); ekran dışındayken ya da sekme gizliyken çizim döngüsü durur; `prefers-reduced-motion` iken durağan poz (yalnızca kullanıcı döndürünce yeniden çizilir). Balık sayısı 6'dan çoksa ya da ekran 700 px'ten darsa **low** LOD, değilse normal (`?lod=low|normal` ile zorlanabilir). `devicePixelRatio` en çok 2 (low'da 1,5). Sayfadan ayrılınca (`pagehide`) tüm balıklar, geometri/doku/malzeme, ışıklar ve renderer bırakılır, bağlam kapatılır.
- **Yedek**: WebGL yoksa ya da bağlam kaybolursa kısa bir açıklama + balık listesi gösterilir. Aynı liste (tür, şekil, renk, cinsiyet) normal durumda da tuvalin altında metin olarak bulunur; tuvalin `aria-label` değeri etiketi ve balık sayısını söyler.
- **Örnek veri**: `npm run seed` DEMO satıcıya 12 balıklı "Örnek akvaryum" ekler (zaten ilan varsa yalnızca akvaryum eklenir); profilde "Örnek akvaryum" etiketi görünür.

### Bütçe (12 karışık balık, low LOD; `createFishGroup` bütçe sayıları + `renderer.info`)

| | |
|---|---|
| Üçgen (balıklar) | ~62 bin (sahne dahil ~68 bin/kare) |
| Çizim çağrısı | ~520 (balıklar), ~590/kare (sahne dahil) |
| Doku / piksel | ~64 doku, ~2,1 milyon piksel (paylaşımlı) |
| GPU programı | ~57 |
| Kötü durum (3 karides + 4 ağır + 5 diğer) | ~1100 çizim çağrısı |
| Kare süresi (yazılım WebGL/SwiftShader, 12 balık, low) | ~30-45 ms (boşta), bkz. ölçüm notu |

Ölçüm (`tests/e2e/akvaryum.e2e.ts`, `window.__akvaryum.benchmark()`, yazılım WebGL, yüklü makine): 12 balık/low: boşta makinede masaüstü (1080x607) ~44 ms/kare, mobil boyut (318x318) ~30 ms/kare; makine yüklüyken (yük ort. ~20) 70-150 ms/kare. Sürekli çizim ~30 kare/sn ile sınırlıdır ve kare aralığı uzarsa çizim çözünürlüğü kademeli (en az 0,5x) düşer. Gerçek GPU'da bunun çok altındadır; sayılar yalnızca gerilemeleri yakalamak içindir.

## Yapı

```
server/        Node http sunucusu (bağımlılıksız): app.ts (yönlendirme), db.ts (node:sqlite), auth.ts (scrypt, oturum, hız sınırı),
               validation.ts, search.ts (sorgu kurucu), uploads.ts (fotoğraf doğrulama), views/ (kaçışlı HTML şablonları)
client/        Vite ile paketlenen TS: viewer3d.ts (tür modüllerini tembel yükler), ilan-form.ts, ilan-detay.ts, ilanlar.ts, satici.ts + akvaryum-sahne.ts + tank-motion.ts (akvaryum), akvaryum-duzenle.ts, catalog-select.ts, styles.css
shared/        catalog.json (tür modüllerinden üretilir), catalog.ts, cities.ts
scripts/       gen-catalog.mjs, seed.ts, shots.mjs (ekran görüntüsü aracı)
tests/unit     vitest: doğrulama, auth/oturum, arama sorgusu, DB, yükleme, şablon, katalog, API (sunucu düzeyi)
tests/e2e      Playwright
data/          app.db + uploads/ (git'e eklenmez)
```

Sayfalar sunucuda üretilir (HTML), istemci kodu yalnızca zenginleştirir. Form/renk seçicileri ve 3B önizleme JavaScript ister; ilan listesi, detay ve giriş/kayıt JavaScript olmadan da çalışır.

## Kararlar ve güvenlik

- **Fotoğraf zorunluluğu sunucuda zorlanır**: dosya sihirli baytlarına bakılır (JPEG/PNG/WebP), istemcinin bildirdiği tür/uzantı önemsenmez; 5 MB/dosya, en çok 5 dosya, toplam gövde ~26 MB sınırı; fotoğrafsız ilan `createListing` içinde de reddedilir (işlem geri alınır). Dosyalar rastgele adla `data/uploads` altına yazılır, yalnızca `^[a-f0-9]{32}\.(jpg|png|webp)$` adları sunulur (yol gezintisi yok), `nosniff` + `sandbox` CSP ile servis edilir. **Üst veri ayıklama** (`server/imageclean.ts`, bağımlılıksız, yeniden kodlama yok): JPEG'de APP1 (EXIF/XMP), APP13 (IPTC), COM ve diğer APPn bölümleri atılır, yalnızca JFIF (APP0), ICC (APP2) ve Adobe (APP14) kalır; PNG'de tEXt/zTXt/iTXt/eXIf/tIME ve diğer yardımcı parçalar atılır; WebP'de EXIF/XMP parçaları atılıp VP8X bayrakları ve RIFF boyutu düzeltilir. EXIF yönelimi (döndürme) != 1 ise yalnızca yönelim etiketini taşıyan en küçük EXIF (JPEG APP1 / PNG eXIf) bırakılır, böylece konum/cihaz/zaman bilgisi saklanmadan fotoğraf doğru dönük görünür. Bozuk görseller reddedilir. Depolanan dosya boyutu temizlenmiş boyuttur.
- **Parola**: `node:crypto` scrypt (N=16384, r=8, p=1, rastgele tuz), zamanlama güvenli karşılaştırma. Kullanıcı yoksa da sahte özetle doğrulanır.
- **Oturum**: rastgele 256 bit belirteç, SQLite'ta yalnızca SHA-256 özeti; çerez `HttpOnly; SameSite=Lax; Path=/`, `COOKIE_SECURE=true` ile `Secure`. Girişte belirteç yenilenir (oturum sabitleme).
- **CSRF**: tüm POST'lar için çift gönderim belirteci (`csrf` çerezi + gizli alan) + `Origin` denetimi + SameSite=Lax.
- **Hız sınırı** (bellek içi, tek süreç): giriş (e-posta başına 5 hata/10 dk, IP başına 30), kayıt, ilan verme, şikayet.
- **Girdi/çıktı**: tüm alanlar sunucuda doğrulanır (tür/şekil/renk katalogla eşleştirilir), şablonlar varsayılan olarak kaçışlar, SQL tamamen parametreli, sıralama beyaz listeli, açık yönlendirme engelli. Üretim kipinde `Content-Security-Policy` (yalnızca kendi kaynağı), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`, `Permissions-Policy` (kamera/mikrofon/konum kapalı); `COOKIE_SECURE=true` ya da üretim kipinde `Strict-Transport-Security` (1 yıl).
- **İstemci IP'si**: varsayılan olarak soket adresi. Ters vekil (nginx vb.) arkasında `TRUST_PROXY=true` yapılırsa `X-Forwarded-For` başlığının SON girdisi (güvenilen vekilin eklediği) kullanılır; vekil olmadan açmayın, IP sahtelenebilir ve hız sınırı atlatılır.
- **Şikayet**: giriş gerektirir (kötüye kullanımı azaltmak için), ilan "inceleme bekliyor" (`flagged`) olarak işaretlenir ama yayında kalır; `/admin/raporlar` şikayetleri durumlarıyla listeler ("inceleme bekliyor" / "çözüldü"; `is_admin` bayrağı olmayana 404). Yönetici "İlanı kaldır" dediğinde (`POST /admin/ilan/:id/kaldir`; CSRF belirteci + Origin denetimi, sahiplik aranmaz) ilan `removed` olur, fotoğrafları silinir ve o ilanın şikayetleri `resolved_at` ile çözülmüş sayılır. Gizleme/geri alma yoktur.
- **Cinsiyet**: türün sunduğu seçenekler + "Bilinmiyor / karışık". Tek cinsiyet seçeneği olan türlerde (melek, diskus) 3B model "ayrım yok" olarak çizilir. Bilinmiyorsa 3B modelde türün ilk cinsiyeti gösterilir.
- **Fiyat**: "toplam fiyat" olarak sunulur; kuruş cinsinden tamsayı saklanır.
- **Satıcı iletişimi** kullanıcı profilinde tutulur (ilan formundaki alanlardan güncellenir); numaralar ilan sayfasında herkese açıktır ve formda bu açıkça söylenir.
- **İlan kaldırma**: sahibi ilanını kaldırabilir (fotoğraflar silinir). Düzenleme yoktur.
- **3B dürüstlüğü**: 3B bölümünde "Temsili 3B görünüm" etiketi, "şematik yorum" notu ve türün kendi notu bulunur; etiketin varlığı testle doğrulanır.

## Sınırlamalar

- Hız sınırı bellek içidir ve süreç yeniden başlayınca sıfırlanır; ters vekil arkasında doğru IP için `TRUST_PROXY=true` gerekir (varsayılan kapalı; yanlış açılırsa IP sahtelenebilir).
- Gerçek e-posta yoktur (doğrulama, parola sıfırlama yok). SQLite tek süreç içindir.
- Fotoğrafın gerçekten o balığa ait olduğu doğrulanamaz; yalnızca biçim denetlenir. Sahte ilanla mücadele yalnızca şikayet kaydıdır.
- Tür modüllerindeki bazı şekil/renk adları "doğrulanmalı" notludur; katalog adları olduğu gibi gösterilir.
- 3B modeller yazılım WebGL'de yavaştır; gerçek GPU'da akıcıdır. İlan listelerinde performans için 3B kullanılmaz.
- Katalog (`shared/catalog.json`) tür modülleri değişirse `npm run catalog` ile yenilenmelidir; `tests/unit/catalog.test.ts` farkı yakalar.
- **Yönetici**: yalnızca sunucuda `npm run make-admin` ile verilen veritabanı bayrağıdır; kayıt e-postası yönetici yapmaz. Betiği çalıştırabilen kişi (sunucu/veri klasörü erişimi olan) zaten tam yetkilidir. Yönetici arayüzü yalnızca şikayet listesi ve ilan kaldırmadır; yönetici girişi için ayrı bir çok faktörlü doğrulama yoktur.
- CSP yalnızca üretim kipinde (`npm start`) gönderilir. HSTS yalnızca `COOKIE_SECURE=true`/üretimde gönderilir; TLS'in kendisi dağıtım katmanındadır (uygulama yalnızca http dinler).
- Çerezli oturumlar sunucuda saklanır ama "tüm oturumları kapat" ve parola değiştirme yoktur. Kayıt formu artık "e-posta zaten kayıtlı" demez (genel "Kayıt tamamlanamadı" mesajı), ancak e-posta doğrulaması olmadığından hesap sayımı tamamen engellenemez: başarılı kayıt anında oturum açtırır, başarısızlık ise mesaj verir; ikisi arasındaki fark bir saldırgana e-postanın kayıtlı olduğunu yine sezdirir. Gerçek çözüm e-posta doğrulamasıdır (kapsam dışı); kayıt hız sınırı (IP başına saatte 10) kötüye kullanımı yavaşlatır. Giriş mesajı ise kullanıcı/parola ayrımı yapmaz.
- Üst veri ayıklama yalnızca bilinen biçimleri/parçaları hedefler: görüntü pikselleri yeniden kodlanmadığından görüntünün kendisi (ör. plaka, yüz) ve izin verilen ICC profili kalır; WebP'de EXIF yönelimi korunmaz (tarayıcılar WebP'de zaten uygulamaz). Parça içindeki gizli veri (steganografi) ve üreticiye özgü piksel düzeni izleri ayıklanmaz. Yükleme gövdeleri bellekte tamponlanır (en çok ~26 MB, eşzamanlı büyük yükleme belleği şişirebilir).
- Şikayet kullanıcı başına ilan başına bir kez sayılır; sahte hesaplarla toplu şikayet engellenmez. Şikayet edilen ilan otomatik gizlenmez.
- İlan sahibine ait "ilan kaldır" onayı tarayıcı `confirm` penceresiyle yapılır (JavaScript kapalıysa onaysız kaldırır).

## Danışman turu eklemeleri
- **Doğrulanmalı işareti**: `shared/catalog.json` şekil/renk kayıtlarında tür modülündeki `dogrulanmali` değerini taşır (`npm run catalog`); ilan formu seçeneklerinde, ilan detayındaki "Seçilen" satırında ve ilan listesi/akvaryum metinlerinde "(adı kaynaklarda tutarsız / doğrulanmalı)" eklenir. Katalog testi bunu tür modülleriyle karşılaştırır. `kisaAciklama` içindeki "N form / N renk" sayıları üretim sırasında şekil/renk sayısından türetilir.
- **"Ayrım yok" türleri (melek, diskus)**: modelde tek cinsiyet kimliği `disi` olsa da (src/lib değişmedi) ilan/akvaryum verisinde `bilinmiyor` saklanır, arayüzde "Ayrım yok" yazar; 3B modele gerçek kimlik (`modelSex`) verilir. Açılışta eski `disi` satırları `bilinmiyor`a çevrilir (veri silinmez).
- **Giriş kilidi**: (IP, e-posta) çifti başına `LOGIN_MAX_FAILS` hata + IP başına 6 katı gevşek sınır; başkasının e-postasıyla kurban kilitlenemez.
- **Eşzamanlı yükleme**: ilan yükleme gövdesini okuma/görüntü işleme en çok `MAX_CONCURRENT_UPLOADS` (varsayılan 4) istekte aynı anda sürer; fazlası `503` + `Retry-After`.
- **Erişilebilirlik**: odaklanabilir 3B tuvaller `role="group"` + `aria-describedby` ile görünür klavye yardımına (oklar döndürür, +/- yakınlaştırır, Home sıfırlar) bağlanır; yalnızca fare/dokunuşla kullanılan önizleme tuvalleri odaklanmaz. İlan detayında etiketin altında seçilen şekil/renk metin olarak tekrarlanır; corydoras ve vatoz için tür kimliğinin şematik/belirsiz olduğu yazılır.
