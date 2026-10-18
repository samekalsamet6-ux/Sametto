// Örnek (DEMO) veri: açıkça "Örnek ilan" olarak işaretli, üretilmiş yer tutucu fotoğraflı ilanlar.
import { loadDotEnv, readConfig } from '../server/config.ts';
import { openDb, createUser, createListing, findUserByEmail, addReport, addAquariumFish, listAquariumFish } from '../server/db.ts';
import { hashPassword } from '../server/auth.ts';
import { placeholderPng } from '../server/placeholder.ts';
import { savePhoto } from '../server/uploads.ts';
import { CATALOG, UNKNOWN_SEX } from '../shared/catalog.ts';
import type { ListingInput } from '../server/validation.ts';

loadDotEnv();
const quiet = process.argv.includes('--quiet');
const log = (...a: unknown[]) => { if (!quiet) console.log(...a); };
const cfg = readConfig();
const db = openDb(cfg.dbPath);

export const DEMO_USERS = [
  { email: 'ornek.satici@example.test', name: 'Örnek Satıcı (DEMO)', whatsapp: '905550000001', phone: null },
  { email: 'ornek.yetistirici@example.test', name: 'Örnek Yetiştirici (DEMO)', whatsapp: null, phone: '905550000002' },
] as const;
export const DEMO_PASSWORD = 'ornek-parola-123';

const hasListings = !!db.prepare('SELECT 1 FROM listings WHERE is_demo = 1').get();
if (hasListings) log('Örnek ilanlar zaten var; atlandı.');

const hash = await hashPassword(DEMO_PASSWORD);
const ids = DEMO_USERS.map((u) => {
  const id = findUserByEmail(db, u.email)?.id ?? createUser(db, u.email, hash, u.name, true);
  db.prepare('UPDATE users SET whatsapp = ?, phone = ? WHERE id = ?').run(u.whatsapp, u.phone, id);
  return id;
});

const spec = (sid: string) => CATALOG.find((s) => s.id === sid)!;
const cities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Eskişehir', 'Kocaeli', 'Konya'];
// [tür, şekil sırası, renk sırası, cinsiyet, adet, fiyat TL, açıklama]
const PLAN: [string, number, number, string, number, number, string][] = [
  ['lepistes', 2, 0, 'erkek', 3, 120, 'Örnek ilan metni: 3 erkek lepistes, evde üretim, sağlıklı ve iştahlı. Teslim elden.'],
  ['lepistes', 7, 3, 'disi', 2, 90, 'Örnek ilan metni: iki dişi, farklı kuşaklardan. Akvaryum suyuna alıştırılmış.'],
  ['lepistes', 11, 5, 'erkek', 1, 150, 'Örnek ilan metni: tek erkek, uzun kuyruklu form; gösteri kalitesi iddiası yoktur.'],
  ['betta', 3, 1, 'erkek', 1, 350, 'Örnek ilan metni: tek erkek betta, ayrı bir kavanozda büyütüldü, yem yiyor.'],
  ['betta', 1, 4, 'erkek', 1, 420, 'Örnek ilan metni: erkek betta, yüzgeçleri tam. Başka bir balıkla barındırmayın.'],
  ['japon', 3, 2, 'bilinmiyor', 5, 60, 'Örnek ilan metni: küçük boy japon balıkları, cinsiyet ayrımı henüz yapılamıyor.'],
  ['molly', 1, 1, 'disi', 4, 45, 'Örnek ilan metni: dişi molly grubu, yavru verebilir.'],
  ['platy', 1, 2, 'erkek', 6, 30, 'Örnek ilan metni: renkli platy erkekleri, toplu satılık.'],
  ['melek', 1, 2, 'bilinmiyor', 2, 200, 'Örnek ilan metni: genç melek balığı çifti adayı, cinsiyetleri belli değil.'],
  ['diskus', 0, 4, 'bilinmiyor', 1, 1800, 'Örnek ilan metni: genç diskus, yaklaşık 10 cm. Temiz ve yumuşak su ister.'],
  ['pleco', 1, 1, 'erkek', 1, 250, 'Örnek ilan metni: erkek pleco, gece aktif. Büyük akvaryum gerektirir.'],
  ['neon', 1, 1, 'bilinmiyor', 20, 8, 'Örnek ilan metni: 20 adet neon tetra, 2-3 cm, sürü hâlinde satılır.'],
  ['corydoras', 1, 0, 'bilinmiyor', 6, 35, 'Örnek ilan metni: 6 corydoras, kumlu zemin tercih ederler.'],
  ['karides', 0, 2, 'bilinmiyor', 10, 15, 'Örnek ilan metni: 10 adet karides, bitkili akvaryumdan.'],
  ['vatoz', 0, 0, 'bilinmiyor', 1, 3500, 'Örnek ilan metni: tatlı su vatozu; özel bakım bilgisi gerektirir, ilan yalnızca örnektir.'],
  ['diger', 0, 0, 'bilinmiyor', 2, 75, 'Örnek ilan metni: listede 3B modeli olmayan bir tür; yalnızca fotoğraflarla gösterilir.'],
];

