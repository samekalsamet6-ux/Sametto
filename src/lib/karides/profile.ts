// Karides hattı profili: aynı eklem zinciri iskeletini (viewer.buildShrimp) farklı bir karides türüne uyarlayan, isteğe bağlı ayarlar.
// Varsayılan profil Neocaridina'dır ve görünümü/davranışı değiştirmez; Amano karidesi (Caridina multidentata) kendi profilini verir.
import type { Object3D, Mesh, Group } from 'three';
import { BODY, type BodyParams, type Sex } from './model';
import { paintShell, type ShellKind } from './texture';
import { partsFor } from './parts';
import { variantById, type Variant } from './variants';

export interface ShrimpAnchorApi {
  anchor: (id: string, obj: Object3D, pos: [number, number, number], normal?: [number, number, number] | null) => void;
  sex: Sex;
  carapace: Mesh;
  segMeshes: Mesh[];
  segGroups: Group[];
}

export interface ShrimpProfile {
  variantById: (id: string) => Variant;
  paintShell: (v: Variant, sex: Sex, kind: ShellKind, W: number) => HTMLCanvasElement;
  /** Bu cinsiyette gösterilen parça kimlikleri (sırayla = numara) */
  partsFor: (sex: Sex) => { id: string; ad: string }[];
  body: Record<Sex, BodyParams>;
  rostrum: { len: number; teethEvery: number; toothH: number; lift: number };
  /** İlk iki bacak çiftinin kıskaç ucunda fırça benzeri kıl demeti çizilir */
  brushChela: boolean;
  /** Profile özgü ek bağlantı noktaları (ör. yan benek sırası) */
  extraAnchors?: (api: ShrimpAnchorApi) => void;
}

export const NEOCARIDINA_PROFILE: ShrimpProfile = {
  variantById,
  paintShell,
  partsFor,
  body: BODY,
  rostrum: { len: 0.4, teethEvery: 3, toothH: 0.022, lift: 0.1 },
  brushChela: false,
};
