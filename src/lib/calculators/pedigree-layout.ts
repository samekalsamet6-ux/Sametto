import { Pedigree, type PedRow } from './inbreeding';

export interface Node { id: string; generation: number; x: number; y: number; f: number | null; known: boolean }
export interface Edge { from: string; to: string; role: 'baba' | 'anne' }
export interface Layout { nodes: Node[]; edges: Edge[]; width: number; height: number }

export interface LayoutOptions { colWidth?: number; rowHeight?: number; margin?: number }

/**
 * Soy ağacını nesillere ayırır: kuşak = en uzun ata zincirinin uzunluğu.
 * Atalar yukarıda, torunlar aşağıda. Aynı kuşaktaki bireyler soldan sağa dizilir.
 */
export function layoutPedigree(rows: PedRow[], opts: LayoutOptions = {}): Layout {
  const { colWidth = 110, rowHeight = 90, margin = 40 } = opts;
  const ped = new Pedigree(rows); // döngü ve geçersiz girdi burada hata verir
  const byId = new Map<string, PedRow>();
  for (const r of rows) byId.set(r.id, r);
  for (const r of rows) for (const p of [r.sire, r.dam]) if (p && !byId.has(p)) byId.set(p, { id: p });

  const gen = new Map<string, number>();
  const depth = (id: string): number => {
    const hit = gen.get(id);
    if (hit !== undefined) return hit;
    const r = byId.get(id)!;
    const ps = [r.sire, r.dam].filter((x): x is string => !!x);
    const g = ps.length ? Math.max(...ps.map(depth)) + 1 : 0;
    gen.set(id, g);
    return g;
  };
  for (const id of byId.keys()) depth(id);

  const levels = new Map<number, string[]>();
  for (const id of byId.keys()) {
    const g = gen.get(id)!;
    levels.set(g, [...(levels.get(g) ?? []), id]);
  }
  const maxGen = Math.max(...levels.keys());
  const maxCols = Math.max(...[...levels.values()].map((l) => l.length));
  const width = margin * 2 + Math.max(1, maxCols - 1) * colWidth;
  const height = margin * 2 + maxGen * rowHeight;

  const declared = new Set(rows.map((r) => r.id));
  const nodes: Node[] = [];
  for (const [g, ids] of [...levels.entries()].sort((a, b) => a[0] - b[0])) {
    const total = (ids.length - 1) * colWidth;
    ids.forEach((id, k) => {
      nodes.push({ id, generation: g, x: margin + (width - 2 * margin - total) / 2 + k * colWidth, y: margin + g * rowHeight, f: declared.has(id) ? ped.f(id) : null, known: declared.has(id) });
    });
  }
  const edges: Edge[] = [];
  for (const r of byId.values()) {
    if (r.sire) edges.push({ from: r.sire, to: r.id, role: 'baba' });
    if (r.dam) edges.push({ from: r.dam, to: r.id, role: 'anne' });
  }
  return { nodes, edges, width, height };
}
