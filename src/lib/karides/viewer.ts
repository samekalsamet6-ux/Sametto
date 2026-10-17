// three.js sahnesi: yalnızca 3B karides sayfasında, tembel (dynamic import) yüklenir.
// Gövde bir eklem zinciri olarak kurulur: karapaks -> 6 karın halkası -> telson/uropod; bacaklar, antenler ve yüzme bacakları zincirlerdir.
import {
  ACESFilmicToneMapping, AmbientLight, BufferGeometry, CanvasTexture, Color, CylinderGeometry, DirectionalLight, ExtrudeGeometry, Float32BufferAttribute,
  Group, HemisphereLight, InstancedMesh, Material, Matrix4, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera, PMREMGenerator,
  Raycaster, Scene, Shape, SphereGeometry, SRGBColorSpace, Texture, Vector3, WebGLRenderer, Box3, Sphere, Quaternion, Euler,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  ANIM, BODY, CARAPACE, LEGS, LEG_Y, LEG_Z, PLEON_PIVOT, REST_ANGLES, SEG, TELSON, UROPOD, antennaSway, carapaceRing, clamp, eggPositions, jointAngle,
  pleopodAngle, ringYZ, segRing, type Ring, type Sex,
} from './model';
import { partsFor, type PartId, type ViewId } from './parts';
import { paintShell } from './texture';
import { hexToRgb, sexTone, variantById, type Variant } from './variants';

// ------------------------------------------------------------------ geometri yardımcıları

