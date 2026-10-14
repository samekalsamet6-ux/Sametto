# 🐟 Akvaryum Üreticisi

Tarayıcıda çalışan, uzun soluklu akvaryum yetiştirme + aquascape oyunu. Tek dosya: **`index.html`** (harici görsel/ses yok; her şey kodla üretilir).

## Çalıştırma
`index.html` dosyasını bir tarayıcıda açın (mobil öncelikli, masaüstü uyumlu).

## Geliştirme
Kaynak `src/` altında modüller halindedir; `python3 build.py` bunları tek `index.html` dosyasına birleştirir.

```
src/style.css          tasarım dili ("sualtı cam"), temalar
src/body.html          SVG ikon seti + sayfa iskeleti
src/js/00-util.js      matematik, tohumlanabilir RNG, gürültü, DOM yardımcıları
src/js/01-data.js      veri tabloları: türler, aleller, kuyruklar, ırklar, nadirlik
src/js/02-genetics.js  genetik motoru (XX/XY, çaprazlama, mutasyon, akrabalık)
src/js/03-fish-art.js  genlerden prosedürel balık dokusu + omurga tabanlı deformasyon
src/js/04-creature.js  canlı verisi + yüzme simülasyonu (durum makinesi, sürü, yaylı kuyruk)
src/js/04b-breeding.js üreme: çiftleştirme, gebelik, doğum, önizleme
src/js/09a-viewport.js kamera + girdi
src/js/12-scape-data.js zemin/taş/kök/bitki/ekipman/şablon tabloları
src/js/12b-scape-art.js taş/kök/dekor sprite + bitki çizicileri
src/js/16-economy.js   görev/başarım/pazar/mağaza/sipariş/araştırma mantığı
src/js/16b-economy-ui.js ilerleme ekranları
src/js/15-info-data.js tür kartı verileri, sözlük, rehberler, dersler
src/js/15b-dex-ui.js  ansiklopedi + bilgi merkezi
src/js/14-chem.js      su kimyası + biyoloji simülasyonu
src/js/14b-water-ui.js su paneli, budama, kuru başlangıç
src/js/13-scape.js     aquascape modeli, geri alma
src/js/13b-editor.js   Tasarım Stüdyosu
src/js/13c-photo.js    fotoğraf modu
src/js/05-scene.js     tank sahnesi, gün/gece, bitkiler, kabarcık, yem
src/js/06-audio.js     Web Audio: üretken müzik, ambiyans, efektler
src/js/07-save.js      3 yuva, sürüm/göç, yedek, içe/dışa aktarma, XP
src/js/08-ui.js        ekranlar, canlı kartı, ansiklopedi, ayarlar, kutlama
src/js/08b-lab.js      Laboratuvar, yavru açılışı, soyağacı
src/js/09-main.js      çekirdek: döngü, kamera/girdi, görevler, ekonomi
src/js/10-tests.js     konsol testleri
```

Konsol testleri: `Tests.all()` (Mendel 3:1, cinsiyete bağlı kalıtım, X–Y çaprazlama, cinsiyet oranı, akrabalık, mutasyon, ırk tanıma).

## Aşama durumu
- [x] **Aşama 1 – Çekirdek:** tasarım dili + gezinti, kayıt, lepistes genetiği, balık çizici, omurga tabanlı yüzme + durum makinesi, ekran geçişleri, tek tank, Canlı Kartı, üretken müzik + ambiyans
- [x] **Aşama 2 – Üreme:** sperm depolama, gebelik (21–31 gün), batın/yavru yeme, akrabalı üreme cezaları, Laboratuvar + Punnett önizleme, yavru "açılış" anı, soyağacı, keşif kutlaması, kayıt göçü v1→v2
- [x] **Aşama 3 – Tasarım Stüdyosu:** zemin fırçası, 10 taş/kök, 30 bitki, ekipman, dekor, geri al/yinele, ızgara + altın oran/üçler kılavuzu, şablonlar, fotoğraf modu
- [ ] [ ] 4 – Kimya & Biyoloji · [ ] 5 – Ansiklopedi & Bilgi · [ ] 6 – İlerleme · [ ] 7 – Türler · [ ] 8 – Meta & Cila

Kısayollar (Akvaryum): `F` yem · `L` ışık · `S` hız · `+`/`-` yakınlaştır · `1–5` sekmeler · `H` merkez · `Esc` kapat.
