// 3B sahnenin ne zaman kendiliğinden, ne zaman dokunuşla açılacağına karar verir (saf işlev; tarayıcı bilgisi dışarıdan verilir).
export interface Env3d { wide: boolean; saveData: boolean; reducedData: boolean; remembered: boolean }
/** 'auto': sahne görününce yüklenir (geniş ekran). 'tap': poster + düğme; üç.js ve tür kodu yalnızca dokunuştan sonra yüklenir. */
export function decide3d(e: Env3d): 'auto' | 'tap' {
  if (e.remembered) return 'auto';
  return e.wide && !e.saveData && !e.reducedData ? 'auto' : 'tap';
}
export const DESKTOP_MQ = '(min-width: 900px)';
const KEY = 'sp-3b-acik';
export function readEnv3d(): Env3d {
  let remembered = false;
  try { remembered = sessionStorage.getItem(KEY) === '1'; } catch { /* depolama kapalı */ }
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return { wide: matchMedia(DESKTOP_MQ).matches, saveData: conn?.saveData === true, reducedData: matchMedia('(prefers-reduced-data: reduce)').matches, remembered };
}
export function remember3d(): void { try { sessionStorage.setItem(KEY, '1'); } catch { /* yoksay */ } }