/** Kesit halkalarından kabuk: u boyunca halkalar, çevrede θ = -π/2 (karın) .. 3π/2. UV: (u, v) */
function shellGeometry(ringAt: (u: number) => Ring, flare: number, u0: number, u1: number, ext: number, nu: number, na: number, caps: { front?: boolean; rear?: boolean }): BufferGeometry {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const ringVerts: Vec[][] = [];
  for (let i = 0; i <= nu; i++) {
    const u = u0 + ((u1 - u0) * i) / nu, uc = clamp(u, 0, 1);
    const r = ringAt(uc), k = u < 0 ? 0.9 : 1;
    const cx = u < 0 ? ringAt(0).cx + ext * u : r.cx;
    const row: Vec[] = [];
    for (let j = 0; j <= na; j++) {
      const th = -Math.PI / 2 + (j / na) * Math.PI * 2;
      const [y, z] = ringYZ(th, r.ry * k, r.rz * k, flare);
      pos.push(cx, r.cy + y, z);
      uv.push(uc, j / na);
      row.push([cx, r.cy + y, z]);
    }
    ringVerts.push(row);
  }
  for (let i = 0; i < nu; i++) for (let j = 0; j < na; j++) {
    const a = i * (na + 1) + j, b = a + 1, c = a + na + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const capAt = (row: Vec[], front: boolean) => {
    const base = pos.length / 3;
    const cx = row[0][0], cy = (row[0][1] + row[Math.floor(na / 2)][1]) / 2;
    pos.push(cx, cy, 0); uv.push(0.02, 0.5);
    row.forEach((p) => { pos.push(...p); uv.push(0.02, 0.5); });
    for (let j = 0; j < na; j++) front ? idx.push(base, base + 1 + j, base + 2 + j) : idx.push(base, base + 2 + j, base + 1 + j);
  };
  if (caps.front) capAt(ringVerts[0], true);
  if (caps.rear) capAt(ringVerts[nu], false);
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
type Vec = [number, number, number];

/** Yassı yaprak (telson/uropod): xz düzleminde, +x yönünde uzar */
function leafGeometry(len: number, half: number, thick: number, tipPoint: number, teeth = 0): BufferGeometry {
  const sh = new Shape();
  const N = 18;
  const w = (s: number) => half * Math.pow(Math.sin(Math.PI * Math.pow(Math.min(1, s * 1.0 + 0.0), 0.62)), 0.85) * (1 - 0.0 * s);
  const top: [number, number][] = [], bot: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const base = i === 0 ? half * 0.55 : w(s) + half * 0.25 * (1 - s) * (1 - s) + (s > 0.97 ? 0 : 0);
    const spike = teeth && s > 0.55 && s < 0.97 && i % 2 === 0 ? half * 0.1 : 0;
    top.push([len * s, base + spike]);
    bot.push([len * s, -(base + spike)]);
  }
  if (tipPoint) { top.push([len + tipPoint, 0]); }
  sh.moveTo(top[0][0], top[0][1]);
  top.forEach((p) => sh.lineTo(p[0], p[1]));
  bot.reverse().forEach((p) => sh.lineTo(p[0], p[1]));
  const g = new ExtrudeGeometry(sh, { depth: thick, bevelEnabled: true, bevelThickness: thick * 0.4, bevelSize: thick * 0.4, bevelSegments: 1, steps: 1 });
  g.translate(0, 0, -thick / 2);
  g.rotateX(-Math.PI / 2);
  return g;
}

function rostrumGeometry(): BufferGeometry {
  const L = 0.4;
  const up: [number, number][] = [], lo: [number, number][] = [];
  for (let k = 0; k <= 16; k++) {
    const s = k / 16, x = -L * s;
    const lift = 0.1 * s * s;
    const tooth = s > 0.08 && s < 0.85 ? (k % 3 === 0 ? 0.022 * (1 - s) : 0) : 0;
    up.push([x, 0.05 * (1 - s) + 0.008 + lift + tooth]);
    lo.push([x, -0.025 * (1 - s) + lift - 0.004 - (s > 0.2 && s < 0.7 && k % 5 === 0 ? 0.014 : 0)]);
  }
  const sh = new Shape();
  sh.moveTo(up[0][0], up[0][1]);
  up.forEach((p) => sh.lineTo(p[0], p[1]));
  lo.reverse().forEach((p) => sh.lineTo(p[0], p[1]));
  const g = new ExtrudeGeometry(sh, { depth: 0.016, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1 });
  g.translate(0, 0, -0.008);
  return g;
}

function ellipsoid(rx: number, ry: number, rz: number, w = 14, h = 10): BufferGeometry {
  const g = new SphereGeometry(1, w, h);
  g.scale(rx, ry, rz);
  return g;
}

// ------------------------------------------------------------------ eklem zincirleri

interface Chain { root: Group; links: Group[]; restYaw: number[]; restPitch: number[]; phase: number; amp: number }

function makeChain(parent: Object3D, mat: Material, lens: number[] | number, n: number, r0: number, r1: number, restYaw: (k: number) => number, restPitch: (k: number) => number, joints = false): Chain {
  const root = new Group();
  root.rotation.order = 'YXZ';
  parent.add(root);
  const links: Group[] = [];
  let p: Object3D = root;
  const L = (k: number) => (typeof lens === 'number' ? lens : lens[k]);
  for (let k = 0; k < n; k++) {
    const g = new Group();
    g.rotation.order = 'YXZ';
    const linkLen = L(k);
    if (k > 0) g.position.x = L(k - 1);
    p.add(g);
    const a = r0 + (r1 - r0) * (k / n), b = r0 + (r1 - r0) * ((k + 1) / n);
    const geo = new CylinderGeometry(b, a, linkLen * 1.05, 7, 1);
    geo.rotateZ(-Math.PI / 2);
    geo.translate(linkLen / 2, 0, 0);
    g.add(new Mesh(geo, mat));
    if (joints) g.add(new Mesh(new SphereGeometry(a * 1.15, 8, 6), mat));
    links.push(g);
    p = g;
  }
  return { root, links, restYaw: links.map((_, k) => restYaw(k)), restPitch: links.map((_, k) => restPitch(k)), phase: 0, amp: 1 };
}

// ------------------------------------------------------------------ iskelet (kur)

interface Candidate { obj: Object3D; pos: Vec3Like; normal: Vec3Like | null }
type Vec3Like = [number, number, number];

interface Built {
  root: Group;
  bounds: Sphere;
  center: Vector3;
  textures: Texture[];
  occluders: Mesh[];
  anchors: Map<PartId, Candidate[]>;
  eggs: Group;
  pose: (t: number, amp: number) => void;
}

function tex(c: HTMLCanvasElement, list: Texture[]): Texture {
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  t.flipY = false;
  list.push(t);
  return t;
}

export function buildShrimp(sex: Sex, variantId: string, texW: number): Built {
  const v: Variant = variantById(variantId);
  const B = BODY[sex];
  const textures: Texture[] = [];
  const root = new Group();
  root.scale.setScalar(B.scale);
  const body = new Group();
  root.add(body);
  const anchors = new Map<PartId, Candidate[]>();
  const anchor = (id: PartId, obj: Object3D, pos: Vec3Like, normal: Vec3Like | null = null) => {
    const l = anchors.get(id) ?? [];
    l.push({ obj, pos, normal });
    anchors.set(id, l);
  };
  const occluders: Mesh[] = [];

  const shine = v.parlak;
  const shellMat = (map: Texture) => new MeshPhysicalMaterial({ map, roughness: 0.62 - 0.35 * shine, metalness: 0, clearcoat: 0.15 + 0.6 * shine, clearcoatRoughness: 0.32, envMapIntensity: 0.45 });
  const carTex = tex(paintShell(v, sex, 'carapace', texW), textures);
  const abdTex = tex(paintShell(v, sex, 'abdomen', texW), textures);
  const clearTex = v.rili ? tex(paintShell(v, sex, 'clear', texW), textures) : abdTex;
  const carMat = shellMat(carTex), abdMat = shellMat(abdTex), clrMat = shellMat(clearTex);
  const tone = (hex: string) => new Color(...sexTone(hexToRgb(hex), B.colour));
  const limbColor = tone(v.renk.bacak);
  const limbMat = new MeshStandardMaterial({ color: limbColor, roughness: 0.5, metalness: 0.0, envMapIntensity: 0.6 });
  const thinMat = new MeshStandardMaterial({ color: limbColor.clone().lerp(new Color('#ffffff'), 0.25), roughness: 0.45 });
  const leafColor = v.stil === 'rili' ? new Color(v.rili!.ton) : tone(v.renk.yan).lerp(tone(v.renk.karin), 0.35);
  const leafMat = new MeshPhysicalMaterial({ color: leafColor, roughness: 0.4, clearcoat: 0.4, side: 2 });
  const eyeMat = new MeshPhysicalMaterial({ color: new Color(v.goz), roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.2 });
  const stalkMat = new MeshStandardMaterial({ color: tone(v.renk.karin).lerp(new Color('#ffffff'), 0.2), roughness: 0.5 });
  const mandMat = new MeshStandardMaterial({ color: new Color('#6a5640'), roughness: 0.5 });

  // ---- karapaks
  const carapace = new Mesh(shellGeometry((u) => carapaceRing(sex, u), B.flare * 0.3, 0, 1, 0, 24, 28, { front: true, rear: true }), carMat);
  body.add(carapace);
  occluders.push(carapace);

  // rostrum
  const rostrum = new Mesh(rostrumGeometry(), new MeshPhysicalMaterial({ color: tone(v.renk.yan).lerp(tone(v.renk.karin), 0.45), roughness: 0.35, clearcoat: 0.5 }));
  rostrum.position.set(CARAPACE.x0 + 0.1, 0.075, 0);
  rostrum.rotation.z = 0.12;
  rostrum.scale.set(1.25, 1.2, 1);
  body.add(rostrum);
  anchor('rostrum', rostrum, [-0.22, 0.04, 0.012], [0, 0, 1]);
  anchor('rostrum', rostrum, [-0.22, 0.04, -0.012], [0, 0, -1]);
  anchor('karapaks', carapace, [0.0, carapaceRing(sex, 0.5).ry * 0.98, 0], [0, 1, 0]);
  anchor('karapaks', carapace, [0.0, 0.03, carapaceRing(sex, 0.5).rz * 1.0], [0, 0, 1]);
  anchor('karapaks', carapace, [0.0, 0.03, -carapaceRing(sex, 0.5).rz * 1.0], [0, 0, -1]);
  if (sex === 'disi') {
    anchor('eyer', carapace, [0.17, carapaceRing(sex, 0.7).ry * 0.97, 0], [0, 1, 0]);
  }

  // ---- gözler
  for (const s of [1, -1] as const) {
    const eg = new Group();
    eg.position.set(CARAPACE.x0 + 0.075, 0.0, s * 0.055);
    eg.rotation.order = 'YXZ';
    eg.rotation.y = s * (-0.62) + (s > 0 ? 0 : 0); // dışa ve öne
    eg.rotation.y = s > 0 ? -2.3 : 2.3; // yerel +x: öne-dışa
    body.add(eg);
    const stalk = new Mesh(new CylinderGeometry(0.03, 0.036, 0.11, 8).rotateZ(-Math.PI / 2).translate(0.055, 0, 0), stalkMat);
    eg.add(stalk);
    const ball = new Mesh(new SphereGeometry(0.064, 20, 14), eyeMat);
    ball.scale.set(0.95, 1.05, 1.0);
    ball.position.x = 0.12;
    eg.add(ball);
    anchor('goz', ball, [0, 0.04, 0.02], [s * 0.2, 0.7, s * 0.7]);
  }

  // ---- antenal pul (skafoserit) ve antenler
  for (const s of [1, -1] as const) {
    const sc = new Mesh(ellipsoid(0.13, 0.008, 0.04), leafMat);
    sc.position.set(CARAPACE.x0 - 0.06, -0.035, s * 0.13);
    sc.rotation.y = -s * 0.4;
    body.add(sc);
  }
  const antennae: Chain[] = [];
  for (const s of [1, -1] as const) {
    // 2. anten: uzun, ince, öne-dışa uzanıp hafif aşağı sarkar
    const ant = makeChain(body, thinMat, 0.1, 16, 0.0125, 0.003, (k) => s * (k < 2 ? 0.02 : 0.06 + 0.02 * Math.sin(k)), (k) => (k < 3 ? 0.05 : -0.05), false);
    ant.root.position.set(CARAPACE.x0 + 0.05, -0.03, s * 0.1);
    ant.root.rotation.y = Math.atan2(-s * 0.55, -0.84);
    ant.root.rotation.z = 0.08;
    ant.phase = s * 0.9;
    antennae.push(ant);
    anchor('anten', ant.links[5], [0.05, 0, 0], null);
    // 1. anten (antenül): kısa gövde ve iki ince kamçı
    for (const [fi, sp] of [[0, 0.2], [1, -0.16]] as const) {
      const fl = makeChain(body, thinMat, 0.065, 11, 0.009, 0.0025, (k) => s * (fi ? -0.02 : 0.03) * (k > 3 ? 1 : 0.2), (k) => (k < 2 ? 0.05 : -0.045), false);
      fl.root.position.set(CARAPACE.x0 + 0.02, 0.05, s * 0.05);
      fl.root.rotation.y = Math.atan2(-s * (0.28 + sp * s), -0.96);
      fl.root.rotation.z = 0.42;
      fl.phase = s * 0.6 + fi * 1.6;
      fl.amp = 0.75;
      antennae.push(fl);
      if (fi === 0) anchor('antenul', fl.links[4], [0.03, 0.0, 0], null);
    }
  }

  // ---- ağız parçaları
  const mouth = new Group();
  mouth.position.set(CARAPACE.x0 + 0.2, -0.17, 0);
  body.add(mouth);
  const maxis: Chain[] = [];
  for (const s of [1, -1] as const) {
    const md = new Mesh(new SphereGeometry(0.03, 10, 8), mandMat);
    md.scale.set(1.2, 0.9, 0.8);
    md.position.set(-0.04, -0.01, s * 0.032);
    mouth.add(md);
    for (const [k, len] of [[0, 0.05], [1, 0.06]] as const) {
      const ch = makeChain(mouth, limbMat, len * 0.5, 3, 0.012, 0.006, () => 0.0, () => -0.35, false);
      ch.root.position.set(-0.06 - k * 0.04, -0.02, s * (0.04 + k * 0.014));
      ch.root.rotation.y = s * (-1.3 + k * 0.4) + (s > 0 ? Math.PI : 0) * 0;
      ch.root.rotation.y = Math.atan2(-s * 0.35, -1);
      ch.phase = s + k;
      ch.amp = 0.6;
      maxis.push(ch);
    }
  }
  anchor('agiz', mouth, [-0.04, -0.045, 0], [-0.25, -1, 0]);

  // ---- yürüme bacakları
  const legs: { chain: Chain; i: number; side: number; fingers: Group[] }[] = [];
  LEGS.forEach((spec, i) => {
    for (const s of [1, -1] as const) {
      const n = spec.links.length;
      const lg = new Group();
      lg.position.set(spec.x, LEG_Y, s * LEG_Z);
      body.add(lg);
      const ch = makeChain(lg, limbMat, spec.links, n, 0.02, 0.009, () => 0, (k) => spec.pitch[k], true);
      // bağlantı uzunlukları değişken: her halkanın uzunluğu spec.links[k]
      ch.root.rotation.y = -s * (Math.PI / 2 + spec.fwd);
      const fingers: Group[] = [];
      const last = ch.links[n - 1];
      if (spec.chela) {
        const tipX = spec.links[n - 1];
        const bulb = new Mesh(ellipsoid(0.04, 0.024, 0.022), limbMat);
        bulb.position.set(tipX - 0.005, 0, 0);
        last.add(bulb);
        for (const f of [1, -1]) {
          const fg = new Group();
          fg.position.set(tipX + 0.015, 0, 0);
          const finger = new Mesh(new CylinderGeometry(0.002, 0.009, 0.05, 6).rotateZ(-Math.PI / 2).translate(0.025, 0, 0), limbMat);
          fg.add(finger);
          fg.rotation.z = f * 0.1;
          last.add(fg);
          fingers.push(fg);
        }
      } else {
        const claw = new Mesh(new CylinderGeometry(0.001, 0.007, 0.04, 6).rotateZ(-Math.PI / 2).translate(0.02, 0, 0), limbMat);
        claw.position.x = spec.links[n - 1];
        last.add(claw);
      }
      ch.phase = i * 0.9 + (s > 0 ? 0 : 1.4);
      legs.push({ chain: ch, i, side: s, fingers });
      if (i === 2) anchor('yuruyen-bacak', ch.links[1], [0.085, 0.0, 0], null);
      if (i === 1) anchor('kiskac', last, [0.1, 0.0, 0.0], null);
    }
  });

  // ---- karın halkaları
  const segGroups: Group[] = [];
  const segMeshes: Mesh[] = [];
  let parent: Object3D = body;
  for (let i = 0; i < SEG.count; i++) {
    const g = new Group();
    g.position.set(i === 0 ? PLEON_PIVOT[0] : SEG.len[i - 1], i === 0 ? PLEON_PIVOT[1] : 0, 0);
    parent.add(g);
    const clear = !!v.rili && v.rili.acik.includes(i);
    const geo = shellGeometry((u) => segRing(sex, i, u), B.flare, -0.12, 1.02, SEG.len[i], 12, 26, { rear: i === SEG.count - 1 });
    const m = new Mesh(geo, clear ? clrMat : abdMat);
    g.add(m);
    segGroups.push(g);
    segMeshes.push(m);
    occluders.push(m);
    parent = g;
  }
  anchor('karin', segMeshes[2], [SEG.len[2] * 0.5, segRing(sex, 2, 0.5).ry * 1.0, 0], [0, 1, 0]);
  anchor('karin', segMeshes[2], [SEG.len[2] * 0.5, -0.02, segRing(sex, 2, 0.5).rz * 1.02], [0, 0, 1]);
  anchor('karin', segMeshes[2], [SEG.len[2] * 0.5, -0.02, -segRing(sex, 2, 0.5).rz * 1.02], [0, 0, -1]);

  // ---- yüzme bacakları
  const pleo: { g: Group; i: number }[] = [];
  for (let i = 0; i < 5; i++) {
    for (const s of [1, -1] as const) {
      const g = new Group();
      const r = segRing(sex, i, 0.5);
      g.position.set(SEG.len[i] * 0.52, -r.ry * 0.8, s * r.rz * 0.5);
      segGroups[i].add(g);
      const stem = new Mesh(new CylinderGeometry(0.014, 0.018, 0.05, 6).translate(0, -0.025, 0), limbMat);
      g.add(stem);
      const k = sex === 'disi' ? 1.5 : 1.35;
      for (const [zo, rot] of [[0.022, 0.32], [-0.022, -0.32]] as const) {
        const rg = new Group();
        rg.position.y = -0.05;
        rg.rotation.x = rot * s;
        const paddle = new Mesh(ellipsoid(0.011, 0.065 * k, 0.026), limbMat);
        paddle.position.set(0, -0.06 * k, zo * 0.4);
        rg.add(paddle);
        g.add(rg);
      }
      if (sex === 'erkek' && i === 1) {
        const app = new Mesh(new CylinderGeometry(0.002, 0.008, 0.05, 6).translate(0, -0.025, 0), mandMat);
        app.position.set(0.012, -0.1, 0);
        g.add(app);
        anchor('appendix', g, [0.012, -0.14, 0], null);
      }
      pleo.push({ g, i });
      if (i === 2) anchor('yuzme-bacagi', g, [0, -0.1, 0], null);
    }
  }

  // ---- yumurtalar (dişi)
  const eggs = new Group();
  const eggMeshes: InstancedMesh[] = [];
  if (sex === 'disi') {
    const eggGeo = new SphereGeometry(1, 10, 8);
    const eggMat = new MeshStandardMaterial({ color: new Color(v.yumurta ?? '#c9b53a'), roughness: 0.35 });
    const tmp = new Matrix4();
    for (const i of [1, 2, 3, 4]) {
      const list = eggPositions(i, 11);
      const im = new InstancedMesh(eggGeo, eggMat, list.length);
      list.forEach((e, k) => {
        const q = new Quaternion();
        tmp.compose(new Vector3(...e.p).setY(e.p[1] * 1.0), q, new Vector3(e.r, e.r, e.r));
        im.setMatrixAt(k, tmp);
        im.setColorAt(k, new Color().setHSL(0.14 + (k % 3) * 0.015, 0.62, 0.5 + (k % 4) * 0.025));
      });
      im.instanceMatrix.needsUpdate = true;
      segGroups[i].add(im);
      eggMeshes.push(im);
    }
    anchor('yumurta', segGroups[2], [SEG.len[2] * 0.5, -SEG.ry[2] * 0.95 - 0.04, 0.16], [0, -0.45, 1]);
    anchor('yumurta', segGroups[2], [SEG.len[2] * 0.5, -SEG.ry[2] * 0.95 - 0.04, -0.16], [0, -0.45, -1]);
    anchor('yumurta', segGroups[2], [SEG.len[2] * 0.5, -SEG.ry[2] * 0.95 - 0.07, 0.0], [0, -1, 0]);
    eggs.userData.meshes = eggMeshes;
  }

  // ---- telson ve uropodlar
  const last = segGroups[SEG.count - 1];
  const telson = new Group();
  telson.position.x = SEG.len[SEG.count - 1] - 0.02;
  last.add(telson);
  const telMesh = new Mesh(leafGeometry(TELSON.len + 0.02, TELSON.halfWidth, 0.026, 0.02, 1), leafMat);
  telMesh.scale.y = 0.9;
  telson.add(telMesh);
  anchor('telson', telson, [0.12, 0.025, 0], [0, 1, 0]);
  const uropods: Group[] = [];
  for (const s of [1, -1] as const) {
    const ug = new Group();
    ug.position.set(SEG.len[SEG.count - 1] - 0.03, 0, s * 0.03);
    ug.rotation.order = 'YXZ';
    last.add(ug);
    for (const [spread, scl, tipLen] of [[0.0, 1.0, UROPOD.len], [0.0, 0.85, UROPOD.len * 0.92]] as const) {
      const leaf = new Mesh(leafGeometry(tipLen, UROPOD.halfWidth * scl, 0.012, 0.0), leafMat);
      leaf.rotation.y = s * (spread === 0 && scl === 1 ? -0.1 : 0.12);
      leaf.position.z = s * (scl === 1 ? 0.05 : -0.005);
      leaf.position.y = scl === 1 ? 0 : -0.006;
      ug.add(leaf);
    }
    uropods.push(ug);
    anchor('uropod', ug, [0.2, 0.012, s * 0.07], [0, 1, 0]);
  }

  // ---- poz
  const wobble = ANIM;
  const pose = (t: number, amp: number) => {
    for (let i = 0; i < SEG.count; i++) {
      const a = jointAngle(i, t, amp);
      segGroups[i].rotation.z = a;
    }
    telson.rotation.z = jointAngle(SEG.count, t, amp) - REST_ANGLES[SEG.count] * 0.5;
    uropods.forEach((u, k) => {
      const s = k === 0 ? 1 : -1;
      u.rotation.z = jointAngle(SEG.count, t, amp) - REST_ANGLES[SEG.count] * 0.5 - 0.02;
      u.rotation.y = s * (-UROPOD.spread - 0.08 * amp * (0.5 + 0.5 * Math.sin(t * 1.3 + k)));
    });
    for (const p of pleo) p.g.rotation.z = pleopodAngle(p.i, t, amp);
    for (const ch of antennae) {
      ch.links.forEach((l, k) => {
        const [yw, pt] = antennaSway(k, ch.links.length, t, amp * ch.amp, ch.phase);
        l.rotation.y = ch.restYaw[k] + yw;
        l.rotation.z = ch.restPitch[k] + pt;
      });
    }
    for (const ch of maxis) {
      ch.links.forEach((l, k) => { l.rotation.z = ch.restPitch[k] + amp * 0.18 * Math.sin(t * 8 + ch.phase + k); });
    }
    for (const L of legs) {
      L.chain.links.forEach((l, k) => {
        l.rotation.z = L.chain.restPitch[k] + amp * 0.07 * Math.sin(t * 2.2 + L.chain.phase + k * 0.6);
        l.rotation.y = amp * 0.03 * Math.sin(t * 1.7 + L.chain.phase);
      });
      L.fingers.forEach((f, k) => { f.rotation.z = (k === 0 ? 1 : -1) * (0.1 + amp * 0.08 * (0.5 + 0.5 * Math.sin(t * 3 + L.chain.phase))); });
    }
    void wobble;
  };
  pose(0, 0);

  root.updateMatrixWorld(true);
  const box = new Box3();
  for (const m of [carapace, ...segMeshes, telson, ...uropods, ...legs.map((l) => l.chain.root)]) box.expandByObject(m);
  box.min.x -= 0.3;
  const bounds = new Sphere();
  box.getBoundingSphere(bounds);
  bounds.radius *= 1.04;
  const center = box.getCenter(new Vector3());
  void Euler;
  return { root, bounds, center, textures, occluders, anchors, eggs, pose };
}

function disposeGroup(g: Object3D, textures: Texture[]) {
  g.traverse((o) => {
    const m = o as Mesh;
    if (m.geometry) m.geometry.dispose();
    const mat = m.material as Material | Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose()); else mat?.dispose();
  });
  textures.forEach((t) => t.dispose());
}

