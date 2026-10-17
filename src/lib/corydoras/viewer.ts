// Corydoras three.js sahnesi: yalnızca 3B corydoras sayfasında, tembel (dynamic import) yüklenir.
import { Color, DoubleSide, Group, Material, MeshPhysicalMaterial, MeshStandardMaterial, RepeatWrapping, type BufferGeometry } from 'three';
import { addEye, canvasTexture, createFishViewer, finGeometry, loftBody, proxyFrom, put, swimify, taperedTube, tube, type FishBuilt, type SwimUniforms } from '../akvaryum/fish3d';
import { mixHex, type Vec3 } from '../akvaryum/fishmath';
import type { SexId, SpeciesViewer, SpeciesViewerOptions } from '../akvaryum/types';
import { barbels, bodyFor, eyeGeom, finsFor, lipsLoop, operculumArc, spines } from './model';
import { partAnchors, partsFor } from './parts';
import { paintBody } from './texture';
import { variantById } from './variants';

export const VIEW_ANGLES: Record<string, [number, number]> = {
  yan: [0, Math.PI / 2 - 0.05], capraz: [-0.75, 1.1], ust: [0, 0.04], alt: [0, Math.PI - 0.04], on: [-Math.PI / 2, Math.PI / 2 - 0.08], arka: [Math.PI / 2, Math.PI / 2 - 0.08],
};

const mirrorZ = (p: Vec3[], side: 1 | -1): Vec3[] => p.map((q): Vec3 => [q[0], q[1], q[2] * side]);

export function buildCorydoras(sex: SexId, variantId: string, u: SwimUniforms, texW: number): FishBuilt {
  const v = variantById(variantId);
  const body = bodyFor(sex);
  const group = new Group();
  const textures: FishBuilt['textures'] = [];
  const tex = paintBody(v, sex, texW);
  const map = canvasTexture(tex.color, true, textures), bump = canvasTexture(tex.bump, false, textures);
  map.wrapT = RepeatWrapping; bump.wrapT = RepeatWrapping;
  const skin = swimify(new MeshPhysicalMaterial({
    map, bumpMap: bump, bumpScale: 1.6 * v.zirh, roughness: 0.55, metalness: v.desen === 'bronz' ? 0.12 : 0.04, clearcoat: 0.12, clearcoatRoughness: 0.5, envMapIntensity: v.desen === 'bronz' ? 0.55 : 0.35,
  }), u);
  put(group, loftBody(body), skin);

  const std = (color: string, rough = 0.5, metal = 0): Material => swimify(new MeshStandardMaterial({ color: new Color(color), roughness: rough, metalness: metal }), u);
  const e = eyeGeom(sex);
  for (const side of [1, -1] as const) {
    addEye(group, [e.center[0], e.center[1], e.center[2] * side], e.radius, [e.normal[0], e.normal[1], e.normal[2] * side], v.eye, std, 1.0, 0.55);
    put(group, tube(operculumArc(sex, side), 0.0032, 16), std(mixHex(v.body.yan, '#000000', 0.5), 0.5));
    // bıyıklar
    for (const bb of barbels(sex)) put(group, taperedTube(mirrorZ(bb.path, side), bb.radii, 8, 18), std(mixHex(v.body.karin, v.body.yan, 0.3), 0.6));
  }
  // dudaklar: etli, hafif pembemsi halka
  put(group, tube(lipsLoop(sex), 0.0075, 28, true), std(mixHex(v.body.karin, '#d58a7a', 0.45), 0.6));
  // dikenler
  const spineMat = std(mixHex(v.body.yan, '#ffffff', 0.15), 0.4);
  for (const s of spines(sex)) for (const side of s.paired ? ([1, -1] as const) : ([1] as const)) put(group, taperedTube(mirrorZ(s.path, side), [s.r, s.r * 0.6, s.r * 0.15], 6, 12), spineMat);
  // yüzgeçler
  for (const f of finsFor(sex)) {
    const mat = swimify(new MeshStandardMaterial({ map: canvasTexture(tex.fins[f.id], true, textures), transparent: true, side: DoubleSide, depthWrite: false, roughness: 0.55, alphaTest: 0.01 }), u);
    for (const side of f.paired ? ([1, -1] as const) : ([1] as const)) put(group, finGeometry(f, side, 6) as BufferGeometry, mat, 2);
  }
  return { group, proxy: [proxyFrom(loftBody(body, 30, 20))], textures };
}

export function createViewer(opts: SpeciesViewerOptions): SpeciesViewer {
  return createFishViewer(opts, { views: VIEW_ANGLES, home: 'capraz', parts: partsFor, anchors: partAnchors, build: buildCorydoras });
}
