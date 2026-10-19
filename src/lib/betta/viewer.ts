// Betta three.js sahnesi: yalnızca 3B betta sayfasında, tembel (dynamic import) yüklenir.
import { Color, DoubleSide, RepeatWrapping, Group, Material, MeshPhysicalMaterial, MeshStandardMaterial, SphereGeometry } from 'three';
import { canvasTexture, faceHost, createFishViewer, finGeometry, loftBody, proxyFrom, put, swimify, tube, type FishBuilt, type SwimUniforms } from '../akvaryum/fish3d';
import { mixHex } from '../akvaryum/fishmath';
import { addEye, addMouth, createFaceRig, pulseGill } from '../akvaryum/fishface';
import type { SexId, SpeciesViewer, SpeciesViewerOptions } from '../akvaryum/types';
import { bodyFor, eyeSpec, finsFor, mouthSpec, operculumArc, ovipositor } from './model';
import { partAnchors, partsFor } from './parts';
import { paintBody } from './texture';
import { sexTone, variantById } from './variants';

export const VIEW_ANGLES: Record<string, [number, number]> = {
  yan: [0, Math.PI / 2 - 0.05],
  capraz: [-0.75, 1.15],
  ust: [0, 0.04],
  alt: [0, Math.PI - 0.04],
  on: [-Math.PI / 2, Math.PI / 2 - 0.08],
  arka: [Math.PI / 2, Math.PI / 2 - 0.08],
};

export function buildBetta(sex: SexId, variantId: string, u: SwimUniforms, texW: number, form?: string): FishBuilt {
  const v = variantById(variantId);
  const body = bodyFor(sex, form);
  const group = new Group();
  const textures: FishBuilt['textures'] = [];
  const tex = paintBody(v, sex, texW, form);
  const map = canvasTexture(tex.color, true, textures);
  const bump = canvasTexture(tex.bump, false, textures);

  const skin = swimify(new MeshPhysicalMaterial({
    map, bumpMap: bump, bumpScale: 0.35 + 1.1 * v.pul, roughness: 0.55 - 0.3 * v.parlak, metalness: 0.05 + 0.25 * v.parlak, clearcoat: 0.25 + 0.4 * v.parlak, clearcoatRoughness: 0.35,
    sheen: 0.1, sheenColor: new Color('#ffffff'), envMapIntensity: 0.35 + 0.6 * v.parlak,
  }), u);
  map.wrapT = RepeatWrapping;
  const mouth = mouthSpec(sex, form);
  put(group, loftBody(body, 72, 44, mouth), skin);

  const std = (color: string, rough = 0.5, metal = 0): Material => swimify(new MeshStandardMaterial({ color: new Color(color), roughness: rough, metalness: metal }), u);
  const host = faceHost(group, u, textures), rig = createFaceRig();
  const e = eyeSpec(sex, form), socket = loftBody(body, 40, 36);
  const eyeStyle = { ...v.eye, iris: mixHex(v.eye.iris, '#caa860', 0.35), pupilAngle: 0.55, irisAngle: 1.0, ring: sexTone(mixHex(v.body.yan, '#000000', 0.55), sex, v) };
  let eyeTex;
  const line = sexTone(mixHex(v.body.yan, '#000000', 0.62), sex, v);
  for (const side of [1, -1] as const) {
    eyeTex = addEye(host, { center: [e.center[0], e.center[1], e.center[2] * side], r: e.radius, normal: [e.normal[0], e.normal[1], e.normal[2] * side], style: eyeStyle, body: socket }, eyeTex);
    pulseGill(rig, put(group, tube(operculumArc(sex, side, 14, form), 0.0032, 18), std(mixHex(v.body.yan, '#000000', 0.5), 0.55)), side);
  }
  socket.dispose();
  addMouth(host, rig, { ...mouth, lipColor: sexTone(mixHex(v.body.bas, '#b87868', 0.3), sex, v), lowerColor: sexTone(mixHex(v.body.bas, '#d09080', 0.3), sex, v), innerColor: '#1c0a0c' });
  const ov = ovipositor(sex, form);
  if (ov) { const g = new SphereGeometry(ov.r, 14, 10); g.scale(1, 0.8, 1); g.translate(...ov.pos); put(group, g, std('#f6efe6', 0.5)); }

  // yüzgeçler (saydam, ışınlı doku)
  for (const f of finsFor(sex, form)) {
    const mat = swimify(new MeshStandardMaterial({
      map: canvasTexture(tex.fins[f.id], true, textures), transparent: true, side: DoubleSide, depthWrite: false, roughness: 0.55, metalness: 0.05, alphaTest: 0.01,
    }), u);
    for (const side of f.paired ? ([1, -1] as const) : ([1] as const)) put(group, finGeometry(f, side, 8), mat, 2);
  }

  // gizlenme sınaması için kaba vekil
  const proxy = [proxyFrom(loftBody(body, 30, 20))];
  return { group, proxy, textures, face: rig };
}

export function createViewer(opts: SpeciesViewerOptions): SpeciesViewer {
  return createFishViewer(opts, { views: VIEW_ANGLES, home: 'capraz', parts: partsFor, anchors: partAnchors, build: buildBetta });
}

