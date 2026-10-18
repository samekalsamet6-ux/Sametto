// Gövde dokusu ayrıntıları (tarayıcıya özgü; birim testi yok): pul pul renk/parlaklık değişimi, pul kenarları, yan çizgi
// gözenekleri, mavi–yeşil yansıma (iridesans), solungaç kapağı, göz çukuru, dudaklar ve sırt-karın renk geçişi.
// Lepistes ve livebearer dokuları aynı yardımcıları kullanır. Koordinatlar: mantıksal 1024x256 yarım doku
// (x = gövde boyu, burun solda; y = 0 karın orta çizgisi … LH sırt; yan çizgi y ≈ LH/2). Çağıran ctx.scale(k,k) uygular.
import { mulberry32 } from './variants';
import { operculumEdgeT } from './model';

type Ctx = CanvasRenderingContext2D;
export const LW = 1024, LH = 256;
export const SCALE_X0 = 0.235;

export function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
export const lumOf = (hex: string): number => {
  const n = parseInt(hex.slice(1), 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
};

export interface DetailOpts {
  /** Yan renk (hex) ve metalik parlaklık 0..1 */
  yan: string; sirt: string; karin: string; metal: number;
  /** Pul ızgarası aralığı */
  sw: number; sh: number;
  seed: number;
  /** Göz çukuru konumu (mantıksal piksel) ve yarıçapı */
  eye?: { x: number; y: number; rx: number; ry: number };
  /** Pul sayısını/ızgarayı gövdenin kuyruk sapına doğru küçült (0..1; varsayılan 0.22) */
  taper?: number;
}

interface Scale { x: number; y: number; rx: number; ry: number; row: number; col: number }

const gridCache = new Map<string, Scale[]>();
export function scaleGrid(o: Pick<DetailOpts, 'sw' | 'sh' | 'seed'>): Scale[] {
  const key = `${o.sw}|${o.sh}|${o.seed}`;
  const hit = gridCache.get(key);
  if (hit) return hit;
  const out: Scale[] = [];
  const { sw, sh } = o;
  const rnd = mulberry32(o.seed + 909);
  for (let row = -1; row < Math.ceil(LH / sh) + 1; row++) {
    for (let col = 0; col * sw < LW - 40; col++) {
      // hafif düzensizlik: pullar kusursuz petek gibi dizilmez
      const x = LW * SCALE_X0 + col * sw + (row % 2 ? sw / 2 : 0) + (rnd() - 0.5) * sw * 0.2;
      if (x > LW * 0.97) continue;
      const y = row * sh + sh * 0.5 + (rnd() - 0.5) * sh * 0.2;
      const k = 0.92 + rnd() * 0.2;
      // solungaç kapağının önünde pul yok (kapak levhası orada)
      const av = (y / LH) * Math.PI;
      if (av > 0.8 && av < 2.5 && x + sw * 0.5 < LW * operculumEdgeT(av)) continue;
      out.push({ x, y, rx: sw * 0.56 * k, ry: sh * 0.62 * k, row, col });
    }
  }
  if (gridCache.size > 12) gridCache.clear();
  gridCache.set(key, out);
  return out;
}

/** Sırt koyu / karın açık gövde renk geçişi, boyuna soluk lekelenme ve ince doku. */
export function paintBase(c: Ctx, o: DetailOpts) {
  const rnd = mulberry32(o.seed + 101);
  // sırt: koyulaşan, belirgin sırt çizgisi
  const dg = c.createLinearGradient(0, LH * 0.55, 0, LH);
  dg.addColorStop(0, hexA(o.sirt, 0));
  dg.addColorStop(0.55, hexA(o.sirt, 0.35));
  dg.addColorStop(1, hexA(o.sirt, 0.8));
  c.fillStyle = dg; c.fillRect(0, LH * 0.55, LW, LH * 0.45);
  // karın: gümüşi açık
  const bg = c.createLinearGradient(0, 0, 0, LH * 0.3);
  bg.addColorStop(0, hexA(o.karin, 0.55)); bg.addColorStop(1, hexA(o.karin, 0));
  c.fillStyle = bg; c.fillRect(0, 0, LW, LH * 0.3);
  // yan: hafif aydınlık bant (yan çizginin hemen üstü)
  const fl = c.createLinearGradient(0, LH * 0.38, 0, LH * 0.78);
  fl.addColorStop(0, 'rgba(255,255,255,0)'); fl.addColorStop(0.5, `rgba(255,255,255,${0.04 + 0.08 * o.metal})`); fl.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = fl; c.fillRect(LW * 0.2, LH * 0.38, LW * 0.8, LH * 0.4);
  // lekelenme: düşük frekanslı açık/koyu yumuşak lekeler
  for (let i = 0; i < 70; i++) {
    const x = LW * (0.05 + rnd() * 0.95), y = rnd() * LH, rx = 30 + rnd() * 90, ry = 14 + rnd() * 34;
    const dark = rnd() < 0.5;
    c.save(); c.translate(x, y); c.scale(rx, ry);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 1);
    const col = dark ? '0,0,0' : '255,255,255', a = 0.025 + rnd() * 0.05;
    g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, Math.PI * 2); c.fill(); c.restore();
  }
}

