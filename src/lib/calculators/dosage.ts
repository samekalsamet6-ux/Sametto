/**
 * Ürün etiketindeki oranı hacme ölçekler. Bu araç doz ÖNERMEZ: yalnızca kullanıcının etiketten
 * okuduğu değeri kendi tankının hacmine çevirir.
 */
export interface LabelRateInput {
  /** Tankın net su hacmi (L) */
  netLiters: number;
  /** Etiket: "X miktar / Y litre" */
  labelAmount: number;
  labelPerLiters: number;
}

export interface TargetConcInput {
  netLiters: number;
  /** Hedef derişim (mg/L) — etiket veya veteriner talimatından */
  targetMgPerL: number;
  /** Ürünün derişimi (mg/mL) — etiketten */
  stockMgPerMl: number;
}

export interface DoseResult { amount: number; note: string }

const r2 = (n: number) => Math.round(n * 100) / 100;
const pos = (v: number, name: string) => { if (!(Number.isFinite(v) && v > 0)) throw new RangeError(`${name} pozitif bir sayı olmalı`); };

export function scaleLabelRate(i: LabelRateInput): DoseResult {
  pos(i.netLiters, 'Hacim'); pos(i.labelAmount, 'Etiket miktarı'); pos(i.labelPerLiters, 'Etiket hacmi');
  const amount = (i.netLiters / i.labelPerLiters) * i.labelAmount;
  return { amount: r2(amount), note: `${i.labelAmount} birim / ${i.labelPerLiters} L oranı ${i.netLiters} L'ye ölçeklendi (etiket birimiyle aynı birim).` };
}

export function fromTargetConcentration(i: TargetConcInput): DoseResult {
  pos(i.netLiters, 'Hacim'); pos(i.targetMgPerL, 'Hedef derişim'); pos(i.stockMgPerMl, 'Ürün derişimi');
  const ml = (i.targetMgPerL * i.netLiters) / i.stockMgPerMl;
  return { amount: r2(ml), note: `${i.targetMgPerL} mg/L hedef, ${i.stockMgPerMl} mg/mL ürün derişimi: toplam ${r2(ml)} mL.` };
}
