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

Ayarlar `.env.example` içinde (`PORT`, `ADMIN_EMAIL`, `COOKIE_SECURE`, `DATA_DIR`). `.env` git'e eklenmez.

## Kapsam (yalnızca bunlar)

1. **Normal ilanlar**: tür (3B kataloğundaki 12 tür ya da "diğer" = 3B yok), şekil, renk, cinsiyet, adet, fiyat (TL), şehir, açıklama; **1–5 gerçek fotoğraf zorunlu**.
2. **İlan detayı**: gerçek fotoğraflar + "Temsili 3B görünüm — gerçek balık fotoğrafları solda" etiketli 3B model (görünür olunca tembel yüklenir; WebGL yoksa yedek metin). İlan formunda tür/şekil/renk/cinsiyet değiştikçe güncellenen canlı 3B önizleme.
3. **Arama**: tür, şekil, renk, şehir, fiyat aralığı; liste görünümünde yalnızca ilk gerçek fotoğraf (3B yok).
4. **Hesaplar**: e-posta + parola, çıkış, giriş hız sınırı; satıcı iletişimi (isteğe bağlı WhatsApp/telefon: düz metin + `wa.me` bağlantısı); "şikayet et" düğmesi; `ADMIN_EMAIL` ile korunan minimal `/admin/raporlar`.
5. `/satici/:id` yer tutucu sayfa: satıcının ilanları + "Akvaryum yakında" notu.

## Kapsam dışı (bilerek eklenmedi)

Ödeme, site içi mesajlaşma, değerlendirme/yorum, genetik, uyumluluk denetimi, AR, rozetler, profil sayfaları, çok balıklı 3B "Akvaryum" sahnesi, ilan düzenleme, e-posta doğrulama/parola sıfırlama, çoklu dil, dağıtım. Sonraki aşama için yalnızca veri tabanı hazırlandı: `aquarium_fish` tablosu (kullanıcı, tür, şekil, renk, cinsiyet) şemada var ama hiçbir yerde kullanılmıyor.

## Yapı

```
server/        Node http sunucusu (bağımlılıksız): app.ts (yönlendirme), db.ts (node:sqlite), auth.ts (scrypt, oturum, hız sınırı),
               validation.ts, search.ts (sorgu kurucu), uploads.ts (fotoğraf doğrulama), views/ (kaçışlı HTML şablonları)
client/        Vite ile paketlenen TS: viewer3d.ts (tür modüllerini tembel yükler), ilan-form.ts, ilan-detay.ts, ilanlar.ts, styles.css
shared/        catalog.json (tür modüllerinden üretilir), catalog.ts, cities.ts
scripts/       gen-catalog.mjs, seed.ts, shots.mjs (ekran görüntüsü aracı)
tests/unit     vitest: doğrulama, auth/oturum, arama sorgusu, DB, yükleme, şablon, katalog, API (sunucu düzeyi)
tests/e2e      Playwright
data/          app.db + uploads/ (git'e eklenmez)
```

Sayfalar sunucuda üretilir (HTML), istemci kodu yalnızca zenginleştirir. Form/renk seçicileri ve 3B önizleme JavaScript ister; ilan listesi, detay ve giriş/kayıt JavaScript olmadan da çalışır.

## Kararlar ve güvenlik

