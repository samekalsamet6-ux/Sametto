# Lepistes Rehberi

Lepistes (guppy, *Poecilia reticulata*) üretimi için Türkçe **rehber**, **wiki** ve **yardımcı araçlar** sitesi. Yeni başlayanlar, orta seviye ve deneyimli yetiştiriciler için üç ayrı öğrenme yolu sunar.

> Durum: içerik, kaynak araştırmasıyla gözden geçirildi; hangi bilginin neye dayandığı [`docs/DOGRULAMA.md`](docs/DOGRULAMA.md) içinde, hâlâ doğrulanamayanlar [`docs/OPEN_QUESTIONS.md`](docs/OPEN_QUESTIONS.md) içinde listelidir. Her sayfada “Kanıt” rozeti vardır (kaynaklı / karma / topluluk bilgisi). Konuya hâkim bir editör gözden geçirmesi yine de gereklidir.

## İçerik

| Bölüm | Konum | Ne var? |
|---|---|---|
| Rehber | `src/content/guide/{baslangic,orta,ileri}` | 3 yol × 15 ders (MDX) |
| Wiki | `src/content/wiki` | 63 madde: terimler, su kimyası, ekipman, hastalıklar, beslenme, genetik… |
| Araçlar | `src/pages/araclar`, `src/lib` | 31 araç (aşağıda) |
| Sorun giderme | `/sorun-giderme` | Belirtiden olası nedene karar aracı |
| Seviye testi | `/seviye-testi` | 18 soruluk yönlendirme testi |
| SSS, Sözlük, Kaynaklar | `/sss`, `/sozluk`, `/kaynaklar` | |

**Araçlar:** akvaryum hacmi · su değişimi · balık sayısı planlayıcı · gebelik/doğum takvimi · yem planlayıcı · bakım takvimi (.ics) · azot döngüsü takipçisi · yavru büyüme takipçisi · maliyet ve kârlılık · etiket oranı ölçekleyici (doz önermez) · pedigri çizici · Punnett hesaplayıcı · inbreeding (Wright F) · 3B akvaryum modelleri: lepistes (29 renk, 15 form) · molly · plati · kılıçkuyruk (5 form, 10 renk) · cüce gurami (8 renk, erkek/dişi) · kaplan barb (6 renk, 2 form, erkek/dişi) · zebra danio (5 renk, 2 form, erkek/dişi) · kardinal tetra (4 renk, 2 form, erkek/dişi; kırmızı şerit tam boy) · ram çiklit (5 renk, 3 form, erkek/dişi) · betta (12 form) · melek · diskus · pleko (L144) · neon tetra · corydoras · japon balığı (10 form) · Neocaridina karidesi (her birinde renk + form varyetesi, numaralı noktaları açıp kapama) · 3B tatlı su vatozu modeli (üst/alt yüz anatomisi, klasper, kuyruk dikeni; 6 şematik desen: motoro, leopoldi, cururu vb.; genel Potamotrygon benzeri disk, tür kimliği kaynakla doğrulanmalı).

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
| `npm run e2e` | Playwright E2E testleri (154 test = 77 senaryo × masaüstü/mobil): araçlar, sorun giderme, seviye testi, gezinti, arama (önce `build`; `CHROME=<yol>` ile tarayıcı verilebilir) |
| `npm run a11y` | Tüm sayfalarda axe taraması, açık ve koyu tema (önce `build`; `CHROME=<yol>` ile tarayıcı verilebilir) |
| `npm run pwa` | Manifest, simgeler, hizmet çalışanı ve **gerçek çevrimdışı** gezinti/arama/araç denetimi (önce `build`) |
| `npm run lighthouse` | Seçili 7 sayfada Lighthouse (mobil); performans ≥ 85, erişilebilirlik/en iyi uygulamalar/SEO ≥ 95 |
| `npm run open-questions` | `docs/OPEN_QUESTIONS.md` dosyasını yeniden üretir |

CI (`.github/workflows/ci.yml`) şunları çalıştırır: test → `check` → `build` → `check:links` → `e2e` → `a11y` → `pwa` → `lighthouse` → `OPEN_QUESTIONS.md` güncel mi.

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
tests/e2e/             Playwright E2E testleri (*.e2e.ts)
scripts/               check-links, list-unverified, a11y, lighthouse, pwa-check, build-sw
docs/                  Plan ve doğrulama listesi
```

## İçerik yazarken

- Derslerde bir wiki maddesine `<Terim s="madde-slugu">metin</Terim>` ile bağlanın; madde yoksa build hata verir.
- Vurgu kutuları için `<Uyari tip="bilgi|uyari|hata|ipucu">`.
- Güvenilir kaynağı olmayan sayısal iddiayı **kesin yazmayın**; sayfanın frontmatter'ına `needs_verification: true` ekleyin.
- Bilimsel iddialar için `src/data/kaynaklar.json` içine kaynak ekleyin ve `/kaynaklar#id` ile bağlayın.
- Ayrıntılar: [`CONTRIBUTING.md`](CONTRIBUTING.md), editör listesi: [`CONTENT_REVIEW.md`](CONTENT_REVIEW.md).

## Erişilebilirlik

