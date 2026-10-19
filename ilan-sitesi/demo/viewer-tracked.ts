// Demo: gerçek client/viewer3d.ts'i olduğu gibi kullanır; yalnızca her mountViewer çağrısını kaydeder ki
// sayfa değişince WebGL bağlamları serbest bırakılabilsin (gerçek sitede sayfa kapanınca tarayıcı yapar).
import { mountViewer as realMount, type Mount } from '../client/viewer3d.ts';
export * from '../client/viewer3d.ts';
const live = new Set<Mount>();
export function mountViewer(...a: Parameters<typeof realMount>): Mount {
  const m = realMount(...a);
  live.add(m);
  return m;
}
export function disposeAllViewers(): void {
  for (const m of live) { try { m.dispose(); } catch { /* yoksay */ } }
  live.clear();
}
