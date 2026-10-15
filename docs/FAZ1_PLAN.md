# Faz 1 — Keşif ve Plan

Güncel durum için README ve OPEN_QUESTIONS.md dosyalarına bakın.

Kaynak görev tanımı: `LEPISTES_SITE_PROMPT.md`

## Varsayımlar
- "Lepstes" = Lepistes (Poecilia reticulata / guppy).
- Dil Türkçe; i18n altyapısı sonradan eklenir. Birimler metrik.
- Hesap/giriş yok; veriler tarayıcıda (localStorage/IndexedDB).
- Barındırma: statik (Cloudflare Pages / Netlify / GitHub Pages).
- Görseller kendi SVG diyagramlarımız; harici telifli görsel yok.

## Teknoloji kararı (gerekçe)
| Katman | Seçim | Neden |
|---|---|---|
| Çatı | Astro (SSG) | İçerik ağırlıklı site, sıfıra yakın JS, hızlı |
| İçerik | MDX + content collections + Zod | Frontmatter doğrulaması, derleme zamanı hata |
| Stil | Elle yazılmış CSS (değişkenli tema) | Bağımlılık azlığı, açık/koyu tema kolay |
| Araçlar | Saf TypeScript modülleri (`src/lib/calculators`) + vanilla script | UI'dan bağımsız, Vitest ile test edilebilir |
| Arama | Pagefind (Faz 3) | Statik, Türkçe uyumlu, sunucusuz |
| Test | Vitest (birim), Playwright (Faz 9) | |

## Rota listesi
`/` · `/rehber` · `/rehber/{baslangic,orta,ileri}/…` · `/wiki` · `/wiki/<kategori>/<madde>` · `/araclar` · `/araclar/<arac>` · `/sorun-giderme` · `/sozluk` · `/sss` · `/kaynaklar` · `/hakkinda`

## İçerik envanteri
- Rehber: 3 yol × 15 ders (başlıklar `LEPISTES_SITE_PROMPT.md` §4)
- Wiki: 10 kategori, ≥150 sözlük maddesi (§5)
- Araçlar: 22 (§6); 1. dalga: hacim, stok, su değişimi, azot döngüsü, gebelik takvimi, yem, bakım takvimi

## Uygulama durumu
- [x] Faz 1 plan
- [x] Faz 2 iskelet: Astro projesi, tema, içerik şeması, ilk rehber/wiki sayfaları
- [x] Faz 7-8 araçları (9): hacim, su değişimi, stok, gebelik, yem, bakım takvimi (.ics), azot döngüsü takipçisi, Punnett, Wright F — 40 birim testi, tarayıcıda duman testi
- [x] Faz 3 arama (Pagefind), sözlük bağlantı/tooltip (Terim), TOC, geri bağlantılar, kırık link denetimi
- [x] Faz 4 başlangıç içeriği: 15 ders + 29 wiki maddesi (sayısal değerler `needs_verification`)
- [x] Faz 5 orta içerik: 15 ders + 16 yeni wiki maddesi (45 madde toplam)
- [x] Faz 6 ileri içerik: 15 ders + 17 wiki maddesi + kaynaklar sayfası (62 madde toplam)
- [x] Faz 10 (kısmen): CI, README, CONTRIBUTING, CONTENT_REVIEW, OPEN_QUESTIONS
- [x] Faz 10: erişilebilirlik (axe: 254 tarama, ihlal yok) ve Lighthouse (7 sayfa, hepsi 91-100)
- [x] SVG diyagramlar: 6 (azot akışı, azot grafiği, tank düzeni, gonopodium, Punnett, soy ağacı)
- [x] PWA: manifest, simgeler, hizmet çalışanı (290 dosya önbellekte), gerçek çevrimdışı denetimi
- [ ] Faz 10 kalan: E2E, kalan araçlar, lisans

## Doğrulama gerektiren konular (⚠)
Sıcaklık/pH/GH/KH aralıkları, gebelik süresi–sıcaklık, doğum başına yavru sayısı, olgunlaşma yaşı, kalıtım tipleri (özellik bazında), tuz banyosu dozları. Bunlar kaynakla teyit edilmeden sayısal olarak yazılmayacak; mevcut sayfalarda `needs_verification: true` ile işaretlidir.

## Açık sorular (onay isteyen)
1. Alan adı / site adı? (şimdilik "Lepistes Rehberi")
2. Hedef barındırma sağlayıcısı?
3. Reklam/analitik olacak mı? (varsayılan: yok)
4. Görseller için fotoğraf kaynağınız var mı?
