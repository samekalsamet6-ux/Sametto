# İçerik gözden geçirme listesi (insan editör)

Yapay zekâ ile üretilen içerik yayından önce konuya hâkim bir kişi tarafından okunmalıdır. Her sayfa için:

## Doğruluk
- [ ] Sayısal değerler (sıcaklık, pH, GH/KH, süreler, oranlar) kaynakla doğrulandı.
- [ ] Biyolojik iddialar (üreme, gebelik, olgunlaşma, sperm depolama) doğrulandı.
- [ ] Genetik iddialar kaynakla uyumlu; belirsiz olanlar "doğrulanmadı" olarak işaretli (`/kaynaklar` sayfası).
- [ ] İkincil olarak işaretli kaynaklar (`src/data/kaynaklar.json`) özgün haliyle okundu.
- [ ] Doğrulanan sayfada `needs_verification: false` yapıldı, `last_reviewed` güncellendi.

## Güvenlik ve etik
- [ ] İlaç, tuz, kimyasal için doz verilmiyor; etiket/uzman yönlendirmesi var.
- [ ] Ayıklama anlatımı insancıl ve alternatifler önce geliyor.
- [ ] "Doğaya salmayın" uyarısı korunuyor.
- [ ] Yasal konular (satış, nakliye) genel uyarı olarak kalıyor, hukuki tavsiye değil.

## Bütünlük
- [ ] Başlangıç sayfaları jargonu bağlantıyla açıklıyor.
- [ ] Aynı değer her sayfada aynı (örn. aralıklar, tank sayıları).
- [ ] Araç sayfalarındaki varsayımlar (balık sayısı, öğün sayıları, gebelik aralığı) kaynakla uyumlu veya uyarılı.
- [ ] Sorun giderme ağırlıkları (`src/data/belirtiler.ts`) uzman gözüyle makul.
- [ ] Quiz doğru cevapları ve açıklamaları doğru (`src/data/quiz.ts`).

## Yayın öncesi
- [ ] `docs/OPEN_QUESTIONS.md` listesi gözden geçirildi.
- [x] Site adı: Lepistes Rehberi.
- [ ] Alan adı ve `astro.config.mjs` `site` değeri ayarlandı (şimdilik `https://example.com`).
- [x] Lisans seçildi: kod MIT, içerik CC BY-SA 4.0 (`LICENSE`, `LICENSE-CONTENT.md`).
- [ ] CC BY-SA 4.0 resmî `legalcode` metni depoya eklendi (creativecommons.org bu ortamda erişilemedi).
- [ ] Görseller telifli değil; atıflar `credits` içinde.
