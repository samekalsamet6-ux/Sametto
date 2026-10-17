export interface Tool { slug: string; title: string; desc: string; group: 'Hesaplayıcı' | 'Planlayıcı' | 'Takip' | 'Genetik' | 'Görsel' }
export const tools: Tool[] = [
  { slug: 'hacim', title: 'Akvaryum hacmi', desc: 'Brüt ve net litre hesabı.', group: 'Hesaplayıcı' },
  { slug: 'su-degisimi', title: 'Su değişimi', desc: 'Hedef nitrata göre değişim oranı.', group: 'Hesaplayıcı' },
  { slug: 'stok', title: 'Balık sayısı planlayıcı', desc: 'Hacim, filtre ve bitkiye göre sezgisel kapasite aralığı.', group: 'Planlayıcı' },
  { slug: 'gebelik', title: 'Gebelik ve doğum takvimi', desc: 'Beklenen doğum penceresi (aralık ayarlanabilir).', group: 'Planlayıcı' },
  { slug: 'yem', title: 'Yem planlayıcı', desc: 'Yaş gruplarına göre öğün sayısı ve saatleri.', group: 'Planlayıcı' },
  { slug: 'bakim-takvimi', title: 'Bakım takvimi (.ics)', desc: 'Rutin görevleri telefon takvimine ekleyin.', group: 'Planlayıcı' },
  { slug: 'azot-dongusu', title: 'Azot döngüsü takipçisi', desc: 'Amonyak/nitrit/nitrat kaydı, grafik ve durum.', group: 'Takip' },
  { slug: 'buyume', title: 'Yavru büyüme takipçisi', desc: 'Kendi gruplarınızın boy ölçümleri, büyüme hızı ve grafik.', group: 'Takip' },
  { slug: 'maliyet', title: 'Maliyet ve kârlılık', desc: 'Elektrik, yem, ekipman ve satıştan balık başı maliyet.', group: 'Hesaplayıcı' },
  { slug: 'dozaj', title: 'Etiket oranı ölçekleyici', desc: 'Ürün etiketindeki oranı tankınızın hacmine çevirir (doz önermez).', group: 'Hesaplayıcı' },
  { slug: 'pedigri', title: 'Pedigri çizici', desc: 'Soy ağacınızı çizer, her bireyin F değerini gösterir.', group: 'Genetik' },
  { slug: 'punnett', title: 'Punnett hesaplayıcı', desc: 'Otozomal, X- ve Y-bağlantılı olasılıklar.', group: 'Genetik' },
  { slug: 'inbreeding', title: 'İnbreeding (Wright F)', desc: 'Soy ağacından planlanan çiftleşmenin F değeri.', group: 'Genetik' },
  { slug: '3d-lepistes', title: '3B lepistes modeli', desc: 'Erkek ve dişi lepistesin etkileşimli 3B modeli: anatomi, renk varyeteleri, yüzme animasyonu.', group: 'Görsel' },
];
