// Japon balığı form (şekil) varyeteleri. Renk varyetelerinden bağımsızdır; her form her renkle birleşir.
// Şematik yorumlardır, ırk standardı değildir. Modellenmeyenler: ranchu, pompom, celestial, jikin, Veiltail, Tosakin vb.
import type { SpeciesForm } from '../akvaryum/types';

export const GRUP_TEK = 'Tek kuyruklu (common tipi)';
export const GRUP_FANCY = 'Çift kuyruklu süs (fancy) biçimleri';

export const FORMS: SpeciesForm[] = [
  { id: 'standart', grup: GRUP_TEK, ad: 'Common (standart)', dogrulanmali: false,
    aciklama: 'Yabani sazana yakın, uzun ve orta derinlikli gövde; tek sırt, tek anal ve tek (orta uzunlukta, çatallı) kuyruk yüzgeci. En dayanıklı ve en yaygın biçimlerden biri olarak anılır. Şematik yorum.' },
  { id: 'comet', grup: GRUP_TEK, ad: 'Comet', dogrulanmali: false,
    aciklama: 'Common’dan daha ince gövdeli; uzun, derin çatallı, sivri uçlu tek kuyruk yüzgeciyle ayrılır. Bu biçim 1800’lerin sonunda ABD’de geliştirilmiş olarak anlatılır. Şematik yorum.' },
  { id: 'bristol', grup: GRUP_TEK, ad: 'Bristol shubunkin (büyük yuvarlak kuyruk)', dogrulanmali: true,
    aciklama: 'Shubunkin’in Bristol biçimi, common gövdesine büyük, simetrik, yuvarlak bir tek kuyruk yüzgeci ekler; London shubunkin ile gövde ve kuyruk biçimi bakımından ayrışır, ayrıntı kaynağa göre değişir. “Shubunkin” adı kaynaklarda esasen alaca (calico) renk desenine de gönderme yapar; renk için renk seçicisindeki Shubunkin’e bakın. Şematik yorum.' },
  { id: 'fantail', grup: GRUP_FANCY, ad: 'Fantail', dogrulanmali: false,
    aciklama: 'Yumurta biçimli, kısa ve derin gövde; yüksek, dik sırt yüzgeci; çift anal yüzgeç ve ikiye ayrık, uzun, perde gibi çift kuyruk. Şematik yorum; kuyruk uzunluğu ve ayrılma derecesi bireye göre değişir.' },
  { id: 'ryukin', grup: GRUP_FANCY, ad: 'Ryukin', dogrulanmali: false,
    aciklama: 'Fantail’e benzer ama başın arkasında belirgin bir omuz kamburu, çok yüksek sırt yüzgeci ve kısa derin gövdesi vardır; çift kuyruk ve çift anal yüzgeç taşır. Şematik yorum.' },
  { id: 'oranda', grup: GRUP_FANCY, ad: 'Oranda (wen’li)', dogrulanmali: true,
    aciklama: 'Fantail benzeri gövde ve çift kuyruğa, başta yumrulu etli bir büyüme (wen) eklenmiş biçim; wen’in büyüklüğü yaşa ve bireye göre çok değişir. Şematik yorum; kaynaklarda ırk ayrımları farklı anlatılabilir.' },
  { id: 'lionhead', grup: GRUP_FANCY, ad: 'Lionhead', dogrulanmali: true,
    aciklama: 'Sırt yüzgeci yoktur; baş ve yanaklarda geniş, yumrulu wen taşır; çift kuyruk kısadır ve gövde yuvarlaktır. Ranchu (Japon soyu) benzer ama sırtı kavisli olduğundan ayrı bir ırk olarak anılır ve bu modelde yoktur. Şematik yorum.' },
  { id: 'teleskop', grup: GRUP_FANCY, ad: 'Telescope (teleskop / moor)', dogrulanmali: true,
    aciklama: 'Fantail benzeri çift kuyruklu gövdede, gözler başın iki yanında koni gibi dışarı taşar; siyah olanlara “moor” da denir (renk seçicisinden bağımsızdır). Şematik yorum; göz çıkıntısının derecesi bireye göre değişir.' },
  { id: 'balon-goz', grup: GRUP_FANCY, ad: 'Bubble eye (balon göz)', dogrulanmali: true,
    aciklama: 'Sırt yüzgeci yoktur; gözler yukarı bakar ve altlarında sıvı dolu iki torba (kese) sarkar. Keseler çok hassastır; bu biçimin bakımı özel dikkat gerektirir. Şematik yorum.' },
  { id: 'inci', grup: GRUP_FANCY, ad: 'Pearlscale (inci pullu)', dogrulanmali: true,
    aciklama: 'Top gibi yuvarlak gövde ve kubbeli, inci tanesi gibi kabarık pullar; çift kuyruklu ve çift anal yüzgeçlidir. Şematik yorum; pulların kabarıklığı bireye göre değişir.' },
];
