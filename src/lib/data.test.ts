import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { causes, symptoms } from '../data/belirtiler';
import { questions } from '../data/quiz';
import { rankCauses, triage } from './diagnosis';
import { gradeQuiz } from './quiz';

const wikiExists = (s: string) => existsSync(`src/content/wiki/${s}.mdx`);

describe('veri bütünlüğü', () => {
  it('nedenlerdeki belirti kimlikleri ve wiki bağlantıları geçerli', () => {
    const ids = new Set(symptoms.map((s) => s.id));
    for (const c of causes) {
      for (const k of Object.keys(c.weights)) expect(ids.has(k), `${c.id}: ${k}`).toBe(true);
      if (c.wiki) expect(wikiExists(c.wiki), `${c.id}: wiki ${c.wiki}`).toBe(true);
      expect(c.firstSteps.length).toBeGreaterThan(0);
    }
  });
  it('her belirti en az bir nedene bağlı', () => {
    for (const s of symptoms) expect(causes.some((c) => c.weights[s.id]), s.id).toBe(true);
  });
  it('quiz soruları geçerli', () => {
    const seen = new Set<string>();
    for (const q of questions) {
      expect(seen.has(q.id)).toBe(false); seen.add(q.id);
      expect(q.correct).toBeGreaterThanOrEqual(0);
      expect(q.correct).toBeLessThan(q.options.length);
      if (q.wiki) expect(wikiExists(q.wiki), q.id).toBe(true);
    }
    expect(['baslangic', 'orta', 'ileri'].every((t) => questions.filter((q) => q.tier === t).length === 6)).toBe(true);
  });
});

describe('rankCauses', () => {
  it('beyaz noktalar -> beyaz benek ilk ve güçlü', () => {
    const r = rankCauses(['beyaz-noktalar'], causes);
    expect(r[0].cause.id).toBe('beyaz-benek');
    expect(r[0].strength).toBe('guclu');
  });
  it('boş seçim boş sonuç', () => { expect(rankCauses([], causes)).toEqual([]); });
  it('yinelenen belirti sayıyı bozmaz', () => {
    expect(rankCauses(['yara', 'yara'], causes)[0].ratio).toBe(1);
  });
  it('yüzeyde nefes + toplu ölüm -> azot ilk sırada', () => {
    expect(rankCauses(['yuzeyde-nefes', 'ani-toplu-olum'], causes)[0].cause.id).toBe('azot');
  });
  it('sonuçlar azalan sırada', () => {
    const r = rankCauses(['yuzgec-kapali', 'sallanma', 'yem-yemiyor'], causes);
    for (let i = 1; i < r.length; i++) expect(r[i - 1].score).toBeGreaterThanOrEqual(r[i].score);
  });
});

describe('triage', () => {
  it('acil belirtiler', () => {
    expect(triage(['ani-toplu-olum']).urgent).toBe(true);
    expect(triage(['yavrular-kucuk']).urgent).toBe(false);
  });
});

describe('gradeQuiz', () => {
  const all = Object.fromEntries(questions.map((q) => [q.id, q.correct]));
  it('hepsi doğru -> ileri', () => {
    const r = gradeQuiz(questions, all);
    expect(r.recommended).toBe('ileri');
    expect(r.missed).toHaveLength(0);
  });
  it('boş -> başlangıç', () => {
    const r = gradeQuiz(questions, {});
    expect(r.recommended).toBe('baslangic');
    expect(r.unanswered).toBe(questions.length);
  });
  it('başlangıç tam, orta zayıf -> orta', () => {
    const a = { ...all };
    for (const q of questions.filter((q) => q.tier === 'orta')) a[q.id] = (q.correct + 1) % q.options.length;
    expect(gradeQuiz(questions, a).recommended).toBe('orta');
  });
  it('başlangıç eşiği 0,7: 4/6 yetmez, 5/6 yeter', () => {
    const base = { ...all };
    const b = questions.filter((q) => q.tier === 'baslangic');
    for (const q of b.slice(0, 2)) base[q.id] = (q.correct + 1) % q.options.length;
    expect(gradeQuiz(questions, base).recommended).toBe('baslangic');
    base[b[0].id] = b[0].correct;
    expect(gradeQuiz(questions, base).recommended).not.toBe('baslangic');
  });
});
