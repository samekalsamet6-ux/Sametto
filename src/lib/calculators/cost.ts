export interface CostInput {
  /** Elektrik: cihaz gücü toplamı (W), günde çalışma saati, kWh fiyatı */
  watts: number;
  hoursPerDay: number;
  pricePerKwh: number;
  /** Aylık sabit giderler */
  feedPerMonth: number;
  waterTreatmentPerMonth: number;
  medicinePerMonth: number;
  otherPerMonth: number;
  /** Ekipman: toplam bedel ve beklenen kullanım ömrü (ay) */
  equipmentCost: number;
  equipmentLifeMonths: number;
  /** Satış */
  fishSoldPerMonth: number;
  pricePerFish: number;
}

export interface CostResult {
  electricityPerMonth: number;
  equipmentPerMonth: number;
  totalPerMonth: number;
  costPerFish: number | null;
  revenuePerMonth: number;
  profitPerMonth: number;
  breakEvenFishPerMonth: number | null;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function costModel(i: CostInput): CostResult {
  const nonNeg = [i.watts, i.hoursPerDay, i.pricePerKwh, i.feedPerMonth, i.waterTreatmentPerMonth, i.medicinePerMonth, i.otherPerMonth, i.equipmentCost, i.fishSoldPerMonth, i.pricePerFish];
  if (!nonNeg.every((v) => Number.isFinite(v) && v >= 0)) throw new RangeError('Değerler sıfır veya pozitif sayı olmalı');
  if (!(i.equipmentLifeMonths > 0)) throw new RangeError('Ekipman ömrü pozitif olmalı');
  if (i.hoursPerDay > 24) throw new RangeError('Günlük saat en fazla 24 olabilir');

  const electricityPerMonth = (i.watts / 1000) * i.hoursPerDay * 30 * i.pricePerKwh;
  const equipmentPerMonth = i.equipmentCost / i.equipmentLifeMonths;
  const totalPerMonth = electricityPerMonth + equipmentPerMonth + i.feedPerMonth + i.waterTreatmentPerMonth + i.medicinePerMonth + i.otherPerMonth;
  const revenue = i.fishSoldPerMonth * i.pricePerFish;
  return {
    electricityPerMonth: r2(electricityPerMonth),
    equipmentPerMonth: r2(equipmentPerMonth),
    totalPerMonth: r2(totalPerMonth),
    costPerFish: i.fishSoldPerMonth > 0 ? r2(totalPerMonth / i.fishSoldPerMonth) : null,
    revenuePerMonth: r2(revenue),
    profitPerMonth: r2(revenue - totalPerMonth),
    breakEvenFishPerMonth: i.pricePerFish > 0 ? Math.ceil(totalPerMonth / i.pricePerFish) : null,
  };
}
