// Pleko three.js sahnesi: yalnızca 3B pleko sayfasında, tembel (dynamic import) yüklenir.
import { BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Group, Material, MeshPhysicalMaterial, MeshStandardMaterial, RepeatWrapping, SphereGeometry } from 'three';
import { addEye, canvasTexture, createFishViewer, finGeometry, loftBody, proxyFrom, put, swimify, taperedTube, tube, type FishBuilt, type SwimUniforms } from '../akvaryum/fish3d';
import { mixHex, type Vec3 } from '../akvaryum/fishmath';
import type { SexId, SpeciesViewer, SpeciesViewerOptions } from '../akvaryum/types';
import { bodyFor, bristles, eyeSpec, finsFor, mouthPapillae, mouthRing, mouthSlit, mouthSpec, operculumArc, spines } from './model';
import { partAnchors, partsFor } from './parts';
import { paintBody } from './texture';
import { tulFor } from './forms';
import { variantById } from './variants';

export const VIEW_ANGLES: Record<string, [number, number]> = {
  yan: [0, Math.PI / 2 - 0.05], capraz: [-0.8, 0.95], ust: [0, 0.04], alt: [0, Math.PI - 0.04], on: [-Math.PI / 2, Math.PI / 2 - 0.08], arka: [Math.PI / 2, Math.PI / 2 - 0.08],
};

const mirrorZ = (p: Vec3[], side: 1 | -1): Vec3[] => p.map((q): Vec3 => [q[0], q[1], q[2] * side]);

/** Halka etrafında, merkeze doğru küçülen ve ortada aşağı şişen disk (vantuz dudak yüzeyi) */
function discGeometry(ring: Vec3[], center: Vec3, bulge: number, rings = 4): BufferGeometry {
  const n = ring.length, pos: number[] = [], idx: number[] = [];
  for (let k = 0; k <= rings; k++) {
    const t = k / rings;
    for (let i = 0; i < n; i++) {
      const p = ring[i];
      pos.push(center[0] + (p[0] - center[0]) * (1 - t), p[1] - bulge * (1 - Math.pow(1 - t, 2)) , center[2] + (p[2] - center[2]) * (1 - t));
    }
  }
  for (let k = 0; k < rings; k++) for (let i = 0; i < n; i++) {
    const a = k * n + i, b = k * n + ((i + 1) % n), c = (k + 1) * n + i, d = (k + 1) * n + ((i + 1) % n);
    idx.push(a, c, b, b, c, d);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function buildPleco(sex: SexId, variantId: string, u: SwimUniforms, texW: number, form?: string): FishBuilt {
  const v = variantById(variantId), tul = tulFor(form);
  const body = bodyFor(sex);
  const group = new Group();
  const textures: FishBuilt['textures'] = [];
  const tex = paintBody(v, sex, texW);
  const map = canvasTexture(tex.color, true, textures), bump = canvasTexture(tex.bump, false, textures);
  map.wrapT = RepeatWrapping; bump.wrapT = RepeatWrapping;
  const skin = swimify(new MeshPhysicalMaterial({
    map, bumpMap: bump, bumpScale: 1.8 * v.zirh, roughness: 0.62, metalness: 0.03, clearcoat: 0.1, clearcoatRoughness: 0.55, envMapIntensity: 0.4,
  }), u);
  put(group, loftBody(body, 84, 48), skin);

  const std = (color: string, rough = 0.5, metal = 0): Material => swimify(new MeshStandardMaterial({ color: new Color(color), roughness: rough, metalness: metal }), u);
  const e = eyeSpec(sex);
  for (const side of [1, -1] as const) {
    addEye(group, [e.center[0], e.center[1], e.center[2] * side], e.radius, [e.normal[0], e.normal[1], e.normal[2] * side], v.eye, std, 1.05, 0.55);
    put(group, tube(operculumArc(sex, side), 0.0034, 16), std(mixHex(v.body.yan, '#000000', 0.5), 0.55));
  }

  // vantuz ağız: etli dudak diski, dış/iç halka, yarık, papiller
  const m = mouthSpec(sex);
  const lipCol = mixHex(v.body.karin, '#c97f68', 0.55);
  put(group, discGeometry(mouthRing(sex), [m.c[0], m.c[1] - 0.001, 0], m.bulge), std(lipCol, 0.7));
  put(group, tube(mouthRing(sex, 1.0), 0.0042, 40, true), std(mixHex(lipCol, '#ffffff', 0.18), 0.65));
  put(group, tube(mouthRing(sex, 0.62), 0.0028, 32, true), std(mixHex(lipCol, '#000000', 0.18), 0.65));
  put(group, tube(mouthSlit(sex), 0.0048, 14), std('#2a1612', 0.5));
  for (const p of mouthPapillae(sex)) { const g = new SphereGeometry(0.0034, 8, 6); g.translate(p[0], p[1], p[2]); put(group, g, std(mixHex(lipCol, '#ffffff', 0.28), 0.7)); }
  // çene dişleri (şematik): yarık boyunca küçük açık renkli noktalar
  for (const p of mouthSlit(sex, 13)) { const g = new SphereGeometry(0.0018, 6, 5); g.translate(p[0] + 0.004, p[1] - 0.001, p[2]); put(group, g, std('#efe6d2', 0.4)); }

  // bristle'lar (tentakler): erkekte büyük ve dallı, dişide kısa
  const bristleMat = std(mixHex(v.body.yan, v.body.karin, 0.22), 0.7);
  for (const side of [1, -1] as const) for (const bl of bristles(sex)) {
    put(group, taperedTube(mirrorZ(bl.stalk, side), bl.radii, 8, 14), bristleMat);
    for (const br of bl.branches) put(group, taperedTube(mirrorZ(br.path, side), br.radii, 6, 10), bristleMat);
  }

  // dikenler
  const spineMat = std(mixHex(v.body.yan, '#ffffff', 0.18), 0.45);
  for (const s of spines(sex, tul)) for (const side of s.paired ? ([1, -1] as const) : ([1] as const)) put(group, taperedTube(mirrorZ(s.path, side), [s.r, s.r * 0.6, s.r * 0.15], 6, 12), spineMat);

  // yüzgeçler (saydam, ışınlı doku)
  for (const f of finsFor(sex, tul)) {
    const mat = swimify(new MeshStandardMaterial({ map: canvasTexture(tex.fins[f.id], true, textures), transparent: true, side: DoubleSide, depthWrite: false, roughness: 0.6, alphaTest: 0.01 }), u);
    for (const side of f.paired ? ([1, -1] as const) : ([1] as const)) put(group, finGeometry(f, side, 6), mat, 2);
  }
  return { group, proxy: [proxyFrom(loftBody(body, 30, 20))], textures };
}

export function createViewer(opts: SpeciesViewerOptions): SpeciesViewer {
  return createFishViewer(opts, { views: VIEW_ANGLES, home: 'capraz', parts: partsFor, anchors: partAnchors, build: buildPleco });
}
