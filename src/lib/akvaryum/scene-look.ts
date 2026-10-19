// Tüm 3B akvaryum görüntüleyicileri için ortak "görünüm": ışık düzeni, ortam yansıması, ton eşleme ve kadraj hesabı.
// Amaç: 12 türün hepsi aynı dünyadan gelsin (aynı anahtar/dolgu/kenar ışığı, aynı su rengi) ve model her görünümde
// kadrajı ~%75 doldursun. Işıklar kameraya göre yerleşir: hangi yönden bakılırsa bakılsın (alt/arka dahil) aynı aydınlatma.
import {
  ACESFilmicToneMapping, AmbientLight, BackSide, BoxGeometry, BufferGeometry, Color, DirectionalLight, Float32BufferAttribute,
  HemisphereLight, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera, PMREMGenerator,
  Scene, SphereGeometry, SRGBColorSpace, Vector3, type Texture, type WebGLRenderer,
} from 'three';

/** Sahne arka planı (CSS): sayfalardaki .v3-stage ile aynı su gradyanı. */
export const WATER_GRADIENT = 'radial-gradient(120% 90% at 50% 18%,#2a8499 0%,#145067 42%,#06232f 100%)';

// ------------------------------------------------------------------ ortam (yansıma) haritası

/** Küçük bir "akvaryum stüdyosu": su renginde gradyan küre + 3 yumuşak ışık kutusu. PMREM ile prefilter edilir. */
function studioScene(): Scene {
  const s = new Scene();
  const g = new SphereGeometry(40, 32, 20);
  const pos = g.getAttribute('position');
  const col: number[] = [];
  const top = new Color(0x8fd0e0).multiplyScalar(0.9), mid = new Color(0x2f7486).multiplyScalar(0.5), bot = new Color(0x0c2a33).multiplyScalar(0.22);
  const c = new Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 40;
    if (y >= 0) c.copy(mid).lerp(top, Math.pow(y, 0.8)); else c.copy(mid).lerp(bot, Math.min(1, -y * 1.4));
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new Float32BufferAttribute(col, 3));
  s.add(new Mesh(g, new MeshBasicMaterial({ vertexColors: true, side: BackSide })));
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, color: number, k: number) => {
    const m = new Mesh(new BoxGeometry(w, h, d), new MeshBasicMaterial({ color: new Color(color).multiplyScalar(k) }));
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    s.add(m);
  };
  box(16, 9, 0.4, 14, 22, 18, 0xfff3e0, 9);   // anahtar ışık kutusu (üst, sağ-ön)
  box(3, 22, 0.4, -26, 4, 8, 0xdff3ff, 5);    // dikey şerit (sol)
  box(22, 3, 0.4, -4, 6, -28, 0x9fd8ff, 6);   // arka kenar şeridi
  box(14, 4, 0.4, 0, -24, 14, 0xffd9b0, 2.2); // alt sıcak dolgu (zemin yansıması)
  return s;
}

// ------------------------------------------------------------------ ışık düzeni

export interface Look {
  /** Işıkları kameranın yönüne göre yeniden yerleştirir; her karede çizimden önce çağrılır. */
  sync(camera: PerspectiveCamera, target: Vector3): void;
  dispose(): void;
}

interface RigLight { light: DirectionalLight; /** kamera uzayında yön: x sağ, y yukarı, z kameraya doğru */ dir: [number, number, number] }

/**
 * Ton eşleme + ortam haritası + ışık düzeni. Renderer'ı da ayarlar (ACES, sRGB).
 * Anahtar ışık sıcak-beyaz (üst-sağ-ön), dolgu serin (sol-alt), kenar ışığı turkuaz (arkadan); alttan sıcak yansıma ortam haritasında.
 */
