// Japon balığı three.js sahnesi: yalnızca 3B japon sayfasında, tembel (dynamic import) yüklenir.
import { Color, DoubleSide, Group, Material, MeshPhysicalMaterial, MeshStandardMaterial, RepeatWrapping, SphereGeometry } from 'three';
import { addEye, canvasTexture, createFishViewer, finGeometry, loftBody, proxyFrom, put, swimify, taperedTube, tube, type FishBuilt, type SwimUniforms } from '../akvaryum/fish3d';
import { mixHex } from '../akvaryum/fishmath';
import type { SexId, SpeciesViewer, SpeciesViewerOptions } from '../akvaryum/types';
import { FORM_IDS, bodyFor, eyeExtras, eyeGeom, finsFor, mouthLine, nostrils, operculumArc, specOf, tubercles, wenSpec, type Form } from './model';
import { partAnchors, partsFor } from './parts';
import { paintBody } from './texture';
import { variantById } from './variants';

const formOf = (id?: string): Form => (FORM_IDS as readonly string[]).includes(id ?? '') ? (id as Form) : 'standart';

export const VIEW_ANGLES: Record<string, [number, number]> = {
  yan: [0, Math.PI / 2 - 0.05], capraz: [-0.75, 1.1], ust: [0, 0.04], alt: [0, Math.PI - 0.04], on: [-Math.PI / 2, Math.PI / 2 - 0.08], arka: [Math.PI / 2, Math.PI / 2 - 0.08],
};

export function buildJapon(sex: SexId, variantId: string, u: SwimUniforms, texW: number, formId?: string): FishBuilt {
  const form = formOf(formId);
  const v = variantById(variantId);
  const body = bodyFor(sex, form);
  const group = new Group();
  const textures: FishBuilt['textures'] = [];
  const tex = paintBody(v, sex, texW, form);
  const map = canvasTexture(tex.color, true, textures), bump = canvasTexture(tex.bump, false, textures);
  map.wrapT = RepeatWrapping; bump.wrapT = RepeatWrapping;
  const skin = swimify(new MeshPhysicalMaterial({
    map, bumpMap: bump, bumpScale: specOf(form).inci ? 2.2 : 0.9, roughness: 0.5 - 0.22 * v.parlak, metalness: 0.05 + 0.18 * v.parlak, clearcoat: 0.12 + 0.25 * v.parlak, clearcoatRoughness: 0.4, envMapIntensity: 0.35 + 0.45 * v.parlak,
    ...(v.sedef ? { iridescence: 0.5, iridescenceIOR: 1.5 } : {}),
  }), u);
  put(group, loftBody(body), skin);

  const std = (color: string, rough = 0.5, metal = 0): Material => swimify(new MeshStandardMaterial({ color: new Color(color), roughness: rough, metalness: metal }), u);
  const e = eyeGeom(sex, form);
  const dark = mixHex(v.body.yan, '#000000', 0.55);
  for (const side of [1, -1] as const) {
    addEye(group, [e.center[0], e.center[1], e.center[2] * side], e.radius, [e.normal[0], e.normal[1], e.normal[2] * side], v.eye, std, 1.0, 0.55);
    put(group, tube(mouthLine(sex, side, form), 0.0034, 12), std(dark, 0.6));
    put(group, tube(operculumArc(sex, side, 16, form), 0.0036, 18), std(mixHex(v.body.yan, '#000000', 0.45), 0.5));
    for (const n of nostrils(sex, form)) { const g = new SphereGeometry(n.r, 10, 8); g.translate(n.pos[0], n.pos[1], n.pos[2] * side); put(group, g, std(dark, 0.7)); }
  }
  // telescope: göz sapı; bubble eye: sıvı keseleri
  const ex = eyeExtras(sex, form);
  for (const side of [1, -1] as const) {
    if (ex.stalk) put(group, taperedTube(ex.stalk.path.map((q): [number, number, number] => [q[0], q[1], q[2] * side]), ex.stalk.radii, 12, 10), std(mixHex(v.body.yan, v.body.sirt, 0.35), 0.55));
    if (ex.sac) {
      const g = new SphereGeometry(1, 24, 16);
      g.scale(ex.sac.radii[0], ex.sac.radii[1], ex.sac.radii[2]); g.translate(ex.sac.center[0], ex.sac.center[1], ex.sac.center[2] * side);
      put(group, g, swimify(new MeshPhysicalMaterial({ color: new Color(mixHex(v.body.yan, '#ffffff', 0.45)), roughness: 0.15, transparent: true, opacity: 0.78, clearcoat: 0.6, side: DoubleSide, depthWrite: false }), u), 2);
    }
  }
  // wen: yumrulu baş büyümesi
  const wen = wenSpec(sex, form);
  if (wen) {
    const g = new SphereGeometry(1, 56, 36);
    const pos = g.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = Math.abs(pos.getZ(i)), k = wen.bumps;
      const n = 0.5 + 0.17 * (Math.sin(k * 1.3 * x + 1.1) + Math.sin(k * 1.7 * y + 0.4) + Math.sin(k * 1.5 * z + 2.0));
      const r = 1 + wen.amp * (n - 0.5) * 2;
      pos.setXYZ(i, x * r * wen.radii[0] + wen.center[0], y * r * wen.radii[1] + wen.center[1], pos.getZ(i) * r * wen.radii[2] + wen.center[2]);
    }
    g.computeVertexNormals();
    const wenColor = v.desen === 'sarasa' ? v.yamalar[0] : v.desen === 'panda' ? v.yamalar[0] : v.desen === 'shubunkin' ? v.yamalar[1] : mixHex(v.body.sirt, v.body.yan, 0.5);
    put(group, g, swimify(new MeshStandardMaterial({ color: new Color(wenColor), roughness: 0.6, metalness: 0.05 }), u));
  }
  for (const p of tubercles(sex, form)) for (const side of [1, -1] as const) { const g = new SphereGeometry(0.0055, 8, 6); g.translate(p[0], p[1], p[2] * side); put(group, g, std('#f6f3ea', 0.6)); }
  for (const f of finsFor(sex, form)) {
    const mat = swimify(new MeshStandardMaterial({ map: canvasTexture(tex.fins[f.id], true, textures), transparent: true, side: DoubleSide, depthWrite: false, roughness: 0.55, alphaTest: 0.01 }), u);
    for (const side of f.paired ? ([1, -1] as const) : ([1] as const)) put(group, finGeometry(f, side, 8), mat, 2);
  }
  return { group, proxy: [proxyFrom(loftBody(body, 30, 20))], textures };
}

export function createViewer(opts: SpeciesViewerOptions): SpeciesViewer {
  return createFishViewer(opts, { views: VIEW_ANGLES, home: 'capraz', parts: partsFor, anchors: (s, f) => partAnchors(s, formOf(f)), build: buildJapon });
}
