// Japon balığı three.js sahnesi: yalnızca 3B japon sayfasında, tembel (dynamic import) yüklenir.
import { Color, DoubleSide, Group, Material, MeshPhysicalMaterial, MeshStandardMaterial, RepeatWrapping, SphereGeometry } from 'three';
import { addEye, canvasTexture, createFishViewer, finGeometry, loftBody, proxyFrom, put, swimify, tube, type FishBuilt, type SwimUniforms } from '../akvaryum/fish3d';
import { mixHex } from '../akvaryum/fishmath';
import type { SexId, SpeciesViewer, SpeciesViewerOptions } from '../akvaryum/types';
import { bodyFor, eyeGeom, finsFor, lateralLine, mouthLine, nostrils, operculumArc, tubercles } from './model';
import { partAnchors, partsFor } from './parts';
import { paintBody } from './texture';
import { variantById } from './variants';

export const VIEW_ANGLES: Record<string, [number, number]> = {
  yan: [0, Math.PI / 2 - 0.05], capraz: [-0.75, 1.1], ust: [0, 0.04], alt: [0, Math.PI - 0.04], on: [-Math.PI / 2, Math.PI / 2 - 0.08], arka: [Math.PI / 2, Math.PI / 2 - 0.08],
};

export function buildJapon(sex: SexId, variantId: string, u: SwimUniforms, texW: number): FishBuilt {
  const v = variantById(variantId);
  const body = bodyFor(sex);
  const group = new Group();
  const textures: FishBuilt['textures'] = [];
  const tex = paintBody(v, sex, texW);
  const map = canvasTexture(tex.color, true, textures), bump = canvasTexture(tex.bump, false, textures);
  map.wrapT = RepeatWrapping; bump.wrapT = RepeatWrapping;
  const skin = swimify(new MeshPhysicalMaterial({
    map, bumpMap: bump, bumpScale: 0.9, roughness: 0.5 - 0.22 * v.parlak, metalness: 0.05 + 0.18 * v.parlak, clearcoat: 0.12 + 0.25 * v.parlak, clearcoatRoughness: 0.4, envMapIntensity: 0.35 + 0.45 * v.parlak,
    ...(v.sedef ? { iridescence: 0.5, iridescenceIOR: 1.5 } : {}),
  }), u);
  put(group, loftBody(body), skin);

  const std = (color: string, rough = 0.5, metal = 0): Material => swimify(new MeshStandardMaterial({ color: new Color(color), roughness: rough, metalness: metal }), u);
  const e = eyeGeom(sex);
  const dark = mixHex(v.body.yan, '#000000', 0.55);
  for (const side of [1, -1] as const) {
    addEye(group, [e.center[0], e.center[1], e.center[2] * side], e.radius, [e.normal[0], e.normal[1], e.normal[2] * side], v.eye, std, 1.0, 0.55);
    put(group, tube(mouthLine(sex, side), 0.0034, 12), std(dark, 0.6));
    put(group, tube(operculumArc(sex, side), 0.0036, 18), std(mixHex(v.body.yan, '#000000', 0.45), 0.5));
    for (const n of nostrils(sex)) { const g = new SphereGeometry(n.r, 10, 8); g.translate(n.pos[0], n.pos[1], n.pos[2] * side); put(group, g, std(dark, 0.7)); }
  }
  for (const p of tubercles(sex)) for (const side of [1, -1] as const) { const g = new SphereGeometry(0.0055, 8, 6); g.translate(p[0], p[1], p[2] * side); put(group, g, std('#f6f3ea', 0.6)); }
  void lateralLine;
  for (const f of finsFor(sex)) {
    const mat = swimify(new MeshStandardMaterial({ map: canvasTexture(tex.fins[f.id], true, textures), transparent: true, side: DoubleSide, depthWrite: false, roughness: 0.55, alphaTest: 0.01 }), u);
    for (const side of f.paired ? ([1, -1] as const) : ([1] as const)) put(group, finGeometry(f, side, 8), mat, 2);
  }
  return { group, proxy: [proxyFrom(loftBody(body, 30, 20))], textures };
}

export function createViewer(opts: SpeciesViewerOptions): SpeciesViewer {
  return createFishViewer(opts, { views: VIEW_ANGLES, home: 'capraz', parts: partsFor, anchors: partAnchors, build: buildJapon });
}
