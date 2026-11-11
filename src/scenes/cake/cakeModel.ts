import * as THREE from "three";
import {
  cakeColors,
  makeButterflyTexture,
  makeCrossSectionTexture,
  makeLaceTexture,
  makeSideTextures,
  makeTagTexture,
  makeTopTextures,
  makeTwineTexture,
} from "./cakeTextures";

/** Cake radius is the unit of the whole 3D scene. */
export const R = 1;
export const H = 1.3;
export const BOARD_R = 1.12;
export const TABLE_Y = -1.12;
/** The slice that gets cut: from angle SLICE_A0 to SLICE_A1, measured from the front (+z) towards +x. */
export const SLICE_A0 = (12 * Math.PI) / 180;
export const SLICE_A1 = (58 * Math.PI) / 180;
export const KNIFE_LEN = 1.7;

export type CakeMaterials = ReturnType<typeof makeCakeMaterials>;

export function makeCakeMaterials() {
  const side = makeSideTextures();
  const top = makeTopTextures();
  const cross = makeCrossSectionTexture(H / R);
  const sideMat = new THREE.MeshPhysicalMaterial({
    map: side.map,
    bumpMap: side.bump,
    bumpScale: 1.4,
    roughness: 0.62,
    sheen: 0.6,
    sheenColor: new THREE.Color("#ffd2ea"),
    sheenRoughness: 0.5,
    side: THREE.DoubleSide,
  });
  const topMat = new THREE.MeshPhysicalMaterial({
    map: top.map,
    bumpMap: top.bump,
    bumpScale: 2.6,
    roughness: 0.58,
    sheen: 0.6,
    sheenColor: new THREE.Color("#ffd2ea"),
    sheenRoughness: 0.5,
    side: THREE.DoubleSide,
  });
  const crossMat = new THREE.MeshStandardMaterial({ map: cross, roughness: 0.85, side: THREE.DoubleSide });
  const baseMat = new THREE.MeshStandardMaterial({ color: cakeColors.lavender, roughness: 0.7, side: THREE.DoubleSide });
  const pearlMat = new THREE.MeshPhysicalMaterial({ color: cakeColors.pearl, roughness: 0.22, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.15 });
  const goldMat = new THREE.MeshStandardMaterial({ color: cakeColors.gold, metalness: 1, roughness: 0.22 });
  return { sideMat, topMat, crossMat, baseMat, pearlMat, goldMat, textures: [side.map, side.bump, top.map, top.bump, cross] };
}

