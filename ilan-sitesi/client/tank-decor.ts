// Akvaryum dekoru: dalgalı kum, kayalar, kütük, bitkiler, ışık hüzmeleri ve süzülen parçacıklar.
// Çizim yükü küçüktür: kayalar ve bitkiler InstancedMesh (her biri tek çizim çağrısı), parçacıklar tek Points.
import {
  AdditiveBlending, BoxGeometry, BufferAttribute, BufferGeometry, CanvasTexture, CatmullRomCurve3, Color, DoubleSide, Float32BufferAttribute, IcosahedronGeometry, InstancedMesh,
  Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, PlaneGeometry, Points, PointsMaterial, RepeatWrapping, SRGBColorSpace, TubeGeometry, Vector3, type Scene,
} from 'three';
import type { TankDims } from './tank-motion.ts';

export interface Decor { update(time: number, dt: number): void; objects: Object3D[]; sandTop: number }

function rng(seed: number) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, srgb = true): CanvasTexture => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!);
  const t = new CanvasTexture(c); if (srgb) t.colorSpace = SRGBColorSpace; return t;
};

function sandTexture(): CanvasTexture {
  const t = canvasTex(128, 128, (g) => {
    g.fillStyle = '#c9b48a'; g.fillRect(0, 0, 128, 128);
    const rnd = rng(12345);
    for (let i = 0; i < 900; i++) { const l = 55 + rnd() * 30; g.fillStyle = `hsl(36 ${25 + rnd() * 15}% ${l}%)`; g.fillRect(rnd() * 128, rnd() * 128, 1 + rnd() * 2, 1 + rnd() * 2); }
  });
  t.wrapS = t.wrapT = RepeatWrapping; return t;
}

