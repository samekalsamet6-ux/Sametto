// Neon tetra three.js sahnesi: yalnızca 3B neon sayfasında, tembel (dynamic import) yüklenir.
import { Color, DoubleSide, Group, Material, MeshPhysicalMaterial, MeshStandardMaterial, RepeatWrapping } from 'three';
import { addEye, canvasTexture, createFishViewer, finGeometry, loftBody, proxyFrom, put, swimify, tube, type FishBuilt, type SwimUniforms } from '../akvaryum/fish3d';
import { mixHex } from '../akvaryum/fishmath';
import type { SexId, SpeciesViewer, SpeciesViewerOptions } from '../akvaryum/types';
import { bodyFor, eyeGeom, finsFor, mouthLine, operculumArc } from './model';
import { partAnchors, partsFor } from './parts';
import { paintBody } from './texture';
import { variantById } from './variants';

export const VIEW_ANGLES: Record<string, [number, number]> = {
  yan: [0, Math.PI / 2 - 0.05], capraz: [-0.75, 1.15], ust: [0, 0.04], alt: [0, Math.PI - 0.04], on: [-Math.PI / 2, Math.PI / 2 - 0.08], arka: [Math.PI / 2, Math.PI / 2 - 0.08],
};

export function buildNeon(sex: SexId, variantId: string, u: SwimUniforms, texW: number): FishBuilt {
  const v = variantById(variantId);
  const body = bodyFor(sex);
  const group = new Group();
  const textures: FishBuilt['textures'] = [];
  const tex = paintBody(v, sex, texW);
  const map = canvasTexture(tex.color, true, textures), glow = canvasTexture(tex.glow, true, textures), bump = canvasTexture(tex.bump, false, textures);
  for (const t of [map, glow, bump]) t.wrapT = RepeatWrapping;
  const skin = swimify(new MeshPhysicalMaterial({
    map, bumpMap: bump, bumpScale: 0.3, roughness: 0.35, metalness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 1.0,
    emissive: new Color('#ffffff'), emissiveMap: glow, emissiveIntensity: 0.32 * v.serit.parilti, iridescence: 0.6, iridescenceIOR: 1.6,
  }), u);
  put(group, loftBody(body), skin);

  const std = (color: string, rough = 0.5, metal = 0): Material => swimify(new MeshStandardMaterial({ color: new Color(color), roughness: rough, metalness: metal }), u);
  const e = eyeGeom(sex);
  for (const side of [1, -1] as const) {
    addEye(group, [e.center[0], e.center[1], e.center[2] * side], e.radius, [e.normal[0], e.normal[1], e.normal[2] * side], v.eye, std, 1.2, 0.8);
    put(group, tube(mouthLine(sex, side), 0.0028, 10), std('#5a5148', 0.6));
    put(group, tube(operculumArc(sex, side), 0.0028, 16), std(mixHex(v.body.yan, '#000000', 0.45), 0.5));
  }
  for (const f of finsFor(sex)) {
    const mat = swimify(new MeshStandardMaterial({ map: canvasTexture(tex.fins[f.id], true, textures), transparent: true, side: DoubleSide, depthWrite: false, roughness: 0.5, alphaTest: 0.01 }), u);
    for (const side of f.paired ? ([1, -1] as const) : ([1] as const)) put(group, finGeometry(f, side, 6), mat, 2);
  }
  return { group, proxy: [proxyFrom(loftBody(body, 30, 20))], textures };
}

export function createViewer(opts: SpeciesViewerOptions): SpeciesViewer {
  return createFishViewer(opts, { views: VIEW_ANGLES, home: 'capraz', parts: partsFor, anchors: partAnchors, build: buildNeon });
}
