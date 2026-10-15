# Katkı rehberi

## Genel akış
1. Dal açın, değişikliği yapın.
2. Yerelde şunların geçtiğinden emin olun: `npm test && npm run check && npm run build && npm run check:links && npm run e2e && npm run a11y`.
3. Doğrulama durumunu değiştirdiyseniz `npm run open-questions` çalıştırıp `docs/OPEN_QUESTIONS.md` dosyasını da commit edin (CI bunu kontrol eder).
4. Pull request açın.

## İçerik kuralları
- **Uydurma bilgi yok.** Her sayısal veya biyolojik iddia güvenilir bir kaynağa dayanmalı (hakemli makale, üniversite/uzantı yayını, FishBase benzeri veri tabanı, saygın dernek). Forum bilgisi tek başına kaynak değildir; "topluluk deneyimi" olarak belirtin.
- Kaynağı yoksa kesin sayı yazmayın; "yaklaşık", "kaynakla doğrulanmalı" deyin ve `needs_verification: true` ekleyin. Sayfanın kanıt düzeyini `evidence: kaynakli | karma | topluluk` ile belirtin; hobi kaynaklarını kanıt gibi sunmayın.
- Yeni bir kaynak eklerken `src/data/kaynaklar.json` içine **neyin okunduğunu** (özet mi, tam metin mi) yazın; yeni bir düzeltmeyi `docs/DOGRULAMA.md` tablosuna işleyin.
- İlaç, tuz, kimyasal ve elektrik konusunda **doz vermeyin**; ürün etiketine ve uzmana yönlendirin.
- Hayvan refahı önceliklidir. Zarar verici uygulamaları teşvik etmeyin; ayıklamada alternatifleri (satış, bağış) önce anlatın. Balıkların doğaya salınmaması uyarısını koruyun.
- Dil sade ve saygılı olsun; başlangıç içeriğinde jargona ilk geçişte sözlük bağlantısı verin.

## Yeni içerik eklemek

**Rehber dersi:** `src/content/guide/<seviye>/NN-kisa-ad.mdx`

```yaml
---
title: "Başlık"
summary: "En fazla 200 karakter"
level: baslangic   # baslangic | orta | ileri
order: 16
readingMinutes: 6
last_reviewed: 2026-10-15
needs_verification: false
---
```

**Wiki maddesi:** `src/content/wiki/<slug>.mdx`

```yaml
---
title: "Başlık"
summary: "En fazla 200 karakter"
category: terimler
level: baslangic
tags: [etiket]
related: [diger-madde-slugu]   # var olan maddeler olmalı
last_reviewed: 2026-10-15
confidence: orta               # yuksek | orta | dusuk
needs_verification: false
---
```

MDX'te metin içinde çıplak `<`, `{` yazmayın.

## E2E testleri
Etkileşimli bir sayfa veya araç eklerseniz `tests/e2e/*.e2e.ts` altına senaryo ekleyin. Testler derlenmiş siteyi (`dist/`) sunar, bu yüzden önce `npm run build` gerekir. Her test hem masaüstü hem mobil görünümde çalışır. Beklenen metinleri gevşetmeyin: testin amacı davranış değişince kırılmaktır.

## Yeni araç eklemek
1. Hesabı `src/lib/calculators/` altında **saf fonksiyon** olarak yazın (DOM kullanmayın).
2. Sınır durumlarını da kapsayan testi ekleyin (`*.test.ts`); geçersiz girdide `RangeError` fırlatın.
3. Sayfayı `src/pages/araclar/` altında oluşturun; ondalık virgülü için `src/lib/dom.ts` içindeki `num()` kullanın.
4. Aracı `src/data/araclar.ts` listesine ekleyin.
5. Sezgisel veya doğrulanmamış varsayımlar kullanıyorsa sayfada görünür uyarı verin.

## Erişilebilirlik kuralları
- Tablo başlık hücreleri boş bırakılmaz (ilk sütun için bile bir başlık yazın).
- Form alanlarına `<label>` veya `aria-label` verin; satır içi `style` ile renk tanımlamayın (tema değişkenlerini kullanın).
- Tıklanabilir öğeler en az 24×24 px olmalı; bitişik küçük bağlantılar arasında boşluk bırakın.

## Lisans
Katkı yaparak, kodunuzun MIT, içeriğinizin CC BY-SA 4.0 lisansıyla yayımlanmasını kabul etmiş olursunuz. Başkasına ait metin, görsel veya tablo kopyalamayın; kaynakları kendi cümlelerinizle özetleyip `kaynaklar.json` içinde belirtin.

## Commit
Kısa, açıklayıcı, Türkçe veya İngilizce mesajlar.
