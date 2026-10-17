// Lepistes form (şekil) varyeteleri: meta veri (saf). Geometri model.ts içindeki FORM_SHAPES'te.
// Not: hobi/yarışma kaynakları kuyruk adlarını ve oranlarını farklı tanımlayabilir; açıklamalar şematik yorumdur.
import { FORM_SHAPES } from './model';

export interface GuppyForm { id: string; ad: string; aciklama: string; grup: string; dogrulanmali?: boolean }

export const FORM_GROUPS = ['Standart', 'Üçgen ve yelpaze kuyruklar', 'Yuvarlak ve sivri kuyruklar', 'Kılıç kuyruklar', 'Uzun ve özel yüzgeçler', 'Göğüs yüzgeci'] as const;

export const FORMS: GuppyForm[] = [
  { id: 'standart', grup: 'Standart', ad: 'Standart (bu sayfadaki temel biçim)',
    aciklama: 'Bu sayfanın temel biçimi: erkekte geniş, delta benzeri büyük kuyruk ve uzun sırt yüzgeci; dişide kısa yelpaze kuyruk. Renk varyetelerinin hepsi bu biçim üzerinde tanıtılır.' },
  { id: 'dogal', grup: 'Standart', ad: 'Doğal (yabani tip benzeri)',
    aciklama: 'Doğadaki lepistesin kısa, yuvarlağımsı yelpaze kuyruğu ve kısa sırt yüzgeci; süs soylarına göre çok daha küçük yüzgeçler. Şematik yorumdur.' },
  { id: 'delta', grup: 'Üçgen ve yelpaze kuyruklar', ad: 'Delta',
    aciklama: 'Üçgen (delta harfi gibi) açılmış geniş kuyruk; arka kenar neredeyse düz. Üçgen kuyruk, süs lepistesinin en yaygın biçimlerindendir. Açılma açısı ve uzunluk kaynaklara göre değişir.' },
  { id: 'fantail', grup: 'Üçgen ve yelpaze kuyruklar', ad: 'Fantail (yelpaze kuyruk)',
    aciklama: 'Yelpaze gibi açılan, arka kenarı yuvarlak ve delta kuyruktan daha kısa kuyruk. Mağaza balıklarında yaygındır; gösteri yetiştiricileri genellikle daha az değer verir.' },
  { id: 'veiltail', grup: 'Üçgen ve yelpaze kuyruklar', ad: 'Veiltail (peçe kuyruk)',
    aciklama: 'Uzun, akıcı ve aşağı doğru sarkan peçe gibi kuyruk; gövde uzunluğunu aşabilir. Kaynaklar kuyruğu bazen üçgen, bazen yamuk olarak tarif eder.', dogrulanmali: true },
  { id: 'lyretail', grup: 'Yuvarlak ve sivri kuyruklar', ad: 'Lyretail (lir kuyruk)',
    aciklama: 'Üst ve alt ışınlar ortadakilerden uzundur; arka kenar lir (U) biçimi alır, uçlar içe doğru kıvrılır.' },
  { id: 'pintail', grup: 'Yuvarlak ve sivri kuyruklar', ad: 'Pintail (iğne kuyruk)',
    aciklama: 'Orta ışınların uzadığı, uca doğru sivrilen dar mızrak biçimli kuyruk; doğal tipe en yakın biçimlerden biri sayılır.' },
  { id: 'round', grup: 'Yuvarlak ve sivri kuyruklar', ad: 'Round tail (yuvarlak kuyruk)',
    aciklama: 'Arka kenarı düzgün bir yay çizen yuvarlak kuyruk; uzunluğu genelde gövdenin yaklaşık yarısı kadar tarif edilir (kaynaklara göre değişir).' },
  { id: 'spade', grup: 'Yuvarlak ve sivri kuyruklar', ad: 'Spade tail (maça kuyruk)',
    aciklama: 'Yuvarlak kuyruğa benzer ama ortada kısa bir sivri uç taşır (maça/kürek biçimi). Round tail ile arasındaki ayrım kaynaklara göre değişebilir.', dogrulanmali: true },
  { id: 'flag', grup: 'Uzun ve özel yüzgeçler', ad: 'Flag tail (bayrak kuyruk)',
    aciklama: 'Dikdörtgen, arka kenarı düz ve uzun kuyruk; yüzerken bayrak gibi dalgalanır. Seyrek görülür; bazı kaynaklar delta kuyruktan türediğini söyler.', dogrulanmali: true },
  { id: 'ribbon', grup: 'Uzun ve özel yüzgeçler', ad: 'Ribbon (şerit / uzun yüzgeç)',
    aciklama: 'Çok uzun, şerit gibi akan kuyruk ve belirgin biçimde uzamış sırt yüzgeci. "Ribbon" adı kaynaklara göre farklı tanımlanıyor; bu model şematik bir yorumdur.', dogrulanmali: true },
  { id: 'kilic-ust', grup: 'Kılıç kuyruklar', ad: 'Üst kılıç (top sword)',
    aciklama: 'Kuyruğun üst kenarındaki ışınlar kılıç gibi uzar. Kılıç erkekte görülür; modelde dişide kılıç gösterilmez.' },
  { id: 'kilic-alt', grup: 'Kılıç kuyruklar', ad: 'Alt kılıç (bottom sword)',
    aciklama: 'Kuyruğun alt kenarındaki ışınlar kılıç gibi uzar. Kılıç erkekte görülür; modelde dişide kılıç gösterilmez.' },
  { id: 'kilic-cift', grup: 'Kılıç kuyruklar', ad: 'Çift kılıç (double sword)',
    aciklama: 'Kuyruğun hem üst hem alt kenarında kılıç. Kılıç erkekte görülür; modelde dişide kılıç gösterilmez.' },
  { id: 'dumbo', grup: 'Göğüs yüzgeci', ad: 'Fil kulak (dumbo ear)',
    aciklama: 'Göğüs yüzgeçleri normalden çok büyüktür ve kulak gibi yanlara açılır; kuyruk standart biçimdedir. Satıcıların verdiği "2-3 kat" gibi oranlar standart bir ölçü değil, pazarlama ifadesidir.' },
];

for (const f of FORMS) if (!FORM_SHAPES[f.id]) throw new Error(`FORM_SHAPES eksik: ${f.id}`);

export const formById = (id: string): GuppyForm => FORMS.find((f) => f.id === id) ?? FORMS[0];

export function groupedForms(): { grup: string; items: GuppyForm[] }[] {
  return FORM_GROUPS.map((g) => ({ grup: g, items: FORMS.filter((f) => f.grup === g) })).filter((g) => g.items.length > 0);
}
