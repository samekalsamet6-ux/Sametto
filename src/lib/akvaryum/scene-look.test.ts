import { describe, expect, it } from 'vitest';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, Vector3 } from 'three';
import { createFitter, FIT_FILL } from './scene-look';
import { standardViews, STANDARD_VIEWS } from './view-standard';

describe('standart görünüm düğmeleri', () => {
  it('her türde Yan, Üst, Ön, Arka, Alt, Çapraz bulunur ve etiketler tek biçimlidir', () => {
    const v = standardViews([{ id: 'alt', ad: 'Alt (ağız)' }, { id: 'yan', ad: 'Yan' }, { id: 'capraz', ad: 'Çapraz' }]);
    expect(v.map((x) => x.id)).toEqual(['yan', 'ust', 'on', 'arka', 'alt', 'capraz']);
    expect(v.map((x) => x.ad)).toEqual(['Yan', 'Üst', 'Ön', 'Arka', 'Alt', 'Çapraz']);
    expect(standardViews()).toEqual(STANDARD_VIEWS);
  });
  it('standart dışı görünümler korunur', () => {
    expect(standardViews([{ id: 'agiz', ad: 'Ağız' }]).at(-1)).toEqual({ id: 'agiz', ad: 'Ağız' });
  });
});

describe('kadraj (fitter)', () => {
  const g = new Group();
  g.add(new Mesh(new BoxGeometry(4, 1, 0.5), new MeshBasicMaterial()));
  const cam = new PerspectiveCamera(30, 1.6, 0.1, 100);
  const fit = createFitter();
  fit.measure(g, new Vector3());

  const project = (th: number, ph: number, d: number) => {
    const sp = Math.sin(ph);
    cam.position.set(d * sp * Math.sin(th), d * Math.cos(ph), d * sp * Math.cos(th));
    cam.lookAt(0, 0, 0);
    cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const sx of [-2, 2]) for (const sy of [-0.5, 0.5]) for (const sz of [-0.25, 0.25]) {
      const p = new Vector3(sx, sy, sz).project(cam);
      x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y);
    }
    return Math.max(x1 - x0, y1 - y0) / 2;
  };

  it('her görünümde sınırlayıcı eksen kadrajın ~%78’ini doldurur, taşmaz', () => {
    for (const [th, ph] of [[0, Math.PI / 2], [0, 0.03], [-Math.PI / 2, Math.PI / 2], [0.62, 1.28]] as const) {
      const d = fit.distance(cam, th, ph);
      const s = project(th, ph, d);
      expect(s).toBeLessThanOrEqual(FIT_FILL + 0.03);
      expect(s).toBeGreaterThan(0.45);
    }
  });
  it('zoom aralığı mantıklıdır', () => {
    const [lo, hi] = fit.range(cam);
    expect(lo).toBeGreaterThan(0);
    expect(hi).toBeGreaterThan(lo * 3);
  });
});
