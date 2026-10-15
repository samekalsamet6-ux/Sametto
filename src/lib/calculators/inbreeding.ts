export interface PedRow { id: string; sire?: string; dam?: string }

export function parsePedigree(text: string): PedRow[] {
  const rows: PedRow[] = [];
  const seen = new Set<string>();
  for (const [i, raw] of text.split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const [id, sire, dam] = line.split(/[,;\t]/).map((s) => s.trim());
    if (!id) throw new RangeError(`Satır ${i + 1}: ad boş`);
    if (seen.has(id)) throw new RangeError(`Satır ${i + 1}: yinelenen ad ${id}`);
    seen.add(id);
    rows.push({ id, sire: sire || undefined, dam: dam || undefined });
  }
  return rows;
}

export class Pedigree {
  private byId = new Map<string, PedRow>();
  private depth = new Map<string, number>();
  private memo = new Map<string, number>();

  constructor(rows: PedRow[]) {
    rows.forEach((r) => this.byId.set(r.id, r));
    for (const r of rows) for (const p of [r.sire, r.dam]) if (p && !this.byId.has(p)) this.byId.set(p, { id: p });
    for (const id of this.byId.keys()) this.getDepth(id, new Set());
  }

  private getDepth(id: string, stack: Set<string>): number {
    const known = this.depth.get(id);
    if (known !== undefined) return known;
    if (stack.has(id)) throw new RangeError(`Soy ağacında döngü: ${id}`);
    stack.add(id);
    const r = this.byId.get(id)!;
    const d = Math.max(-1, ...[r.sire, r.dam].filter((x): x is string => !!x).map((p) => this.getDepth(p, stack))) + 1;
    stack.delete(id);
    this.depth.set(id, d);
    return d;
  }

  has(id: string) { return this.byId.has(id); }

  /** Kinship (coancestry) katsayısı φ(a,b). */
  kinship(a?: string, b?: string): number {
    if (!a || !b) return 0;
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    const hit = this.memo.get(key);
    if (hit !== undefined) return hit;
    let v: number;
    if (a === b) {
      const r = this.byId.get(a)!;
      v = 0.5 * (1 + this.kinship(r.sire, r.dam));
    } else {
      const [young, other] = this.depth.get(a)! >= this.depth.get(b)! ? [a, b] : [b, a];
      const r = this.byId.get(young)!;
      v = 0.5 * (this.kinship(r.sire, other) + this.kinship(r.dam, other));
    }
    this.memo.set(key, v);
    return v;
  }

  /** Mevcut bireyin inbreeding katsayısı. */
  f(id: string): number {
    const r = this.byId.get(id);
    if (!r) throw new RangeError(`Bilinmeyen birey: ${id}`);
    return this.kinship(r.sire, r.dam);
  }

  /** Planlanan çiftleşmeden doğacak yavrunun F değeri = ebeveynlerin kinship'i. */
  matingF(sire: string, dam: string): number {
    for (const x of [sire, dam]) if (!this.byId.has(x)) throw new RangeError(`Bilinmeyen birey: ${x}`);
    return this.kinship(sire, dam);
  }
}