/** Her pula ayrı parlaklık, ön kenar gölgesi, arka kenar vurgusu ve ince kenar çizgisi. */
export function paintScales(c: Ctx, o: DetailOpts) {
  const rnd = mulberry32(o.seed + 202);
  const light = lumOf(o.yan) > 0.5;
  const edge = light ? 'rgba(18,28,34,' : 'rgba(255,255,255,';
  const edgeA = light ? 0.16 : 0.08;
  const cells = scaleGrid(o);
  // sırtı/karına doğru pullar küçülür (kesitte sıkışma): y'ye göre ölçek
  for (const s of cells) {
    const yy = s.y / LH;
    const edgeFade = Math.min(1, 0.45 + Math.min(yy, 1 - yy) * 3);
    const j = (rnd() - 0.5) * 2;
    // parlaklık oynaması
    c.fillStyle = j > 0 ? hexA(o.karin, j * 0.12) : hexA(o.sirt, -j * 0.17);
    c.beginPath(); c.ellipse(s.x, s.y, s.rx, s.ry, 0, 0, Math.PI * 2); c.fill();
    // arka (açıkta kalan) yarıda yansıma: ışığı yakalayan hilal
    const hg = c.createRadialGradient(s.x + s.rx * 0.15, s.y - s.ry * 0.15, 1, s.x + s.rx * 0.1, s.y, s.rx * 0.95);
    hg.addColorStop(0, `rgba(255,255,255,${(0.06 + 0.16 * o.metal) * edgeFade})`); hg.addColorStop(0.7, 'rgba(255,255,255,0)');
    c.fillStyle = hg; c.beginPath(); c.ellipse(s.x, s.y, s.rx, s.ry, 0, -Math.PI * 0.5, Math.PI * 0.5); c.fill();
    // ön kenar (üstte kalan komşu pulun gölgesi)
    const sg = c.createLinearGradient(s.x - s.rx, 0, s.x - s.rx * 0.25, 0);
    sg.addColorStop(0, 'rgba(0,0,0,0.13)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = sg; c.beginPath(); c.ellipse(s.x, s.y, s.rx, s.ry, 0, Math.PI * 0.5, Math.PI * 1.5); c.fill();
    // arka kenar çizgisi + hemen içinde ince parlak çizgi
    c.strokeStyle = `${edge}${edgeA * (0.7 + rnd() * 0.6)})`; c.lineWidth = 1.2;
    c.beginPath(); c.ellipse(s.x, s.y, s.rx, s.ry, 0, -Math.PI * 0.5, Math.PI * 0.5); c.stroke();
    c.strokeStyle = `rgba(255,255,255,${0.05 + 0.1 * o.metal})`; c.lineWidth = 0.9;
    c.beginPath(); c.ellipse(s.x - 1.4, s.y, s.rx - 1.2, s.ry - 1.2, 0, -Math.PI * 0.42, Math.PI * 0.42); c.stroke();
  }
}

/** Mavi–yeşil iridesans: üst yanda geniş yumuşak bant + pul pul rastgele renk kıvılcımı (metalik varyetede güçlü). */
export function paintSheen(c: Ctx, o: DetailOpts, tints: string[] = ['#46c8ff', '#4fe0b0', '#7a9cff', '#9be86a']) {
  const rnd = mulberry32(o.seed + 303);
  const m = 0.35 + 0.65 * o.metal;
  c.save();
  c.globalCompositeOperation = 'screen';
  const gx = c.createLinearGradient(LW * 0.2, 0, LW, 0);
  gx.addColorStop(0, hexA(tints[0], 0.16 * m)); gx.addColorStop(0.5, hexA(tints[1], 0.2 * m)); gx.addColorStop(1, hexA(tints[0], 0.12 * m));
  const gy = c.createLinearGradient(0, LH * 0.3, 0, LH * 0.95);
  gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(0.35, 'rgba(255,255,255,1)'); gy.addColorStop(0.75, 'rgba(255,255,255,0.55)'); gy.addColorStop(1, 'rgba(0,0,0,0)');
  // yatay geçiş x dikey bant: ayrı katmanda çarp
  const tmp = document.createElement('canvas'); tmp.width = LW; tmp.height = LH;
  const t = tmp.getContext('2d')!;
  t.fillStyle = gx; t.fillRect(0, 0, LW, LH);
  t.globalCompositeOperation = 'destination-in'; t.fillStyle = gy; t.fillRect(0, 0, LW, LH);
  c.drawImage(tmp, 0, 0);
  // pul pul kıvılcım
  for (const s of scaleGrid(o)) {
    const yy = s.y / LH;
    if (s.x < LW * 0.3 || yy < 0.34 || yy > 0.97) continue;
    if (rnd() > 0.55) continue;
    const col = tints[Math.floor(rnd() * tints.length)];
    const k = Math.sin(((yy - 0.34) / 0.63) * Math.PI);
    c.fillStyle = hexA(col, (0.05 + rnd() * 0.14) * m * k);
    c.beginPath(); c.ellipse(s.x + s.rx * 0.15, s.y, s.rx * 0.8, s.ry * 0.85, 0, 0, Math.PI * 2); c.fill();
  }
  c.restore();
}

/** Yan çizgi: pul sırası boyunca küçük koyu gözenekler (çizgi yerine). */
export function paintLateralLine(c: Ctx, o: DetailOpts) {
  c.save();
  const n = 26;
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1);
    const x = LW * (0.3 + 0.66 * f), y = LH * 0.5 + Math.sin(f * Math.PI) * -6 + f * 6;
    c.fillStyle = 'rgba(10,20,30,0.38)';
    c.beginPath(); c.ellipse(x, y, 3.2, 1.9, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.18)';
    c.beginPath(); c.ellipse(x + 0.6, y - 2.6, 3, 0.9, 0, 0, Math.PI * 2); c.fill();
  }
  c.restore();
  void o;
}

