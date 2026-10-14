# TCL Kumanda (mobil)

TCL televizyonlar için Android ve iOS'ta çalışan Flutter uygulaması. Telefon, TV ile doğrudan Wi-Fi üzerinden konuşur; bilgisayar, sunucu veya bulut gerekmez.

## Desteklenen TCL TV'ler

TCL'nin tek bir kumanda API'si yoktur; protokol TV'nin yazılım platformuna bağlıdır:

| Platform | Protokol | Port | Not |
|---|---|---|---|
| Google TV / Android TV (çoğu TCL modeli) | Android TV Remote v2 (TLS + protobuf) | 6467 eşleştirme, 6466 kumanda | İlk bağlantıda TV'deki 6 karakterlik kodla bir kez eşleşme |
| Roku TV | Roku ECP (HTTP) | 8060 | TV'de *Harici kontrol > Ağ erişimi* açık olmalı |
| Fire TV ve eski kapalı sistem modeller | — | — | Desteklenmiyor |

## Özellikler
Ağda otomatik TV arama (alt ağ taraması) ve IP ile ekleme, platform otomatik algılama, birden fazla TV, güç / yön / OK / geri / ana sayfa / menü, ses ve kanal (basılı tutunca tekrar), oynat/ileri/geri sar, rakamlar, HDMI girişleri, renkli tuşlar (Google TV), Netflix / YouTube / Prime / Disney+ / Spotify kısayolları, Roku'da TV'ye yazı gönderme.

## Çalıştırma
```bash
flutter pub get
flutter run            # bağlı Android/iOS cihaz veya emülatör
flutter build apk      # Android
flutter test           # birim ve uçtan uca (sahte TV) testleri
```
Not: iOS'ta ilk açılışta "yerel ağ" izni sorulur; Roku/Android TV'yi bulmak için izin verilmelidir. iOS derlemesi macOS + Xcode gerektirir.

## Mimari
- `lib/services/proto.dart`, `atv_messages.dart` — elle yazılmış protobuf kodlaması (referans uygulamanın baytlarıyla test edilir)
- `lib/services/atv_cert.dart` — cihaz içinde RSA-2048 istemci sertifikası üretimi; `atv_client.dart` — eşleştirme ve kumanda oturumu
- `lib/services/roku_client.dart`, `discovery.dart`, `keys.dart`, `store.dart` — Roku, ağ tarama, tuş tablosu, saklama (sertifika anahtarı güvenli depoda)
- `lib/ui/` — ana ekran, TV ekleme, eşleştirme, kumanda

## Sınırlar (dürüst durum)
- Gerçek bir TCL TV ile ve gerçek telefonda denenmedi; Android SDK/Xcode bu ortamda yoktu, APK/IPA derlenmedi. Protokol; referans uygulamayla bayt bazında ve yerel bir sahte TV'ye (gerçek TLS, sertifika, eşleştirme özeti) karşı testlerle doğrulandı.
- Google/Android TV'de yazı gönderme yok (TV'nin ekran klavyesini yön tuşlarıyla kullanın).
- Roku'da renkli tuşlar yok; Menü, Bilgi, Ayarlar ve Rehber aynı "Info" tuşuna gider.
- Uygulama yalnızca yerel ağda çalışır (evin dışından kumanda yok).

## Bilgisayarsız kurulum (yalnızca Android telefon)
GitHub Actions her gönderimde APK derler. Telefonda: depo > **Releases** > "TCL Kumanda (son APK)" > `app-release.apk` indir > aç. "Bilinmeyen kaynaklardan yükleme" izni sorulursa tarayıcı için izin verin. Derleme sonucu **Actions** sekmesinde de görünür.