let seed = 1;
if (!hasListings) PLAN.forEach(([sid, fi, vi, sex, qty, price, desc], i) => {
  const sp = sid === 'diger' ? null : spec(sid);
  const v: ListingInput = {
    speciesId: sid, speciesOther: sp ? null : 'Zebra danio', formId: sp?.forms.length ? sp.forms[Math.min(fi, sp.forms.length - 1)].id : null,
    variantId: sp ? sp.variants[Math.min(vi, sp.variants.length - 1)].id : null,
    sex: sp && sex !== UNKNOWN_SEX && !sp.sexes.some((s) => s.id === sex) ? sp.sexes[0].id : sex,
    quantity: qty, priceKurus: price * 100, city: cities[i % cities.length], title: '', description: desc,
    whatsapp: null, phone: null,
  };
  v.title = `${sp ? sp.ad : 'Zebra danio'} — ${sp ? [sp.forms[Math.min(fi, sp.forms.length - 1)]?.ad, sp.variants[Math.min(vi, sp.variants.length - 1)]?.ad].filter(Boolean).join(', ') : 'diğer'} (ÖRNEK)`;
  const n = 1 + (i % 3);
  const photos = Array.from({ length: n }, () => { const png = placeholderPng(seed++); return { file: savePhoto(cfg.uploadDir, png, 'image/png'), mime: 'image/png', bytes: png.length }; });
  const lid = createListing(db, ids[i % ids.length], v, photos, { demo: true, createdAt: Date.now() - i * 3_600_000 });
  if (i === 4) addReport(db, lid, null, 'diger', 'Örnek şikayet kaydı (DEMO)');
});
if (!hasListings) log(`${PLAN.length} örnek ilan eklendi. Demo hesap: ${DEMO_USERS[0].email} / ${DEMO_PASSWORD}`);

// Örnek akvaryum (DEMO satıcı): 12 karışık balık. Profilde "Örnek akvaryum" etiketiyle gösterilir; yalnızca temsilidir.
// [tür, şekil sırası, renk sırası, cinsiyet sırası]
const AQUARIUM: [string, number, number, number][] = [
  ['lepistes', 2, 3, 0], ['molly', 1, 1, 1], ['platy', 1, 2, 0], ['betta', 3, 1, 0], ['neon', 1, 1, 1], ['corydoras', 1, 0, 0],
  ['japon', 3, 2, 0], ['pleco', 1, 1, 1], ['melek', 1, 2, 0], ['diskus', 0, 4, 0], ['vatoz', 0, 0, 1], ['karides', 0, 2, 1],
];
if (listAquariumFish(db, ids[0]).length === 0) {
  for (const [sid, fi, vi, si] of AQUARIUM) {
    const sp = spec(sid);
    addAquariumFish(db, ids[0], { speciesId: sid, formId: sp.forms.length ? sp.forms[Math.min(fi, sp.forms.length - 1)].id : null, variantId: sp.variants.length ? sp.variants[Math.min(vi, sp.variants.length - 1)].id : null, sex: sp.sexes[Math.min(si, sp.sexes.length - 1)].id });
  }
  log(`${AQUARIUM.length} balıklı örnek akvaryum eklendi (${DEMO_USERS[0].name}).`);
}