- axe-core taraması (WCAG 2.0/2.1/2.2 A–AA + en iyi uygulamalar) tüm sayfalarda, açık ve koyu temada, mobil görünümde ihlalsiz geçer.
- Klavye gezintisi için görünür odak çerçevesi, "ana içeriğe geç" bağlantısı, `prefers-reduced-motion` desteği, en az 24 px dokunma hedefi.
- Renk değişkenleri açık ve koyu tema için kontrast denetiminden geçecek biçimde ayarlıdır; yeni renk eklerseniz `npm run a11y` çalıştırın.
- Diyagramlar (`src/components/diyagram/`, `<Diyagram ad="…" baslik="…" />` ile eklenir) satır içi SVG'dir, tema renk değişkenlerini kullanır ve `<title>`/`<desc>` ile metin alternatifi taşır.
- Görev listesi onay kutularına (`- [ ]`) derleme sırasında `aria-label` eklenir (`src/lib/rehype-task-labels.mjs`).
- Not: Astro 7'nin varsayılan MDX işlemcisi rehype eklentilerini çalıştırmaz; bu yüzden `astro.config.mjs` içinde `unified` işlemcisi kullanılır.

## PWA ve çevrimdışı kullanım

- Site kurulabilir bir web uygulamasıdır (`public/manifest.webmanifest`, simgeler `public/icons/`; yeniden üretmek için `node scripts/make-icons.mjs`).
- `npm run build` sonunda `scripts/build-sw.mjs`, `public/sw-template.js` şablonundan `dist/sw.js` üretir: tüm sayfalar, varlıklar ve arama dizini (~290 dosya, ~2,5 MB) ilk ziyarette önbelleğe alınır; önbellek adı içerik özetinden türetilir, yeni sürümde eski önbellek silinir.
- Gezinme isteklerinde ağ önce denenir (3 sn), olmazsa önbellek, o da yoksa `/offline/` sayfası gösterilir. Diğer dosyalar önbellekten sunulur.
- Çevrimdışıyken tüm rehber, wiki, araçlar, sorun giderme, test ve arama çalışır; takipçi verisi zaten yereldir.
- Hizmet çalışanı yalnızca üretim derlemesinde kaydedilir (geliştirme sunucusunda yoktur).
- Yayın notu: site bir alt dizinde değil, alan adının kökünde (`/`) sunulmalıdır; aksi halde manifest ve `sw.js` yolları ayarlanmalıdır.

## Yayınlama

`npm run build` çıktısı (`dist/`) statik bir sitedir; Cloudflare Pages, Netlify, GitHub Pages gibi herhangi bir statik barındırmada çalışır.

**Adres ve barındırma:** Site adı *Lepistes Rehberi*. Barındırma Cloudflare'dedir. Adres tek yerde tanımlıdır: `astro.config.mjs` → `site`; sitemap, `robots.txt`, canonical ve Open Graph bağlantıları buradan türetilir. Cloudflare'in verdiği gerçek adres `site` ile aynı olmalıdır; farklıysa yalnızca bu satırı değiştirin.

### Cloudflare kurulumu (Workers — statik varlıklar)
Depodaki `wrangler.jsonc`, `dist/` klasörünü statik site olarak yayınlar; bulunamayan adreslerde `404.html` gösterilir. Boş `"previews": {}` bloğu, Cloudflare'in dal/PR önizleme derlemeleri (`npx wrangler preview`, açık beta) için gereklidir; yoksa o komut "missing a `previews` block" hatasıyla başarısız olur.

1. Cloudflare panelinde **Workers & Pages → Create** ile bu depoyu (`samekalsamet6-ux/Sametto`) bağlayın.
2. **Project name:** `lepistes-rehberi` — `wrangler.jsonc` içindeki `name` ile **aynı olmalı**, aksi halde derleme hata verir.
3. **Build command:** `npm run build` · **Deploy command:** `npx wrangler deploy` (varsayılan).
4. **Production branch:** `main`. Build ortamı değişkeni olarak `NODE_VERSION` = `22` ekleyin (depoda `.nvmrc` de vardır).
5. Dağıtım bitince çıkan adresi (`lepistes-rehberi.<hesap-alt-alan-adı>.workers.dev`) `astro.config.mjs` → `site` değerine yazıp yeniden dağıtın.
6. Kendi alan adınızı ekleyecekseniz projenin **Settings → Domains & Routes** bölümünden bağlayın ve `site` değerini güncelleyin.

`public/_headers` dosyası güvenlik başlıklarını ve önbellek kurallarını (hash'li varlıklar uzun süre, `sw.js` ve manifest hiç önbelleğe alınmaz) tanımlar. Site alan adının kökünde (`/`) sunulmalıdır (PWA ve çevrimdışı mod buna dayanır).

Yayından önce [`CONTENT_REVIEW.md`](CONTENT_REVIEW.md) listesini tamamlayın.

## Yapılacaklar


## Lisans

- **Kaynak kod:** [MIT](LICENSE).
- **İçerik** (rehber, wiki, diyagramlar, simgeler, veri dosyaları, belgeler): [CC BY-SA 4.0](LICENSE-CONTENT.md) (tam metin: [`LICENSE-CC-BY-SA-4.0.txt`](LICENSE-CC-BY-SA-4.0.txt)) — atıf verin, uyarlamayı aynı lisansla paylaşın.
- Telif hakkı sahibi: “Lepistes Rehberi katkıcıları”. Site adı: **Lepistes Rehberi**.
- Üçüncü taraf kaynaklar bu lisansların dışındadır ([Kaynaklar](src/data/kaynaklar.json)). Lisans metinleri hukuki tavsiye değildir.

## Sorumluluk reddi

Bilgiler eğitim amaçlıdır. İlaç ve tedavi konusunda ürün etiketine ve uzman görüşüne başvurun. Lepistes yabancı tür olabilir; **doğaya salmayın**.
