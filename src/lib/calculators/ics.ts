export interface IcsTask {
  title: string;
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  /** WEEKLY için: MO, TU, WE, TH, FR, SA, SU */
  byDay?: string;
  description?: string;
}

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const enc = new TextEncoder();

/** RFC 5545: satırlar en fazla 75 oktet; devam satırları boşlukla başlar. */
export function fold(line: string): string {
  const out: string[] = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    const limit = out.length === 0 ? 75 : 74;
    if (bytes + b > limit) { out.push(cur); cur = ''; bytes = 0; }
    cur += ch; bytes += b;
  }
  out.push(cur);
  return out.join('\r\n ');
}

export function buildIcs(tasks: IcsTask[], startDate: string, now: Date = new Date()): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) throw new RangeError('Başlangıç tarihi YYYY-AA-GG olmalı');
  const d = startDate.replace(/-/g, '');
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Lepistes Rehberi//TR', 'CALSCALE:GREGORIAN'];
  tasks.forEach((t, i) => {
    const rule = `FREQ=${t.freq}` + (t.freq === 'WEEKLY' && t.byDay ? `;BYDAY=${t.byDay}` : '');
    lines.push('BEGIN:VEVENT', `UID:${i}-${d}@lepistes-rehberi`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${d}`, `RRULE:${rule}`, `SUMMARY:${esc(t.title)}`);
    if (t.description) lines.push(`DESCRIPTION:${esc(t.description)}`);
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