// ------------------------------------------------------------------ görüntüleyici

// Kamera açıları [yatay (theta), düşey (phi)]. Üst ve alt görünümlerde baş yukarıda durur.
const VIEW_ANGLES: Record<ViewId, [number, number]> = {
  yan: [0, Math.PI / 2 - 0.05],
  capraz: [-0.75, 1.0],
  ust: [Math.PI / 2, 0.03],
  alt: [-Math.PI / 2, Math.PI - 0.03],
  on: [-Math.PI / 2, Math.PI / 2 - 0.05],
  arka: [Math.PI / 2, Math.PI / 2 - 0.05],
};

export interface ViewerOptions {
  canvas: HTMLCanvasElement;
  overlay: HTMLElement;
  sex: Sex;
  variant: string;
  reducedMotion: boolean;
  onSelect: (id: PartId | null, fromUser: boolean) => void;
}

export interface Viewer {
  setSex(s: Sex): void;
  setVariant(v: string): void;
  setAutoRotate(on: boolean): void;
  setSwim(on: boolean): void;
  setHotspots(on: boolean): void;
  setBerry(on: boolean): void;
  setView(v: ViewId): void;
  zoom(factor: number): void;
  rotate(dTheta: number, dPhi: number): void;
  reset(): void;
  select(id: PartId | null): void;
  isPartVisible(id: PartId): boolean;
  visibleParts(): PartId[];
  dispose(): void;
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function createViewer(opts: ViewerOptions): Viewer {
  const { canvas, overlay } = opts;
  const small = matchMedia('(max-width: 700px)').matches || navigator.maxTouchPoints > 0;
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.35;
  scene.add(new HemisphereLight(0xdff0ff, 0x3a3326, 0.45));
  scene.add(new AmbientLight(0xffffff, 0.2));
  const key = new DirectionalLight(0xffffff, 1.25);
  key.position.set(2, 6, 3);
  scene.add(key);
  const under = new DirectionalLight(0xffe8c8, 0.8);
  under.position.set(-1, -5, 2);
  scene.add(under);
  const rim = new DirectionalLight(0x9fd8ff, 0.9);
  rim.position.set(-4, 2, -4);
  scene.add(rim);

  const camera = new PerspectiveCamera(30, 1, 0.1, 100);
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;
  controls.enableDamping = !opts.reducedMotion;
  controls.dampingFactor = 0.09;
  controls.rotateSpeed = 0.8;
  controls.autoRotateSpeed = 2.2;

  let sex = opts.sex, variant = opts.variant;
  let built: Built | null = null;
  let swimOn = false, selected: PartId | null = null, hotsOn = true, berryOn = true;
  let amp = 0, time = 0;
  let radius = 3, visible = true, raf = 0, last = 0, disposed = false;
  let tween: { from: [number, number, number]; to: [number, number, number]; t0: number; dur: number } | null = null;
  const texW = small ? 512 : 1024;
  const ray = new Raycaster();

  const hotspots = new Map<PartId, HTMLButtonElement>();
  const shown = new Set<PartId>();
  const rebuildHotspots = () => {
    overlay.textContent = '';
    hotspots.clear();
    shown.clear();
    partsFor(sex).forEach((p, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'v3-hot';
      b.tabIndex = -1; // klavye kullanıcıları için eşdeğer: sayfadaki parça listesi
      b.setAttribute('aria-hidden', 'true');
      b.dataset.part = p.id;
      b.dataset.label = p.ad;
      b.textContent = String(i + 1);
      b.hidden = true;
      b.addEventListener('click', () => { if (hotsOn) opts.onSelect(selected === p.id ? null : p.id, true); });
      overlay.appendChild(b);
      hotspots.set(p.id, b);
    });
    for (const [id, b] of hotspots) b.classList.toggle('on', id === selected);
    overlay.hidden = !hotsOn;
  };

  const spherical = (): [number, number, number] => {
    const o = camera.position.clone().sub(controls.target);
    const r = o.length();
    return [Math.atan2(o.x, o.z), Math.acos(Math.min(1, Math.max(-1, o.y / r))), r];
  };
  const place = (th: number, ph: number, r: number) => {
    const sp = Math.sin(ph);
    camera.position.set(controls.target.x + r * sp * Math.sin(th), controls.target.y + r * Math.cos(ph), controls.target.z + r * sp * Math.cos(th));
    camera.lookAt(controls.target);
  };
  const fitDistance = () => {
    const vf = (camera.fov * Math.PI) / 180;
    const hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
    return (radius * 1.1) / Math.sin(Math.min(vf, hf) / 2);
  };
  const limits = () => { controls.minDistance = fitDistance() * 0.3; controls.maxDistance = fitDistance() * 1.9; };

  const applyBerry = () => {
    const ms = built?.eggs.userData.meshes as Object3D[] | undefined;
    ms?.forEach((m) => { m.visible = berryOn; });
  };

  const load = (first: boolean) => {
    const old = built;
    if (old) { scene.remove(old.root); disposeGroup(old.root, old.textures); }
    built = buildShrimp(sex, variant, texW);
    built.pose(time, amp);
    scene.add(built.root);
    applyBerry();
    radius = built.bounds.radius;
    const prevTarget = controls.target.clone();
    controls.target.copy(built.center);
    if (first) place(...VIEW_ANGLES.capraz, fitDistance() * 0.85);
    else camera.position.add(controls.target.clone().sub(prevTarget));
    limits();
    rebuildHotspots();
    controls.update();
    invalidate();
  };

  const resize = () => {
    const w = canvas.clientWidth || 300, h = canvas.clientHeight || 300;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    limits();
    invalidate();
  };

  const world = new Vector3(), nrm = new Vector3(), toCam = new Vector3(), dir = new Vector3(), tgt = new Vector3(), proj = new Vector3();
  const updateHotspots = () => {
    if (!built) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    shown.clear();
    for (const [id, btn] of hotspots) {
      const cands = built.anchors.get(id);
      let pick: Vector3 | null = null;
      for (const c of cands ?? []) {
        world.set(...c.pos);
        c.obj.localToWorld(world);
        let ok = true;
        const hasN = !!c.normal;
        if (c.normal) {
          nrm.set(...c.normal).transformDirection(c.obj.matrixWorld);
          toCam.copy(camera.position).sub(world).normalize();
          ok = nrm.dot(toCam) > 0.08;
        }
        if (ok) {
          tgt.copy(world);
          if (hasN) tgt.addScaledVector(nrm, 0.05);
          dir.copy(tgt).sub(camera.position);
          const dd = dir.length();
          dir.divideScalar(dd);
          ray.set(camera.position, dir);
          ray.far = dd - 0.012;
          if (ray.intersectObjects(built.occluders, false).length > 0) ok = false;
        }
        if (ok) { pick = world.clone(); break; }
      }
      if (!pick) { btn.hidden = true; continue; }
      proj.copy(pick).project(camera);
      const onScreen = proj.z < 1 && Math.abs(proj.x) < 1.02 && Math.abs(proj.y) < 1.02;
      if (onScreen) shown.add(id);
      btn.hidden = !(hotsOn && onScreen);
      if (!btn.hidden) btn.style.transform = `translate(${((proj.x * 0.5 + 0.5) * w).toFixed(1)}px, ${((-proj.y * 0.5 + 0.5) * h).toFixed(1)}px) translate(-50%, -50%)`;
    }
  };

  const frame = (now: number) => {
    raf = 0;
    if (disposed) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    let busy = false;

    const targetAmp = swimOn ? ANIM.amp : 0;
    const k = 1 - Math.exp(-dt * 4);
    amp += (targetAmp - amp) * k;
    if (swimOn || amp > 0.0015) { time += dt; busy = true; } else amp = 0;
    built?.pose(time, amp);

    if (tween) {
      const p = tween.dur <= 0 ? 1 : Math.min(1, (now - tween.t0) / tween.dur);
      const e = easeInOut(p);
      const f = tween.from, t = tween.to;
      place(f[0] + (t[0] - f[0]) * e, f[1] + (t[1] - f[1]) * e, f[2] + (t[2] - f[2]) * e);
      if (p >= 1) tween = null; else busy = true;
    }
    if (controls.autoRotate) busy = true;
    if (controls.update(dt)) busy = true;

    renderer.render(scene, camera);
    updateHotspots();
    canvas.dataset.frames = String((Number(canvas.dataset.frames) || 0) + 1);
    if (!canvas.parentElement?.hasAttribute('data-ready')) canvas.parentElement?.setAttribute('data-ready', 'true');
    if (busy && visible && !document.hidden) invalidate();
    else last = 0;
  };
  function invalidate() { if (!raf && !disposed && visible && !document.hidden) raf = requestAnimationFrame(frame); }

  controls.addEventListener('change', invalidate);
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  const io = new IntersectionObserver((e) => { visible = e[0]?.isIntersecting ?? true; if (visible) invalidate(); });
  io.observe(canvas);
  const onVis = () => { if (!document.hidden) invalidate(); };
  document.addEventListener('visibilitychange', onVis);
  canvas.addEventListener('webglcontextlost', (e) => e.preventDefault());
  canvas.addEventListener('webglcontextrestored', () => load(false));

  resize();
  load(true);

  const go = (th: number, ph: number, r: number) => {
    const from = spherical();
    let dth = th - from[0];
    dth = Math.atan2(Math.sin(dth), Math.cos(dth));
    tween = { from, to: [from[0] + dth, ph, r], t0: performance.now(), dur: opts.reducedMotion ? 0 : 650 };
    invalidate();
  };

  const api: Viewer = {
    setSex(s) { if (s !== sex) { sex = s; if (selected && !partsFor(sex).some((p) => p.id === selected)) { selected = null; opts.onSelect(null, false); } load(false); } },
    setVariant(v) { if (v !== variant) { variant = v; load(false); } },
    setAutoRotate(on) { controls.autoRotate = on; invalidate(); },
    setSwim(on) { swimOn = on; invalidate(); },
    setHotspots(on) {
      hotsOn = on;
      overlay.hidden = !on;
      if (!on) for (const b of hotspots.values()) b.hidden = true;
      invalidate();
    },
    setBerry(on) { berryOn = on; applyBerry(); invalidate(); },
    setView(v) { const [th, ph] = VIEW_ANGLES[v]; go(th, ph, fitDistance()); },
    zoom(f) { const s = spherical(); const r = Math.min(controls.maxDistance, Math.max(controls.minDistance, s[2] * f)); place(s[0], s[1], r); controls.update(); invalidate(); },
    rotate(dTh, dPh) { const s = spherical(); place(s[0] + dTh, Math.min(Math.PI - 0.03, Math.max(0.03, s[1] + dPh)), s[2]); controls.update(); invalidate(); },
    reset() { go(...VIEW_ANGLES.capraz, fitDistance() * 0.85); },
    select(id) {
      selected = id;
      for (const [pid, b] of hotspots) b.classList.toggle('on', pid === id);
      invalidate();
    },
    isPartVisible(id) { return shown.has(id); },
    visibleParts() { return [...shown]; },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      controls.dispose();
      if (built) disposeGroup(built.root, built.textures);
      envTex.dispose(); pmrem.dispose(); renderer.dispose();
    },
  };
  return api;
}