export function applyLook(renderer: WebGLRenderer, scene: Scene): Look {
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = SRGBColorSpace;

  const pmrem = new PMREMGenerator(renderer);
  const env: Texture = pmrem.fromScene(studioScene(), 0.03).texture;
  scene.environment = env;
  scene.environmentIntensity = 0.6;

  const hemi = new HemisphereLight(0xcfeaf5, 0x1d3a46, 0.55);
  const amb = new AmbientLight(0xffffff, 0.12);
  scene.add(hemi, amb);

  const mk = (color: number, intensity: number, dir: [number, number, number]): RigLight => {
    const light = new DirectionalLight(color, intensity);
    scene.add(light, light.target);
    return { light, dir };
  };
  const rig: RigLight[] = [
    mk(0xfff2e2, 1.7, [0.55, 0.85, 0.75]),   // anahtar
    mk(0xb8dcf5, 0.55, [-0.9, -0.15, 0.55]),  // dolgu
    mk(0x8fd6ff, 1.15, [-0.35, 0.45, -1]),    // kenar (arkadan)
  ];

  const right = new Vector3(), up = new Vector3(), fwd = new Vector3(), v = new Vector3();
  return {
    sync(camera, target) {
      camera.updateMatrixWorld();
      right.setFromMatrixColumn(camera.matrixWorld, 0);
      up.setFromMatrixColumn(camera.matrixWorld, 1);
      fwd.setFromMatrixColumn(camera.matrixWorld, 2); // kameraya doğru
      for (const { light, dir } of rig) {
        v.set(0, 0, 0).addScaledVector(right, dir[0]).addScaledVector(up, dir[1]).addScaledVector(fwd, dir[2]).normalize().multiplyScalar(6);
        light.position.copy(target).add(v);
        light.target.position.copy(target);
        light.target.updateMatrixWorld();
      }
    },
    dispose() {
      env.dispose();
      pmrem.dispose();
      for (const { light } of rig) { scene.remove(light, light.target); light.dispose(); }
      scene.remove(hemi, amb);
    },
  };
}

// ------------------------------------------------------------------ kadraj (fit)

/**
 * Modelin gerçek köşe noktalarından, verilen bakış açısında kadrajın `fill` oranını dolduracak kamera uzaklığını hesaplar
 * (sınır küresi yerine izdüşüm kullanıldığı için uzun, ince balıklar da kadrajı doldurur) ve izdüşümün merkezini lens
 * kaydırmasıyla (setViewOffset) kadraja ortalar; dönme merkezi (OrbitControls hedefi) değişmez.
 */
export interface Fitter {
  /** Model değişince noktaları yeniden topla. `center` kamera hedefi. */
  measure(root: Object3D, center: Vector3): void;
  /** (th, ph): küresel kamera açıları. */
  distance(camera: PerspectiveCamera, th: number, ph: number): number;
  /** Yakınlaştırma sınırları: [en küçük, en büyük] uzaklık. */
  range(camera: PerspectiveCamera): [number, number];
  /** Her karede çizimden önce: izdüşümü kadraja ortalar (yakınlaşıldıkça etkisi azalır). */
  center(camera: PerspectiveCamera, target: Vector3): void;
}

export const FIT_FILL = 0.78;