- **Fotoğraf zorunluluğu sunucuda zorlanır**: dosya sihirli baytlarına bakılır (JPEG/PNG/WebP), istemcinin bildirdiği tür/uzantı önemsenmez; 5 MB/dosya, en çok 5 dosya, toplam gövde ~26 MB sınırı; fotoğrafsız ilan `createListing` içinde de reddedilir (işlem geri alınır). Dosyalar rastgele adla `data/uploads` altına yazılır, yalnızca `^[a-f0-9]{32}\.(jpg|png|webp)$` adları sunulur (yol gezintisi yok), `nosniff` + `sandbox` CSP ile servis edilir. Fotoğraflar yeniden kodlanmaz/EXIF temizlenmez (bağımlılık gerektirirdi); bu bir sınırlamadır.
- **Parola**: `node:crypto` scrypt (N=16384, r=8, p=1, rastgele tuz), zamanlama güvenli karşılaştırma. Kullanıcı yoksa da sahte özetle doğrulanır.
- **Oturum**: rastgele 256 bit belirteç, SQLite'ta yalnızca SHA-256 özeti; çerez `HttpOnly; SameSite=Lax; Path=/`, `COOKIE_SECURE=true` ile `Secure`. Girişte belirteç yenilenir (oturum sabitleme).
- **CSRF**: tüm POST'lar için çift gönderim belirteci (`csrf` çerezi + gizli alan) + `Origin` denetimi + SameSite=Lax.
- **Hız sınırı** (bellek içi, tek süreç): giriş (e-posta başına 5 hata/10 dk, IP başına 30), kayıt, ilan verme, şikayet.
- **Girdi/çıktı**: tüm alanlar sunucuda doğrulanır (tür/şekil/renk katalogla eşleştirilir), şablonlar varsayılan olarak kaçışlar, SQL tamamen parametreli, sıralama beyaz listeli, açık yönlendirme engelli. Üretim kipinde `Content-Security-Policy` (yalnızca kendi kaynağı), `X-Frame-Options: DENY`, `nosniff`.
- **Şikayet**: giriş gerektirir (kötüye kullanımı azaltmak için), ilan "inceleme bekliyor" (`flagged`) olarak işaretlenir ama yayında kalır; `/admin/raporlar` yalnızca listeler (ADMIN_EMAIL boşsa kimseye açılmaz, 404 döner).
- **Cinsiyet**: türün sunduğu seçenekler + "Bilinmiyor / karışık". Tek cinsiyet seçeneği olan türlerde (melek, diskus) 3B model "ayrım yok" olarak çizilir. Bilinmiyorsa 3B modelde türün ilk cinsiyeti gösterilir.
- **Fiyat**: "toplam fiyat" olarak sunulur; kuruş cinsinden tamsayı saklanır.
- **Satıcı iletişimi** kullanıcı profilinde tutulur (ilan formundaki alanlardan güncellenir); numaralar ilan sayfasında herkese açıktır ve formda bu açıkça söylenir.
- **İlan kaldırma**: sahibi ilanını kaldırabilir (fotoğraflar silinir). Düzenleme yoktur.
- **3B dürüstlüğü**: 3B bölümünde "Temsili 3B görünüm" etiketi, "şematik yorum" notu ve türün kendi notu bulunur; etiketin varlığı testle doğrulanır.

## Sınırlamalar

- Hız sınırı bellek içidir ve süreç yeniden başlayınca sıfırlanır; ters vekil arkasında IP doğru okunmaz (yerel kullanım varsayımı).
- Gerçek e-posta yoktur (doğrulama, parola sıfırlama yok). SQLite tek süreç içindir.
- Fotoğrafın gerçekten o balığa ait olduğu doğrulanamaz; yalnızca biçim denetlenir. Sahte ilanla mücadele yalnızca şikayet kaydıdır.
- Tür modüllerindeki bazı şekil/renk adları "doğrulanmalı" notludur; katalog adları olduğu gibi gösterilir.
- 3B modeller yazılım WebGL'de yavaştır; gerçek GPU'da akıcıdır. İlan listelerinde performans için 3B kullanılmaz.
- Katalog (`shared/catalog.json`) tür modülleri değişirse `npm run catalog` ile yenilenmelidir; `tests/unit/catalog.test.ts` farkı yakalar.
- **Yönetici hesabı e-postayla belirlenir ve e-posta doğrulanmaz**: `ADMIN_EMAIL` adresiyle başka biri yönetici hesabından önce kayıt olursa `/admin/raporlar` ekranını görür. Yerel kullanımda önce yönetici hesabını siz açın; gerçek dağıtımda e-posta doğrulaması şarttır.
- CSP yalnızca üretim kipinde (`npm start`) gönderilir; HSTS yoktur (TLS dağıtım katmanındadır, `COOKIE_SECURE=true` ile `Secure` çerez kullanın).
- Çerezli oturumlar sunucuda saklanır ama "tüm oturumları kapat" ve parola değiştirme yoktur. Kayıt formu e-postanın kayıtlı olup olmadığını açığa vurur (hesap sayımı mümkün; kayıt hız sınırı vardır).
- Yüklenen fotoğraflar yeniden kodlanmaz; EXIF (konum dahil) içerebilir. Yükleme gövdeleri bellekte tamponlanır (en çok ~26 MB, eşzamanlı büyük yükleme belleği şişirebilir).
- Şikayet kullanıcı başına ilan başına bir kez sayılır; sahte hesaplarla toplu şikayet engellenmez. Şikayet edilen ilan otomatik gizlenmez.
- İlan sahibine ait "ilan kaldır" onayı tarayıcı `confirm` penceresiyle yapılır (JavaScript kapalıysa onaysız kaldırır).
