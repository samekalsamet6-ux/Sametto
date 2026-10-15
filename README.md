# Lepistes Rehberi

Lepistes (guppy, *Poecilia reticulata*) üretimi için Türkçe **rehber**, **wiki** ve **yardımcı araçlar** sitesi. Yeni başlayanlar, orta seviye ve deneyimli yetiştiriciler için üç ayrı öğrenme yolu sunar.

> Durum: içerik ilk taslaktır. Sayısal biyolojik değerlerin bir kısmı kaynakla doğrulanmayı bekliyor; bkz. [`docs/OPEN_QUESTIONS.md`](docs/OPEN_QUESTIONS.md).

## İçerik

| Bölüm | Konum | Ne var? |
|---|---|---|
| Rehber | `src/content/guide/{baslangic,orta,ileri}` | 3 yol × 15 ders (MDX) |
| Wiki | `src/content/wiki` | 62 madde: terimler, su kimyası, ekipman, hastalıklar, beslenme, genetik… |
| Araçlar | `src/pages/araclar`, `src/lib` | 9 araç (aşağıda) |
| Sorun giderme | `/sorun-giderme` | Belirtiden olası nedene karar aracı |
| Seviye testi | `/seviye-testi` | 18 soruluk yönlendirme testi |
| SSS, Sözlük, Kaynaklar | `/sss`, `/sozluk`, `/kaynaklar` | |

**Araçlar:** akvaryum hacmi · su değişimi · balık sayısı planlayıcı · gebelik/doğum takvimi · yem planlayıcı · bakım takvimi (.ics) · azot döngüsü takipçisi · Punnett hesaplayıcı · inbreeding (Wright F).

Tüm hesaplar tarayıcıda yapılır; hesap/giriş yoktur, veriler sunucuya gönderilmez (takipçi verisi yalnızca `localStorage`'da tutulur).

## Teknoloji

[Astro](https://astro.build) (statik çıktı) · MDX + içerik koleksiyonları (Zod ile frontmatter doğrulaması) · saf TypeScript hesaplayıcılar · [Pagefind](https://pagefind.app) ile arama · Vitest.

## Başlarken

Gereksinim: Node.js 22 (`.nvmrc`).

```bash
npm ci
npm run dev        # geliştirme sunucusu (arama dizini yalnızca build sonrası oluşur)
```

| Komut | Ne yapar? |
|---|---|
| `npm test` | Birim testleri (Vitest) |
| `npm run check` | Astro tip ve içerik denetimi |
| `npm run build` | Siteyi `dist/` içine derler ve Pagefind dizinini oluşturur |
| `npm run preview` | Derlenmiş siteyi yerelde açar |
| `npm run check:links` | `dist/` içindeki dahili bağlantıları denetler (önce `build`) |
| `npm run open-questions` | `docs/OPEN_QUESTIONS.md` dosyasını yeniden üretir |

CI (`.github/workflows/ci.yml`) şunları çalıştırır: test → `check` → `build` → `check:links` → `OPEN_QUESTIONS.md` güncel mi.

## Proje yapısı

```
src/
  content/guide|wiki   MDX içerik (frontmatter şeması: src/content.config.ts)
  components/          Terim (wiki bağlantısı), Uyari (kutu), Toc, LevelBadge
  layouts/Base.astro   Ortak sayfa iskeleti
  pages/               Rotalar (araçlar, sorun giderme, test, SSS, sözlük…)
  lib/calculators/     Saf hesaplama fonksiyonları (+ testleri)
  lib/storage/         Yerel veri biçimi ve içe/dışa aktarma
  data/                Araç listesi, belirti–neden verisi, quiz, kaynaklar
scripts/               check-links, list-unverified
docs/                  Plan ve doğrulama listesi
```

## İçerik yazarken

- Derslerde bir wiki maddesine `<Terim s="madde-slugu">metin</Terim>` ile bağlanın; madde yoksa build hata verir.
- Vurgu kutuları için `<Uyari tip="bilgi|uyari|hata|ipucu">`.
- Güvenilir kaynağı olmayan sayısal iddiayı **kesin yazmayın**; sayfanın frontmatter'ına `needs_verification: true` ekleyin.
- Bilimsel iddialar için `src/data/kaynaklar.json` içine kaynak ekleyin ve `/kaynaklar#id` ile bağlayın.
- Ayrıntılar: [`CONTRIBUTING.md`](CONTRIBUTING.md), editör listesi: [`CONTENT_REVIEW.md`](CONTENT_REVIEW.md).

## Yayınlama

`npm run build` çıktısı (`dist/`) statik bir sitedir; Cloudflare Pages, Netlify, GitHub Pages gibi herhangi bir statik barındırmada çalışır.

Yayından önce:
1. `astro.config.mjs` içindeki `site` değerini gerçek alan adınızla değiştirin (sitemap için).
2. Site adını ve alan adını netleştirin (şimdilik "Lepistes Rehberi").
3. [`CONTENT_REVIEW.md`](CONTENT_REVIEW.md) listesini tamamlayın.

## Yapılacaklar

- SVG diyagramlar (azot döngüsü, tank düzeni, gonopodium, Punnett, soy ağacı)
- Erişilebilirlik (axe) ve Lighthouse denetimi, PWA/çevrimdışı kullanım
- Kalan araçlar: büyüme takipçisi, maliyet, ilaç dozajı, pedigri çizici
- E2E testleri (Playwright)
- Lisans seçimi (henüz yok)

## Sorumluluk reddi

Bilgiler eğitim amaçlıdır. İlaç ve tedavi konusunda ürün etiketine ve uzman görüşüne başvurun. Lepistes yabancı tür olabilir; **doğaya salmayın**.