export function createFitter(fill = FIT_FILL): Fitter {
  let pts: Float32Array = new Float32Array(0);
  let radius = 1;
  const dir = new Vector3(), right = new Vector3(), upv = new Vector3(), q = new Vector3();
  const UP = new Vector3(0, 1, 0);

  const collect = (root: Object3D, center: Vector3) => {
    root.updateMatrixWorld(true);
    const out: number[] = [];
    const m = new Matrix4(), im = new Matrix4(), p = new Vector3();
    root.traverse((o) => {
      const mesh = o as Mesh;
      const geo = mesh.geometry as BufferGeometry | undefined;
      if (!o.visible || !geo || !geo.getAttribute?.('position')) return;
      const pa = geo.getAttribute('position');
      const n = pa.count;
      if ((o as InstancedMesh).isInstancedMesh) {
        const inst = o as InstancedMesh;
        geo.computeBoundingBox();
        const bb = geo.boundingBox!;
        for (let k = 0; k < inst.count; k++) {
          inst.getMatrixAt(k, im);
          m.multiplyMatrices(o.matrixWorld, im);
          for (let c = 0; c < 8; c++) {
            p.set(c & 1 ? bb.max.x : bb.min.x, c & 2 ? bb.max.y : bb.min.y, c & 4 ? bb.max.z : bb.min.z).applyMatrix4(m);
            out.push(p.x - center.x, p.y - center.y, p.z - center.z);
          }
        }
        return;
      }
      const step = Math.max(1, Math.floor(n / 900));
      for (let i = 0; i < n; i += step) {
        p.fromBufferAttribute(pa, i).applyMatrix4(o.matrixWorld);
        out.push(p.x - center.x, p.y - center.y, p.z - center.z);
      }
    });
    return Float32Array.from(out);
  };

  const basis = (th: number, ph: number) => {
    const sp = Math.sin(ph);
    dir.set(sp * Math.sin(th), Math.cos(ph), sp * Math.cos(th)); // hedeften kameraya
    right.crossVectors(UP, dir);
    if (right.lengthSq() < 1e-8) right.set(1, 0, 0);
    right.normalize();
    upv.crossVectors(dir, right).normalize();
  };

  /** Uzaklık d iken izdüşümün NDC sınırları (basis() önceden çağrılmış olmalı). Nokta kameranın arkasındaysa null. */
  const ext = (tanH: number, tanV: number, d: number) => {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i < pts.length; i += 3) {
      q.set(pts[i], pts[i + 1], pts[i + 2]);
      const w = d - q.dot(dir);
      if (w <= 0.01) return null;
      const x = q.dot(right) / (w * tanH), y = q.dot(upv) / (w * tanV);
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    return { x0, x1, y0, y1 };
  };
  const span = (e: { x0: number; x1: number; y0: number; y1: number }) => Math.max(e.x1 - e.x0, e.y1 - e.y0) / 2;

  const dist = (camera: PerspectiveCamera, th: number, ph: number): number => {
    const tanV = Math.tan((camera.fov * Math.PI) / 360), tanH = tanV * camera.aspect;
    if (!pts.length) return (radius * 1.1) / Math.min(tanV, tanH);
    basis(th, ph);
    let lo = radius * 0.5, hi = (radius * 6) / Math.min(tanV, tanH);
    for (let it = 0; it < 22; it++) {
      const mid = (lo + hi) / 2;
      const e = ext(tanH, tanV, mid);
      if (!e || span(e) > fill) lo = mid; else hi = mid;
    }
    return hi;
  };

  let lastKey = '';
  return {
    measure(root, center) {
      pts = collect(root, center);
      radius = 0;
      for (let i = 0; i < pts.length; i += 3) radius = Math.max(radius, Math.hypot(pts[i], pts[i + 1], pts[i + 2]));
      radius = radius || 1;
      lastKey = '';
    },
    distance: dist,
    range(camera) {
      let lo = Infinity, hi = 0;
      for (const [th, ph] of Object.values(STANDARD_VIEW_ANGLES)) {
        const d = dist(camera, th, ph);
        lo = Math.min(lo, d); hi = Math.max(hi, d);
      }
      return [lo * 0.3, hi * 2.1];
    },
    center(camera, target) {
      if (!pts.length) return;
      const o = camera.position.clone().sub(target);
      const r = o.length();
      const th = Math.atan2(o.x, o.z), ph = Math.acos(Math.min(1, Math.max(-1, o.y / r)));
      const key = `${r.toFixed(4)},${th.toFixed(4)},${ph.toFixed(4)},${camera.aspect.toFixed(3)}`;
      if (key === lastKey) return;
      lastKey = key;
      const tanV = Math.tan((camera.fov * Math.PI) / 360), tanH = tanV * camera.aspect;
      basis(th, ph);
      const e = ext(tanH, tanV, r);
      if (!e) { camera.clearViewOffset(); return; }
      // yakınlaştıkça (izdüşüm kadrajı aştıkça) ortalama etkisi sönsün
      const sp = span(e), k = Math.min(1, Math.max(0, (1.7 * fill - sp) / (0.7 * fill)));
      const cx = ((e.x0 + e.x1) / 2) * k, cy = ((e.y0 + e.y1) / 2) * k;
      const H = 1000, W = Math.round(H * camera.aspect);
      if (Math.abs(cx) < 1e-4 && Math.abs(cy) < 1e-4) camera.clearViewOffset();
      else camera.setViewOffset(W, H, (cx * W) / 2, (-cy * H) / 2, W, H);
    },
  };
}

/** Kadraj aralığı için kullanılan standart bakış açıları (yan, üst, ön, arka, alt, çapraz). */
const STANDARD_VIEW_ANGLES: Record<string, [number, number]> = {
  yan: [0, Math.PI / 2], ust: [0, 0.03], on: [-Math.PI / 2, Math.PI / 2], arka: [Math.PI / 2, Math.PI / 2], alt: [0, Math.PI - 0.03], capraz: [0.62, 1.28],
};
