# TCL Kumanda

Tüm TCL televizyonlar için (Roku TV, Android TV, Google TV) telefon/bilgisayar tarayıcısından çalışan uzaktan kumanda. Wi-Fi üzerinden (IR/Bluetooth gerekmez) çalışır; PWA olarak ana ekrana eklenebilir.

## Araştırma özeti: TCL modelleri hangi protokolü kullanır?

TCL'nin herkese açık, tek bir ağ kumanda API'si yoktur; kumanda TV'nin işletim sistemine göre değişir:

| TCL yazılım platformu | Protokol | Port | Not |
|---|---|---|---|
| **Roku TV** (ABD/Kanada ağırlıklı modeller) | Roku ECP (HTTP REST) | 8060 | TV'de *Ağ erişimi / Control by mobile apps* açık olmalı. Keşif: SSDP `roku:ecp` |
| **Google TV / Android TV** (Türkiye ve Avrupa'daki çoğu model: C6xx, P7xx, Q-/QM serisi vb.) | Android TV Remote Protocol v2 (TLS + protobuf) | 6467 eşleştirme, 6466 kumanda | İlk seferde TV'de görünen 6 haneli kodla eşleştirme; sertifika saklanır. Keşif: mDNS `_androidtvremote2._tcp` |
| Fire TV / eski kapalı sistemli modeller | — | — | Şu an desteklenmiyor (Fire TV için ADB gerekir; eski modeller için IR) |

Kaynaklar: Roku [ECP dokümanı](https://developer.roku.com/dev/docs/external-control-api), [androidtvremote2](https://github.com/tronikos/androidtvremote2) ve [androidtv-remote](https://github.com/kud/androidtv-remote) (Android TV Remote v2 referans uygulamaları), TCL'nin [kumanda kodları sayfası](https://support.tcl.com/en_US/remote-support-articles/tcl-tv-remote-codes-by-provider).

Tarayıcılar TLS istemci sertifikalı ham TCP soketi açamadığı için küçük bir **Node.js köprü sunucusu** TV ile konuşur, arayüz ona HTTP ile bağlanır.

## Kurulum

```bash
npm install
npm start          # http://localhost:3000
```
Telefondan `http://<bilgisayar-IP>:3000` adresini açın (aynı Wi-Fi). Sunucuyu sürekli açık bir cihazda (Raspberry Pi, NAS, PC) çalıştırın.

1. **＋** → otomatik arama ya da TV IP adresi (TV: Ayarlar > Ağ). Platform otomatik algılanır.
2. Android/Google TV ise ekrandaki 6 haneli kodu girin (tek seferlik).
3. Roku TV ise TV'de ağ kontrolünün açık olduğundan emin olun.

## Özellikler
Güç, yön/OK, geri, ana sayfa, menü, ses/kanal (basılı tutma ile tekrar), oynatma tuşları, rakamlar, HDMI girişleri, renkli tuşlar, Netflix/YouTube/Prime/Disney+/Spotify, TV'ye metin gönderme. Birden fazla TV.

## Güvenlik
Uygulamada kimlik doğrulama yoktur; yalnızca güvenilir ev ağında çalıştırın, internete açmayın. `devices.json` eşleştirme sertifikalarını içerir (git'e eklenmez). Yalnızca yerel ağda `HOST=127.0.0.1` ile sadece bu makineye de bağlanabilirsiniz.

## Test
`npm test` — sahte Roku ECP sunucusuyla uçtan uca test. Android TV tarafı gerçek TV gerektirir; gerçek bir TCL Google TV ile doğrulanmamıştır.