/** Göz çukuru gölgesinin doku boyutu (mantıksal piksel): gerçek göz yarıçapına (dünya birimi), gövde boyuna ve yüksekliğine göre. */
export function eyeHalo(r: number, length: number, height: number): { rx: number; ry: number } {
  return { rx: ((1.12 * r) / length) * LW, ry: ((1.12 * r) / (0.33 * height)) * (LH / Math.PI) };
}

/** Baş: solungaç kapağı (parlak levha, ışınsal çizgiler, kenar), göz çukuru gölgesi (ağız ve dudak 3B). */
export function paintHead(c: Ctx, o: DetailOpts) {
  const rnd = mulberry32(o.seed + 404);
  const light = lumOf(o.yan) > 0.5;
  // kapak levhası: parlak, ince kemik çizgileri
  c.save();
  c.save(); c.translate(LW * 0.235, LH * 0.52); c.scale(78, 110);
  const pg = c.createRadialGradient(0, 0, 0, 0, 0, 1);
  pg.addColorStop(0, `rgba(255,255,255,${0.1 + 0.18 * o.metal})`); pg.addColorStop(0.6, `rgba(255,255,255,${0.05 + 0.08 * o.metal})`); pg.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = pg; c.beginPath(); c.arc(0, 0, 1, 0, Math.PI * 2); c.fill(); c.restore();
  c.strokeStyle = 'rgba(255,255,255,0.07)'; c.lineWidth = 1;
  for (let i = 0; i < 14; i++) {
    const v = 0.14 + (i / 13) * 0.25, y = v * 2 * LH; // v = a/2π
    c.beginPath(); c.moveTo(LW * 0.19 + rnd() * 6, y + (rnd() - 0.5) * 6); c.lineTo(LW * (operculumEdgeT(v * Math.PI * 2) - 0.012), y + (rnd() - 0.5) * 10); c.stroke();
  }
  // arka kenar: koyu ince hat + öncesinde parlak kıvrım
  for (const [off, col, w] of [[-0.012, 'rgba(255,255,255,0.18)', 3], [0, light ? 'rgba(10,20,30,0.38)' : 'rgba(0,0,0,0.5)', 2.2], [0.012, 'rgba(0,0,0,0.12)', 5]] as const) {
    c.strokeStyle = col; c.lineWidth = w; c.beginPath();
    for (let i = 0; i <= 24; i++) {
      const a = 0.8 + (1.7 * i) / 24, x = LW * (operculumEdgeT(a) + off), y = (a / (Math.PI * 2)) * 2 * LH;
      if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.stroke();
  }
  c.restore();
  // göz çukuru: gözün çevresinde koyu halka, hafif gölge
  if (o.eye) {
    const e = o.eye;
    c.save(); c.translate(e.x, e.y); c.scale(e.rx, e.ry);
    const g = c.createRadialGradient(0, 0, 0.55, 0, 0, 1.25);
    g.addColorStop(0, 'rgba(10,8,6,0.5)'); g.addColorStop(0.55, 'rgba(10,8,6,0.22)'); g.addColorStop(1, 'rgba(10,8,6,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1.25, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  // alın/burun: hafif koyulaşma (sırt başı) ve çene açık
  const hg = c.createLinearGradient(0, LH * 0.7, 0, LH);
  hg.addColorStop(0, 'rgba(0,0,0,0)'); hg.addColorStop(1, 'rgba(0,0,0,0.22)');
  c.fillStyle = hg; c.fillRect(0, LH * 0.7, LW * 0.18, LH * 0.3);
  // dudaklar ve ağız artık 3B geometridir (head.ts); dokuya ağız çizgisi/dudak boyası çizilmez.
}

/** Kabartma haritası (gri 128 = düz): daha sığ pul kubbesi, ince kenar oluğu ve ince tane. */
export function paintScaleBump(b: Ctx, o: DetailOpts) {
  const rnd = mulberry32(o.seed + 505);
  b.fillStyle = '#808080'; b.fillRect(0, 0, LW, LH);
  for (const s of scaleGrid(o)) {
    const v = 0.9 + rnd() * 0.2;
    const bg = b.createRadialGradient(s.x - s.rx * 0.2, s.y - s.ry * 0.15, 1, s.x, s.y, s.rx * 1.05);
    bg.addColorStop(0, `rgb(${Math.round(150 * v)},${Math.round(150 * v)},${Math.round(150 * v)})`); bg.addColorStop(0.75, '#8c8c8c'); bg.addColorStop(1, '#767676');
    b.fillStyle = bg; b.beginPath(); b.ellipse(s.x, s.y, s.rx, s.ry, 0, 0, Math.PI * 2); b.fill();
    b.strokeStyle = '#626262'; b.lineWidth = 1.2;
    b.beginPath(); b.ellipse(s.x, s.y, s.rx, s.ry, 0, -Math.PI * 0.5, Math.PI * 0.5); b.stroke();
    b.strokeStyle = '#9a9a9a'; b.lineWidth = 0.9;
    b.beginPath(); b.ellipse(s.x - 1.5, s.y, s.rx - 1.6, s.ry - 1.6, 0, -Math.PI * 0.4, Math.PI * 0.4); b.stroke();
  }
  // ince tane
  for (let i = 0; i < 1400; i++) {
    const v = 120 + Math.floor(rnd() * 20);
    b.fillStyle = `rgba(${v},${v},${v},0.5)`; b.fillRect(rnd() * LW, rnd() * LH, 1.6, 1.6);
  }
}