/** Kıvrık, uca doğru incelen bıçak (şerit): yerel y = yükseklik (0..1), sallanma tepe noktada büyür. */
function bladeGeometry(width: number, bend: number, segs = 5): BufferGeometry {
  const pos: number[] = [], col: number[] = [], idx: number[] = [];
  const base = new Color('#1f5f3a'), tip = new Color('#7fc27a'), c = new Color();
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, w = width * (1 - t * 0.85) * 0.5, x = bend * t * t, y = t;
    pos.push(x - w, y, 0, x + w, y, 0);
    c.copy(base).lerp(tip, t); col.push(c.r, c.g, c.b, c.r, c.g, c.b);
    if (i < segs) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3)); g.setAttribute('color', new Float32BufferAttribute(col, 3)); g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function createDecor(scene: Scene, d: TankDims, own: <T extends { dispose(): void }>(x: T) => T): Decor {
  const r = rng(777);
  const objects: Object3D[] = [];
  const add = <T extends Object3D>(o: T): T => { scene.add(o); objects.push(o); return o; };
  const floor = -d.H / 2 + d.sand;                     // kum yüzeyinin ortalama yüksekliği
  const amp = 0.03;
  const hAt = (x: number, z: number) => {
    const edge = Math.min(1, (d.W / 2 - Math.abs(x)) / 0.5, (d.D / 2 - Math.abs(z)) / 0.5);
    return amp * edge * (Math.sin(x * 1.1 + 0.7) * Math.cos(z * 1.7) * 0.6 + Math.sin(x * 2.9 + z * 2.3) * 0.4);
  };

  // kum: alt blok + dalgalı yüzey
  const sandTex = own(sandTexture()); sandTex.repeat.set(d.W / 1.6, d.D / 1.6);
  const sandMat = own(new MeshStandardMaterial({ map: sandTex, roughness: 1, metalness: 0 }));
  const body = new Mesh(own(new BoxGeometry(d.W, d.sand - amp * 1.4, d.D)), sandMat);
  body.position.y = -d.H / 2 + (d.sand - amp * 1.4) / 2; add(body);
  const sg = own(new PlaneGeometry(d.W, d.D, 64, 32)); sg.rotateX(-Math.PI / 2);
  const sp = sg.getAttribute('position') as BufferAttribute;
  for (let i = 0; i < sp.count; i++) sp.setY(i, hAt(sp.getX(i), sp.getZ(i)));
  sg.computeVertexNormals();
  const surf = new Mesh(sg, sandMat); surf.position.y = floor; add(surf);

  // kayalar
  const rockGeo = own(new IcosahedronGeometry(1, 2));
  const rp = rockGeo.getAttribute('position') as BufferAttribute;
  for (let i = 0; i < rp.count; i++) { const v = new Vector3(rp.getX(i), rp.getY(i), rp.getZ(i)); const n = 1 + 0.16 * Math.sin(v.x * 3.1 + v.y * 2.3) * Math.cos(v.z * 2.7 + 0.5); v.multiplyScalar(n); rp.setXYZ(i, v.x, v.y, v.z); }
  rockGeo.computeVertexNormals();
  const rocks = new InstancedMesh(rockGeo, own(new MeshStandardMaterial({ roughness: 0.95, metalness: 0, flatShading: true })), 5);
  const rockSpots: [number, number, number][] = [[-0.36, 0.88, 0.8], [-0.27, 0.8, 0.55], [0.34, 0.92, 0.7], [0.42, 0.8, 0.45], [0.05, 0.93, 0.4]];
  const o3 = new Object3D(), colr = new Color();
  rockSpots.forEach(([fx, fz, s], i) => {
    const x = fx * d.W, z = -d.D / 2 + (1 - fz) * d.D * 0.5 + 0.35;
    const sx = s * (0.55 + 0.2 * r()), sy = s * (0.3 + 0.12 * r()), sz = s * (0.4 + 0.15 * r());
    o3.position.set(x, floor + sy * 0.45 + hAt(x, z), z); o3.rotation.set(0, r() * 6.28, 0); o3.scale.set(sx, sy, sz); o3.updateMatrix();
    rocks.setMatrixAt(i, o3.matrix); rocks.setColorAt(i, colr.setHSL(0.08 + r() * 0.04, 0.08 + r() * 0.08, 0.3 + r() * 0.12));
  });
  rocks.instanceMatrix.needsUpdate = true; if (rocks.instanceColor) rocks.instanceColor.needsUpdate = true;
  add(rocks);

  // kütük: iki kıvrık dal
  const wood = own(new MeshStandardMaterial({ color: 0x5b4330, roughness: 1, metalness: 0 }));
  const branch = (pts: [number, number, number][], rad: number) => {
    const g = own(new TubeGeometry(new CatmullRomCurve3(pts.map(([x, y, z]) => new Vector3(x, y, z))), 28, rad, 8, false));
    add(new Mesh(g, wood));
  };
  const wx = -d.W * 0.12, wz = -d.D / 2 + 0.95;
  branch([[wx - 1.1, floor + 0.08, wz + 0.1], [wx - 0.5, floor + 0.22, wz - 0.05], [wx + 0.2, floor + 0.55, wz], [wx + 0.75, floor + 0.62, wz + 0.1], [wx + 1.15, floor + 0.3, wz + 0.05]], 0.1);
  branch([[wx + 0.2, floor + 0.5, wz], [wx + 0.45, floor + 0.95, wz - 0.1], [wx + 0.62, floor + 1.3, wz - 0.12]], 0.06);

  // bitkiler: kümeler halinde bıçaklar (ince çim) ve geniş yapraklar; sallanma köşe gölgelendiricisinde
  const uTime = { value: 0 };
  const sway = (m: MeshStandardMaterial, k: number) => {
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = uTime;
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>',
        `vec3 transformed = vec3(position);
         float ph = instanceMatrix[3].x * 1.7 + instanceMatrix[3].z * 1.3;
         transformed.x += sin(uTime * 0.9 + ph + position.y * 1.6) * ${k.toFixed(2)} * position.y * position.y;
         transformed.z += cos(uTime * 0.7 + ph * 1.3 + position.y * 1.2) * ${(k * 0.6).toFixed(2)} * position.y * position.y;`);
    };
  };
  const mkPlants = (geo: BufferGeometry, n: number, k: number, hMin: number, hMax: number, tintLo: number, tintHi: number, spots: (i: number) => [number, number]) => {
    const mat = own(new MeshStandardMaterial({ vertexColors: true, side: DoubleSide, roughness: 0.85, metalness: 0 })); sway(mat, k);
    const im = new InstancedMesh(own(geo), mat, n);
    for (let i = 0; i < n; i++) {
      const [x, z] = spots(i);
      o3.position.set(x, floor + hAt(x, z) - 0.02, z); o3.rotation.set((r() - 0.5) * 0.25, r() * 6.28, (r() - 0.5) * 0.25);
      const h = hMin + (hMax - hMin) * r(); o3.scale.set(1, h, 1); o3.updateMatrix();
      im.setMatrixAt(i, o3.matrix); im.setColorAt(i, colr.setHSL(0.28 + 0.05 * r(), 0.4 + 0.2 * r(), tintLo + (tintHi - tintLo) * r()));
    }
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.frustumCulled = false; add(im);
  };
  const cluster = (cx: number, cz: number, spread: number) => (): [number, number] => [cx + (r() - 0.5) * spread, cz + (r() - 0.5) * spread * 0.6];
  const spotsA = [cluster(-d.W * 0.44, -d.D / 2 + 0.5, 1.4), cluster(d.W * 0.44, -d.D / 2 + 0.5, 1.4), cluster(-d.W * 0.2, -d.D / 2 + 0.3, 1.8), cluster(d.W * 0.18, -d.D / 2 + 0.3, 1.8), cluster(-d.W * 0.46, d.D * 0.12, 0.8), cluster(d.W * 0.46, d.D * 0.1, 0.8)];
  const gSpots = spotsA.map((f) => Array.from({ length: 14 }, f)).flat();
  mkPlants(bladeGeometry(0.075, 0.25), gSpots.length, 0.22, 0.9, 1.9, 0.75, 1.05, (i) => gSpots[i]);
  const lSpots = [cluster(-d.W * 0.4, -d.D / 2 + 0.7, 1.0), cluster(d.W * 0.38, -d.D / 2 + 0.75, 1.0), cluster(d.W * 0.03, -d.D / 2 + 0.35, 1.2)].map((f) => Array.from({ length: 6 }, f)).flat();
  mkPlants(bladeGeometry(0.34, 0.5, 6), lSpots.length, 0.16, 0.7, 1.25, 0.6, 0.9, (i) => lSpots[i]);

  // ışık hüzmeleri
  const beamTex = own(canvasTex(32, 128, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 32, 128);
    const gx = g.createLinearGradient(0, 0, 32, 0); gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(0.5, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = gx; g.fillRect(0, 0, 32, 128);
  }, false));
  const beamMat: MeshBasicMaterial[] = [];
  [[-0.28, -0.1, 0.22, 1.5], [0.05, 0.12, -0.18, 2.0], [0.32, -0.2, 0.15, 1.2]].forEach(([fx, fz, rot, w], i) => {
    const m = own(new MeshBasicMaterial({ map: beamTex, color: 0xcdeff5, transparent: true, opacity: 0.1, blending: AdditiveBlending, depthWrite: false, side: DoubleSide, fog: false, toneMapped: false }));
    beamMat.push(m);
    const g = own(new PlaneGeometry(w, d.H * 1.05));
    const mesh = new Mesh(g, m); mesh.position.set(fx * d.W, 0, fz * d.D); mesh.rotation.z = rot; mesh.rotation.y = 0.3 * (i - 1); mesh.renderOrder = -9;
    add(mesh);
  });

  // süzülen parçacıklar
  const N = 90, pp = new Float32Array(N * 3), seeds = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { pp[i * 3] = (r() - 0.5) * d.W * 0.96; pp[i * 3 + 1] = (r() - 0.5) * d.H * 0.9; pp[i * 3 + 2] = (r() - 0.5) * d.D * 0.96; seeds[i * 3] = r() * 6.28; seeds[i * 3 + 1] = 0.01 + r() * 0.03; seeds[i * 3 + 2] = 0.1 + r() * 0.25; }
  const pg = own(new BufferGeometry()); const pAttr = new BufferAttribute(pp, 3); pg.setAttribute('position', pAttr);
  const dot = own(canvasTex(32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }, false));
  const pm = own(new PointsMaterial({ map: dot, size: 0.07, sizeAttenuation: true, color: 0xd8f2f6, transparent: true, opacity: 0.35, depthWrite: false, fog: false, blending: AdditiveBlending }));
  const pts = new Points(pg, pm); pts.frustumCulled = false; pts.renderOrder = -8; add(pts);

  const half = { x: d.W / 2 - 0.1, y: d.H / 2 - 0.15, z: d.D / 2 - 0.1 };
  return {
    objects, sandTop: floor + amp,
    update(time: number, dt: number) {
      uTime.value = time;
      beamMat.forEach((m, i) => { m.opacity = 0.085 + 0.035 * Math.sin(time * 0.35 + i * 2.1); });
      for (let i = 0; i < N; i++) {
        const sx = seeds[i * 3], rise = seeds[i * 3 + 1], dr = seeds[i * 3 + 2];
        let y = pp[i * 3 + 1] + rise * dt; if (y > half.y) y = -half.y + 0.5;
        pp[i * 3 + 1] = y;
        pp[i * 3] = Math.max(-half.x, Math.min(half.x, pp[i * 3] + Math.sin(time * 0.4 + sx) * dr * dt));
        pp[i * 3 + 2] = Math.max(-half.z, Math.min(half.z, pp[i * 3 + 2] + Math.cos(time * 0.3 + sx * 1.7) * dr * dt));
      }
      pAttr.needsUpdate = true;
    },
  };
}