/** A pie-shaped part of the cake with its own icing walls, top and cut faces. */
export function buildSector(a0: number, a1: number, m: CakeMaterials): THREE.Group {
  const g = new THREE.Group();
  const len = a1 - a0;
  const n = Math.max(2, Math.ceil((len / (Math.PI * 2)) * 128));

  // side wall
  {
    const pos: number[] = [];
    const nor: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + (len * i) / n;
      const s = Math.sin(a);
      const c = Math.cos(a);
      pos.push(R * s, 0, R * c, R * s, H, R * c);
      nor.push(s, 0, c, s, 0, c);
      const u = a / (Math.PI * 2);
      uv.push(u, 0, u, 1);
      if (i < n) idx.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    const mesh = new THREE.Mesh(geo, m.sideMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
  }

  // top and bottom (fans)
  for (const top of [true, false]) {
    const y = top ? H : 0;
    const pos: number[] = [0, y, 0];
    const uv: number[] = [0.5, 0.5];
    const nor: number[] = [0, top ? 1 : -1, 0];
    const idx: number[] = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + (len * i) / n;
      const x = R * Math.sin(a);
      const z = R * Math.cos(a);
      pos.push(x, y, z);
      uv.push(0.5 + x / (2 * R), 0.5 - z / (2 * R));
      nor.push(0, top ? 1 : -1, 0);
      if (i < n) idx.push(0, i + 2, i + 1);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    const mesh = new THREE.Mesh(geo, top ? m.topMat : m.baseMat);
    mesh.castShadow = top;
    mesh.receiveShadow = true;
    g.add(mesh);
  }

  // the two cut faces, showing sponge and cream layers
  for (const [a, sign] of [
    [a0, -1],
    [a1, 1],
  ] as const) {
    const s = Math.sin(a);
    const c = Math.cos(a);
    const t = new THREE.Vector3(c, 0, -s).multiplyScalar(sign);
    const pos = [0, 0, 0, R * s, 0, R * c, R * s, H, R * c, 0, H, 0];
    const uv = [0, 0, 1, 0, 1, 1, 0, 1];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute([t.x, 0, t.z, t.x, 0, t.z, t.x, 0, t.z, t.x, 0, t.z], 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    const mesh = new THREE.Mesh(geo, m.crossMat);
    mesh.receiveShadow = true;
    g.add(mesh);
  }
  return g;
}

/** A paper butterfly topper: two half-wings hinged on the body so they can flap. */
export function buildButterfly(kind: "lavender" | "pink", size: number) {
  const tex = makeButterflyTexture(kind);
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.35,
    roughness: 0.45,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });
  const root = new THREE.Group();
  const w = size;
  const h = size * (360 / 512);
  const wings: THREE.Mesh[] = [];
  for (const side of [-1, 1]) {
    const geo = new THREE.PlaneGeometry(w / 2, h);
    // map only this half of the texture, and move the inner edge to x = 0 so the wing hinges on the body
    const uv = geo.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) {
      const u = uv.getX(i);
      uv.setX(i, side < 0 ? u * 0.5 : 0.5 + u * 0.5);
    }
    geo.translate((side * w) / 4, 0, 0);
    const wing = new THREE.Mesh(geo, mat);
    wing.castShadow = true;
    const hinge = new THREE.Group();
    hinge.add(wing);
    hinge.userData.side = side;
    root.add(hinge);
    wings.push(wing);
  }
  const hinges = root.children as THREE.Group[];
  return { root, hinges, tex, mat };
}

