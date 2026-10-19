// Amano karidesi anatomi parçaları: karides hattının ortak parçaları üzerine Amano'ya özgü açıklamalar ve iki ek parça (yan benek sırası, sırt çizgisi).
import { PARTS as BASE, type Part as BasePart } from '../karides/parts';
import type { Sex } from '../karides/model';

export type PartId = string;
export type { ViewId } from '../karides/parts';
export interface Part extends Omit<BasePart, 'id'> { id: PartId }

const over: Record<string, Partial<Part>> = {
  rostrum: {
    ozet: 'Karapaksın önünden uzanan, küçük dişli ince çıkıntı.',
    aciklama: 'Karapaksın ön ucundan ileri uzanan sert, bıçak benzeri çıkıntıdır. Türün bilimsel adındaki “multidentata” (çok dişli) ifadesi rostrumdaki çok sayıdaki küçük dişe işaret eder; üst kenarda dişler dizilidir, alt kenarda daha seyrektir. Kesin diş sayısı bireye göre değişir (kaynakla doğrulanmalı); bu modelde diş sayısı ve biçimi şematiktir ve rostrum Neocaridina’dan biraz daha uzun çizilmiştir.',
    dogrulanmali: true,
  },
  kiskac: {
    ad: 'Fırça kıskaçlar (ilk iki çift bacak)', ozet: 'İlk iki bacak çiftinin ucunda kıllı, fırçamsı minik pensler.',
    aciklama: 'İlk iki yürüme bacağı çiftinin ucundaki küçük kıskaçlar (şela), karideslerin (Atyidae ailesi) tipik “fırça” biçimli ince kıl demetleriyle çevrilidir. Karides bunlarla zemindeki yosun, biyofilm ve organik kırıntıyı süpürür, suda asılı parçacıkları süzerek ağza taşır; avlanma silahı değildir. Bu modelde kıllar yalnızca küçük bir fırça tutamı olarak şematik gösterilmiştir (kaynakla doğrulanmalı).',
    dogrulanmali: true,
  },
  karapaks: { aciklama: 'Karidesin başı ile göğsü kaynaşmıştır (sefalotoraks) ve üstü karapaks denen kabukla örtülüdür; altında solungaç odası bulunur. Amano karidesinin kabuğu yarı saydamdır; içten organlar ve renkli noktalar seçilebilir. Karides büyürken periyodik olarak kabuk değiştirir (ecdysis). Bu modelde kabuk opak çizilmiştir (şematik).' },
  eyer: {
    ozet: 'Olgun dişide sırtta karapaksın arkasında görünen yeşilimsi alan.',
    aciklama: 'Üremeye hazır dişilerde yumurtalıkların geliştiği alan karapaksın arka kısmında sırtta yeşilimsi bir “eyer” olarak görülebilir; kaynaklarda parlak ya da soluk yeşil olarak anlatılır. Bu modelde eyer yumuşak bir yeşilimsi leke olarak gösterilmiştir; görünüm ve süre bireye göre değişir (kaynakla doğrulanmalı).',
  },
  yumurta: {
    aciklama: 'Dişi, döllenmiş yumurtalarını karnının altında yüzme bacaklarına tutturup taşır (berry); kaynaklarda yaklaşık altı hafta taşındığı belirtilir. Amano yumurtaları küçük, çok sayıda ve gri-yeşilimsidir. Önemli fark: yumurtadan çıkan larvalar tatlı suda gelişemez; doğada akıntıyla acı suya (haliç) taşınır, orada gelişip tatlı suya döner. Bu yüzden akvaryumda genellikle tatlı suda üremez, yavru görülmez. Bu modelde yumurtalar “Yumurtalı (berry)” seçeneği ile gösterilir (kaynakla doğrulanmalı).',
  },
  appendix: { aciklama: 'Birçok karides türünde erkeklerin ikinci çift yüzme bacağında “appendix masculina” adlı küçük bir çıkıntı bulunduğu anlatılır; Amano için ayrıntı kaynaklarda zayıftır ve çıplak gözle görmek zordur. Bu modelde yalnızca küçük bir şematik çıkıntıdır (kaynakla doğrulanmalı). Erkeklerde yan benekler yuvarlak noktalardır ve gövde dişiden daha küçüktür.' },
};

const extra: Part[] = [
  { id: 'benek', ad: 'Yan benek sırası (erkekte nokta, dişide çizgi)', view: 'yan', dogrulanmali: true,
    ozet: 'Gövdenin yanlarında uzanan kırmızımsı-kahverengi benek/çizgi sırası.',
    aciklama: 'Amano karidesinin tanınmasını sağlayan özellik, gövde yanlarında karapaksın arkasından kuyruğa uzanan kırmızımsı-kahverengi benek sırasıdır. Yaygın olarak anlatılan cinsiyet ayrımı: erkekte bu işaretler yuvarlak, küçük noktalar; dişide ise daha uzun, tire (kesik çizgi) biçimindedir. Gençlerde ayrım zordur ve her bireyde kesin değildir; bu model ayrımı şematik gösterir (kaynakla doğrulanmalı).' },
  { id: 'sirt-cizgisi', ad: 'Sırt çizgisi', view: 'ust', dogrulanmali: true,
    ozet: 'Sırt ortasında baştan kuyruğa uzanan ince açık çizgi.',
    aciklama: 'Amano karideslerinde sırt ortasında rostrumdan kuyruğa doğru uzanan ince, açık renkli bir çizgi görülür; yarı saydam gri-yeşil gövdeyle birlikte türün karakteristik görünümünü verir. Çizginin belirginliği bireye göre değişir (kaynakla doğrulanmalı).' },
];

const list: Part[] = [];
for (const p of BASE) {
  list.push({ ...p, ...(over[p.id] ?? {}) } as Part);
  if (p.id === 'karin') list.push(extra[0], extra[1]);
}
export const PARTS: Part[] = list;
export const partsFor = (sex: Sex): Part[] => PARTS.filter((p) => !p.sex || p.sex === sex);
