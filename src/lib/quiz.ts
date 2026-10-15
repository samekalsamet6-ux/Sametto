import type { Question, Tier } from '../data/quiz';

export interface TierScore { correct: number; total: number; ratio: number }
export interface QuizResult {
  tiers: Record<Tier, TierScore>;
  recommended: Tier;
  missed: Question[];
  unanswered: number;
}

const THRESHOLD: Record<Exclude<Tier, 'ileri'>, number> = { baslangic: 0.7, orta: 0.6 };

/** answers: soru id -> seçilen seçenek indeksi */
export function gradeQuiz(questions: Question[], answers: Record<string, number | undefined>): QuizResult {
  const tiers: Record<Tier, TierScore> = {
    baslangic: { correct: 0, total: 0, ratio: 0 },
    orta: { correct: 0, total: 0, ratio: 0 },
    ileri: { correct: 0, total: 0, ratio: 0 },
  };
  const missed: Question[] = [];
  let unanswered = 0;
  for (const q of questions) {
    tiers[q.tier].total++;
    const a = answers[q.id];
    if (a === undefined) unanswered++;
    if (a === q.correct) tiers[q.tier].correct++;
    else missed.push(q);
  }
  for (const t of Object.values(tiers)) t.ratio = t.total ? t.correct / t.total : 0;
  const recommended: Tier = tiers.baslangic.ratio < THRESHOLD.baslangic ? 'baslangic' : tiers.orta.ratio < THRESHOLD.orta ? 'orta' : 'ileri';
  return { tiers, recommended, missed, unanswered };
}