export function buildWavyCandle(goldMat: THREE.Material, phase: number) {
  const pts: THREE.Vector3[] = [];
  const height = 1.35;
  for (let i = 0; i <= 28; i++) {
    const t = i / 28;
    pts.push(new THREE.Vector3(Math.sin(t * Math.PI * 3 + phase) * 0.05 * (0.3 + t), t * height, Math.cos(t * Math.PI * 2 + phase) * 0.012));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(curve, 96, 0.022, 10, false);
  const mesh = new THREE.Mesh(geo, goldMat);
  mesh.castShadow = true;
  const tip = pts[pts.length - 1].clone();
  return { mesh, tip, height };
}

export function buildKnife() {
  const root = new THREE.Group(); // position
  const yaw = new THREE.Group();
  const pitch = new THREE.Group();
  const model = new THREE.Group(); // roll: -90 deg = lying flat, 0 = blade upright
  root.add(yaw);
  yaw.add(pitch);
  pitch.add(model);

  const steel = new THREE.MeshStandardMaterial({ color: "#e6e8ee", metalness: 1, roughness: 0.16 });
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0, -0.105);
  bladeShape.lineTo(1.46, -0.085);
  bladeShape.quadraticCurveTo(1.74, -0.03, 1.7, 0.05);
  bladeShape.quadraticCurveTo(1.64, 0.105, 1.5, 0.105);
  bladeShape.lineTo(0, 0.105);
  bladeShape.closePath();
  const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, { depth: 0.012, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 1 });
  bladeGeo.translate(0, 0, -0.006);
  const blade = new THREE.Mesh(bladeGeo, steel);
  blade.castShadow = true;
  model.add(blade);

  const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.082, 0.1, 20), steel);
  ferrule.rotation.z = Math.PI / 2;
  ferrule.position.x = -0.02;
  ferrule.castShadow = true;
  model.add(ferrule);

  const twine = makeTwineTexture();
  const twineMat = new THREE.MeshStandardMaterial({ map: twine, roughness: 0.95 });
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.86, 24), twineMat);
  handle.rotation.z = Math.PI / 2;
  handle.position.x = -0.5;
  handle.castShadow = true;
  model.add(handle);
  const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.08, 20, 14), twineMat);
  pommel.position.x = -0.94;
  model.add(pommel);

  const lace = makeLaceTexture();
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0775, 0.0775, 0.2, 24, 1, true),
    new THREE.MeshStandardMaterial({ map: lace, roughness: 0.9, side: THREE.DoubleSide }),
  );
  band.rotation.z = Math.PI / 2;
  band.position.x = -0.5;
  model.add(band);

  // pink satin ribbon bow tied below the blade
  const ribbonMat = new THREE.MeshPhysicalMaterial({ color: "#f27fa9", roughness: 0.32, sheen: 1, sheenColor: new THREE.Color("#ffc4dc"), side: THREE.DoubleSide });
  const bow = new THREE.Group();
  bow.position.set(-0.17, 0, 0.075);
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), ribbonMat);
  knot.scale.set(1, 1, 0.8);
  bow.add(knot);
  for (const s of [-1, 1]) {
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.024, 10, 28), ribbonMat);
    loop.scale.set(1.2, 0.8, 0.5);
    loop.position.set(0, s * 0.1, 0);
    loop.rotation.z = Math.PI / 2;
    loop.rotation.y = s * 0.2;
    bow.add(loop);
  }
  const tails: THREE.Mesh[] = [];
  for (const s of [-1, 1]) {
    const geo = new THREE.PlaneGeometry(0.075, 0.5, 1, 14);
    const p = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      p.setZ(i, Math.sin((y + 0.25) * 5) * 0.025);
    }
    geo.translate(0, -0.25, 0);
    const tail = new THREE.Mesh(geo, ribbonMat);
    tail.position.set(0, 0, 0.01);
    tail.rotation.z = s * 0.28;
    tail.castShadow = true;
    bow.add(tail);
    tails.push(tail);
  }
  model.add(bow);

  // wooden heart tag hung on a twine loop
  const heartShape = new THREE.Shape();
  heartShape.moveTo(0, -0.07);
  heartShape.bezierCurveTo(-0.12, 0.02, -0.07, 0.1, 0, 0.045);
  heartShape.bezierCurveTo(0.07, 0.1, 0.12, 0.02, 0, -0.07);
  const heartGeo = new THREE.ExtrudeGeometry(heartShape, { depth: 0.014, bevelEnabled: false });
  const tagTex = makeTagTexture();
  const heartMat = new THREE.MeshStandardMaterial({ color: "#e4c4a0", roughness: 0.8 });
  const tag = new THREE.Mesh(heartGeo, heartMat);
  tag.position.set(-0.7, 0.0, 0.1);
  tag.scale.setScalar(1.25);
  tag.castShadow = true;
  model.add(tag);
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.006, 6, 16), twineMat);
  loop.position.set(-0.7, 0.1, 0.105);
  model.add(loop);

  // invisible, generous hit area so touch screens can grab the knife easily
  const hit = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.7, 0.7), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.x = 0.35;
  model.add(hit);

  const disposables = [bladeGeo, heartGeo, twine, lace, tagTex, twineMat, ribbonMat, heartMat, steel];
  return { root, yaw, pitch, model, tails, hit, disposables };
}

export function buildPlate() {
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0, 0.0),
    new THREE.Vector2(0.58, 0.0),
    new THREE.Vector2(0.62, 0.012),
    new THREE.Vector2(0.78, 0.07),
    new THREE.Vector2(0.8, 0.085),
    new THREE.Vector2(0.78, 0.087),
    new THREE.Vector2(0.62, 0.03),
    new THREE.Vector2(0.0, 0.025),
  ];
  const geo = new THREE.LatheGeometry(pts, 64);
  const mat = new THREE.MeshPhysicalMaterial({ color: "#fffaf6", roughness: 0.18, clearcoat: 1, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.79, 0.006, 6, 64), new THREE.MeshStandardMaterial({ color: cakeColors.gold, metalness: 1, roughness: 0.25 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.086;
  const g = new THREE.Group();
  g.add(mesh, rim);
  return { group: g, geo, mat, rim };
}
