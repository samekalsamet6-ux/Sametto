export interface FeedGroup { name: string; count: number; mealsPerDay: number }
export interface FeedPlanRow { name: string; count: number; times: string[] }

const pad = (n: number) => String(n).padStart(2, '0');

export function feedingTimes(meals: number, startHour = 8, endHour = 20): string[] {
  if (!Number.isInteger(meals) || meals < 1) throw new RangeError('Öğün sayısı 1 veya daha fazla olmalı');
  if (!(endHour > startHour) && meals > 1) throw new RangeError('Bitiş saati başlangıçtan sonra olmalı');
  if (meals === 1) return [`${pad(startHour)}:00`];
  const total = (endHour - startHour) * 60;
  return Array.from({ length: meals }, (_, k) => {
    const mins = startHour * 60 + Math.round((total * k) / (meals - 1) / 5) * 5;
    return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
  });
}

export function planFeeding(groups: FeedGroup[], startHour = 8, endHour = 20): FeedPlanRow[] {
  return groups.filter((g) => g.count > 0).map((g) => ({ name: g.name, count: g.count, times: feedingTimes(g.mealsPerDay, startHour, endHour) }));
}
