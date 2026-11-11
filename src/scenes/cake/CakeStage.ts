import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { seeded } from "@/lib/random";
import {
  BOARD_R,
  H,
  KNIFE_LEN,
  R,
  SLICE_A0,
  SLICE_A1,
  TABLE_Y,
  buildButterfly,
  buildKnife,
  buildPlate,
  buildSector,
  buildWavyCandle,
  makeCakeMaterials,
} from "./cakeModel";
import { cakeColors, makeFlameTexture, makeGlowTexture, makeShadowTexture, makeSparkTexture, makeTopperTexture } from "./cakeTextures";

/** Where the cake stand is inside party-table.jpg (1024 x 675 source pixels) and how big a cake radius is there. */
const IMG_W = 1024;
const IMG_H = 675;
const IMG_AX = 497;
const IMG_AY = 480;
const IMG_R = 84;

const TAU = Math.PI * 2;
const D2R = Math.PI / 180;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

export type StageEvent = "revealed" | "candlesLit" | "ready" | "cutStart" | "firstCut" | "secondCut" | "sliceFree" | "done";

export type StageOptions = {
  canvas: HTMLCanvasElement;
  bgEl: HTMLElement;
  hintEl: HTMLElement;
  reducedMotion: boolean;
  onEvent: (e: StageEvent) => void;
  onKnifeHover: (hover: boolean) => void;
};

type Tween = { elapsed: number; dur: number; ease: (t: number) => number; fn: (v: number) => void; done: () => void };
type Pose = { x: number; y: number; z: number; yaw: number; pitch: number; roll: number };

type Butterfly = {
  root: THREE.Group;
  hinges: THREE.Group[];
  final: THREE.Vector3;
  start: THREE.Vector3;
  delay: number;
  phase: number;
  base: number;
};

type PearlSet = { mesh: THREE.InstancedMesh; items: { p: THREE.Vector3; s: number; r: number }[] };

export class CakeStage {
  private o: StageOptions;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100);
  private raf = 0;
  private last = 0;
  private time = 0;
  private disposed = false;
  private visible = false;
  private speed: number;
  private tweens: Tween[] = [];
  private w = 1;
  private h = 1;

  // layout / view
  private base = { ax: 0, ay: 0, ppu: 80, left: 0, top: 0, scale: 1 };
  private focusTarget = { ax: 0, ay: 0, k: 1.4 };
  private focus = 0;

  // scene objects
  private cake = new THREE.Group();
  private rest!: THREE.Group;
  private slice!: THREE.Group;
  private board = new THREE.Group();
  private butterflies: Butterfly[] = [];
  private pearlSets: PearlSet[] = [];
  private candles: { group: THREE.Group; tip: THREE.Vector3; flame: THREE.Sprite; glow: THREE.Sprite; light: THREE.PointLight; lit: number; seed: number }[] = [];
  private topper = new THREE.Group();
  private slits: THREE.Mesh[] = [];
  private knife = buildKnife();
  private ks: Pose = { x: 1.95, y: TABLE_Y + 0.08, z: 1.55, yaw: 2.45, pitch: 0, roll: -Math.PI / 2 };
  private knifeRest: Pose;
  private knifeBob = true;
  private plate = buildPlate();
  private discoLights: THREE.PointLight[] = [];
  private discoOn = 0;
  private sparks!: { points: THREE.Points; pos: Float32Array; col: Float32Array; vel: Float32Array; life: Float32Array; max: Float32Array; tint: Float32Array };
  private disposables: { dispose: () => void }[] = [];
  private raycaster = new THREE.Raycaster();
  private ready = false;
  private cutting = false;
  private hover = false;

  private constructorDone: Promise<void>;
  private mats = makeCakeMaterials();

  constructor(o: StageOptions) {
    this.o = o;
    this.speed = o.reducedMotion ? 0.45 : 1;
    this.knifeRest = { ...this.ks };
    this.renderer = new THREE.WebGLRenderer({ canvas: o.canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04);
    this.scene.environment = env.texture;
    this.scene.environmentIntensity = 0.5;
    this.disposables.push(env, pmrem);

    this.buildLights();
    this.buildTableObjects();
    this.constructorDone = this.buildCake();

    o.canvas.addEventListener("pointermove", this.onPointerMove);
    o.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.raf = requestAnimationFrame(this.frame);
  }

  /** Resolves once the textures (including the topper font) are ready, so the reveal never shows half-built parts. */
  whenBuilt() {
    return this.constructorDone;
  }

  // ---------- setup ----------

  private buildLights() {
    const hemi = new THREE.HemisphereLight(0xfff1e8, 0xd7a3bb, 0.55);
    this.scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffefdc, 2.1);
    key.position.set(-3.5, 6, 4.5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    const sc = key.shadow.camera;
    sc.left = -4;
    sc.right = 4;
    sc.top = 5;
    sc.bottom = -4;
    sc.near = 1;
    sc.far = 20;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 5;
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xff9cc9, 1.1);
    rim.position.set(4, 3, -4);
    this.scene.add(rim);
    for (const c of [0xff4fa8, 0x6fd8ff, 0xb48cff]) {
      const l = new THREE.PointLight(c, 0, 9, 1.6);
      this.scene.add(l);
      this.discoLights.push(l);
    }
  }

  private buildTableObjects() {
    // shadow catcher on the table, so the knife and plate sit on the cloth
    const catcher = new THREE.Mesh(new THREE.PlaneGeometry(9, 3), new THREE.ShadowMaterial({ opacity: 0.3 }));
    catcher.rotation.x = -Math.PI / 2;
    catcher.position.set(0, TABLE_Y + 0.002, 2.9);
    catcher.receiveShadow = true;
    this.scene.add(catcher);
    this.disposables.push(catcher.geometry, catcher.material as THREE.Material);

    this.scene.add(this.knife.root);
    this.knife.root.traverse((o) => ((o as THREE.Mesh).isMesh ? ((o as THREE.Mesh).receiveShadow = true) : undefined));

    this.plate.group.position.set(-2.0, TABLE_Y + 0.001, 1.05);
    this.plate.group.scale.setScalar(0.0001);
    this.scene.add(this.plate.group);
    this.disposables.push(this.plate.geo, this.plate.mat);

    this.applyKnife();
  }

  private async buildCake() {
    const m = this.mats;
    this.scene.add(this.cake);
    this.cake.visible = false;

    // board
    const boardMesh = new THREE.Mesh(new THREE.CylinderGeometry(BOARD_R, BOARD_R, 0.05, 72), new THREE.MeshStandardMaterial({ color: "#fffaf7", roughness: 0.35 }));
    boardMesh.position.y = -0.025;
    boardMesh.receiveShadow = true;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(BOARD_R, 0.01, 8, 96), m.goldMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.03;
    this.board.add(boardMesh, ring);
    this.cake.add(this.board);

    const shadowTex = makeShadowTexture();
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    blob.rotation.x = -Math.PI / 2;
    blob.position.y = 0.002;
    this.cake.add(blob);

    // the two halves of the cake
    this.rest = buildSector(SLICE_A1, SLICE_A0 + TAU, m);
    this.slice = buildSector(SLICE_A0, SLICE_A1, m);
    this.cake.add(this.rest, this.slice);

    this.placeDecorations();

    // cut-line marks that appear while the knife presses down
    const slitMat = new THREE.MeshBasicMaterial({ color: "#7d3f66", transparent: true, opacity: 0.85 });
    for (const a of [SLICE_A0, SLICE_A1]) {
      const g = new THREE.Group();
      g.rotation.y = a;
      const topStrip = new THREE.Mesh(new THREE.PlaneGeometry(0.018, R), slitMat);
      topStrip.rotation.x = -Math.PI / 2;
      topStrip.position.set(0, H + 0.003, R / 2);
      const sideStrip = new THREE.Mesh(new THREE.PlaneGeometry(0.018, H), slitMat);
      sideStrip.position.set(0, H / 2, R + 0.004);
      g.add(topStrip, sideStrip);
      g.scale.set(1, 1, 0.0001);
      g.visible = false;
      this.cake.add(g);
      this.slits.push(g as unknown as THREE.Mesh);
    }

    // topper
    const topperTex = await makeTopperTexture();
    if (this.disposed) return;
    const topperMat = new THREE.MeshStandardMaterial({ map: topperTex, transparent: true, alphaTest: 0.4, metalness: 0.7, roughness: 0.3, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.65), topperMat);
    plane.position.y = 0.52 + 0.32;
    plane.castShadow = true;
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.55, 8), m.goldMat);
    stick.position.y = 0.27;
    this.topper.add(plane, stick);
    this.topper.position.set(0.5, H, -0.3);
    this.topper.rotation.y = -0.2;
    this.topper.scale.set(0.0001, 0.0001, 0.0001);
    this.rest.add(this.topper);

    // candles
    const flameTex = makeFlameTexture();
    const glowTex = makeGlowTexture();
    const positions: [number, number, number][] = [
      [-0.12, -0.36, 0],
      [0.1, -0.46, 2.1],
    ];
    for (const [x, z, ph] of positions) {
      const c = buildWavyCandle(m.goldMat, ph);
      const group = new THREE.Group();
      group.add(c.mesh);
      group.position.set(x, H + 3, z);
      const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      flame.center.set(0.5, 0.12);
      flame.scale.set(0.0001, 0.0001, 1);
      flame.position.copy(c.tip).add(new THREE.Vector3(0, 0.03, 0));
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
      glow.scale.set(0.9, 0.9, 1);
      glow.position.copy(flame.position).add(new THREE.Vector3(0, 0.1, 0));
      const light = new THREE.PointLight(0xffb866, 0, 4.5, 1.7);
      light.position.copy(flame.position).add(new THREE.Vector3(0, 0.12, 0));
      group.add(flame, glow, light);
      this.rest.add(group);
      this.candles.push({ group, tip: c.tip, flame, glow, light, lit: 0, seed: ph * 7.3 + 1 });
    }

    // sparkles used for the reveal, the candle lighting and the cut
    const N = 420;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const sparkTex = makeSparkTexture();
    const pm = new THREE.PointsMaterial({ size: 0.11, map: sparkTex, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const points = new THREE.Points(geo, pm);
    points.frustumCulled = false;
    this.scene.add(points);
    this.sparks = { points, pos, col, vel: new Float32Array(N * 3), life: new Float32Array(N), max: new Float32Array(N).fill(1), tint: new Float32Array(N * 3) };
    pos.fill(999);

    this.disposables.push(...this.mats.textures, shadowTex, topperTex, flameTex, glowTex, sparkTex, geo, pm, topperMat);

    // Compile every shader now, behind the video, so the reveal does not stutter.
    this.cake.visible = true;
    this.cake.scale.setScalar(0.0001);
    this.plate.group.scale.setScalar(0.0001);
    this.layout(this.w, this.h);
    this.renderer.compile(this.scene, this.camera);
    this.renderer.render(this.scene, this.camera);
    this.cake.visible = false;
    this.cake.scale.setScalar(1);
  }

  private placeDecorations() {
    const m = this.mats;
    const rand = seeded(21);
    const inSlice = (a: number) => {
      const n = ((a % TAU) + TAU) % TAU;
      return n >= SLICE_A0 && n <= SLICE_A1;
    };
    type Spec = { kind: "lavender" | "pink"; deg: number; y?: number; r?: number; size: number; lean: number; roll: number; top?: boolean };
    const specs: Spec[] = [
      { kind: "lavender", deg: -140, r: 0.6, size: 0.86, lean: -0.1, roll: 0.1, top: true },
      { kind: "pink", deg: 140, r: 0.55, size: 0.8, lean: -0.1, roll: -0.12, top: true },
      { kind: "pink", deg: -80, y: 0.78, size: 0.7, lean: 0.12, roll: 0.35 },
      { kind: "lavender", deg: -14, y: 0.98, size: 0.7, lean: 0.12, roll: -0.1 },
      { kind: "lavender", deg: 86, y: 0.88, size: 0.62, lean: 0.12, roll: -0.3 },
      { kind: "pink", deg: 30, y: 0.34, size: 0.64, lean: 0.12, roll: 0.15 },
    ];
    for (const s of specs) {
      const a = s.deg * D2R;
      const b = buildButterfly(s.kind, s.size);
      const h = s.size * (360 / 512);
      const final = new THREE.Vector3();
      if (s.top) {
        final.set(Math.sin(a) * (s.r ?? 0.5), H + h * 0.4, Math.cos(a) * (s.r ?? 0.5));
        b.root.rotation.set(s.lean, a * 0.15 + (s.deg > 0 ? -0.25 : 0.25), s.roll);
      } else {
        final.set(Math.sin(a) * (R + 0.018), s.y ?? 0.7, Math.cos(a) * (R + 0.018));
        b.root.rotation.set(s.lean, a, s.roll, "YXZ");
      }
      b.root.position.copy(final);
      const out = new THREE.Vector3(Math.sin(a), 0, Math.cos(a)).multiplyScalar(2.2 + rand());
      const start = final.clone().add(out).add(new THREE.Vector3((rand() - 0.5) * 2, 2.2 + rand() * 1.5, 0));
      (inSlice(a) ? this.slice : this.rest).add(b.root);
      this.disposables.push(b.tex, b.mat);
      this.butterflies.push({ root: b.root, hinges: b.hinges, final, start, delay: rand() * 0.35, phase: rand() * 6, base: 0.36 });
      b.root.scale.setScalar(0.0001);
    }

    // pearls: instanced, split between the two halves so the slice carries its own
    const pearlGeo = new THREE.SphereGeometry(1, 12, 10);
    this.disposables.push(pearlGeo);
    const restItems: PearlSet["items"] = [];
    const sliceItems: PearlSet["items"] = [];
    const push = (p: THREE.Vector3, ang: number) => {
      const r = 0.017 + rand() * 0.022;
      (inSlice(ang) ? sliceItems : restItems).push({ p, s: r, r: rand() });
    };
    for (let i = 0; i < 74; i++) {
      const a = rand() * TAU;
      const y = 0.15 + rand() * 1.0;
      const cluster = 0.5 + 0.5 * Math.sin(a * 2 + y * 3);
      if (rand() > cluster * 0.9) continue;
      push(new THREE.Vector3(Math.sin(a) * (R + 0.01), y, Math.cos(a) * (R + 0.01)), a);
    }
    for (let i = 0; i < 52; i++) {
      const a = rand() * TAU;
      const rr = 0.12 + Math.sqrt(rand()) * 0.82;
      push(new THREE.Vector3(Math.sin(a) * rr, H + 0.012, Math.cos(a) * rr), a);
    }
    for (const [items, parent] of [
      [restItems, this.rest],
      [sliceItems, this.slice],
    ] as const) {
      const mesh = new THREE.InstancedMesh(pearlGeo, m.pearlMat, Math.max(1, items.length));
      mesh.castShadow = true;
      mesh.count = items.length;
      parent.add(mesh);
      this.pearlSets.push({ mesh, items });
    }
    this.setPearlScale(0);
  }

  private setPearlScale(t: number) {
    const dummy = new THREE.Object3D();
    for (const set of this.pearlSets) {
      set.items.forEach((it, i) => {
        const k = easeOutBack(clamp01(t * 1.7 - it.r * 0.7));
        dummy.position.copy(it.p);
        dummy.scale.setScalar(Math.max(0.0001, it.s * k));
        dummy.updateMatrix();
        set.mesh.setMatrixAt(i, dummy.matrix);
      });
      set.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  // ---------- layout & camera ----------

  /** Fit the table photo to the screen and place the 3D cake exactly on the photo's cake stand. */
  layout(w: number, h: number) {
    this.w = w;
    this.h = h;
    const portrait = w / h < 1.05;
    let s: number;
    let ax: number;
    let ay: number;
    if (portrait) {
      s = Math.max(w / 470, (h * 0.45) / IMG_H);
      ax = w / 2;
      ay = h * 0.6;
    } else {
      s = Math.max(w / IMG_W, h / IMG_H);
      ax = (w - IMG_W * s) / 2 + IMG_AX * s;
      ay = (h - IMG_H * s) * 0.72 + IMG_AY * s;
    }
    const left = ax - IMG_AX * s;
    const top = ay - IMG_AY * s;
    this.base = { ax, ay, ppu: IMG_R * s, left, top, scale: s };
    const bg = this.o.bgEl.style;
    bg.left = `${left}px`;
    bg.top = `${top}px`;
    bg.width = `${IMG_W * s}px`;
    bg.height = `${IMG_H * s}px`;
    bg.transformOrigin = `${IMG_AX * s}px ${IMG_AY * s}px`;
    this.focusTarget = { ax: portrait ? w / 2 : w * 0.47, ay: portrait ? h * 0.66 : h * 0.68, k: portrait ? 1.15 : 1.2 };
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h, false);
    this.applyView();
  }

  private applyView() {
    const f = this.focus;
    const b = this.base;
    const k = lerp(1, this.focusTarget.k, f);
    const ax = lerp(b.ax, this.focusTarget.ax, f);
    const ay = lerp(b.ay, this.focusTarget.ay, f);
    this.o.bgEl.style.transform = `translate(${ax - b.ax}px, ${ay - b.ay}px) scale(${k})`;

    const cam = this.camera;
    const ppu = b.ppu * k;
    const D = this.h / (2 * Math.tan((cam.fov * D2R) / 2) * ppu);
    const e = lerp(13, 21, f) * D2R;
    cam.aspect = this.w / this.h;
    cam.position.set(0, D * Math.sin(e), D * Math.cos(e));
    cam.near = Math.max(0.1, D - 8);
    cam.far = D + 30;
    cam.lookAt(0, 0, 0);
    cam.setViewOffset(this.w, this.h, this.w / 2 - ax, this.h / 2 - ay, this.w, this.h);
    cam.updateProjectionMatrix();
  }

  // ---------- tween helpers ----------

  private tween(seconds: number, fn: (v: number) => void, ease: (t: number) => number = easeInOut): Promise<void> {
    return new Promise((resolve) => {
      this.tweens.push({ elapsed: 0, dur: Math.max(16, seconds * 1000 * this.speed), ease, fn, done: resolve });
    });
  }
  private wait(seconds: number) {
    return this.tween(seconds, () => {});
  }

  private applyKnife() {
    const k = this.ks;
    this.knife.root.position.set(k.x, k.y, k.z);
    this.knife.yaw.rotation.y = k.yaw;
    this.knife.pitch.rotation.z = -k.pitch;
    this.knife.model.rotation.x = k.roll;
  }

  private moveKnife(to: Pose, seconds: number, arc = 0, ease = easeInOut) {
    const from = { ...this.ks };
    let dy = to.yaw - from.yaw;
    while (dy > Math.PI) dy -= TAU;
    while (dy < -Math.PI) dy += TAU;
    return this.tween(
      seconds,
      (t) => {
        this.ks = {
          x: lerp(from.x, to.x, t),
          y: lerp(from.y, to.y, t) + arc * Math.sin(Math.PI * t),
          z: lerp(from.z, to.z, t),
          yaw: from.yaw + dy * t,
          pitch: lerp(from.pitch, to.pitch, t),
          roll: lerp(from.roll, to.roll, t),
        };
      },
      ease,
    );
  }

  /** Knife pose whose blade tip is exactly at `tip`. */
  private poseFromTip(tip: THREE.Vector3, yaw: number, pitch: number, roll: number): Pose {
    const dir = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, yaw, -pitch, "YXZ"));
    return { x: tip.x - dir.x * KNIFE_LEN, y: tip.y - dir.y * KNIFE_LEN, z: tip.z - dir.z * KNIFE_LEN, yaw, pitch, roll };
  }

  /** Yaw that makes the blade point from outside the cake towards the centre along the cut line `a`. */
  private yawInward(a: number) {
    return Math.atan2(Math.cos(a), -Math.sin(a));
  }

  // ---------- sparkles ----------

  private spawnSparks(center: THREE.Vector3, n: number, spread: number, up = 0.6, tints: number[][] = [[1, 0.7, 0.85], [1, 0.9, 0.6], [1, 1, 1]]) {
    const s = this.sparks;
    if (!s) return;
    let made = 0;
    for (let i = 0; i < s.life.length && made < n; i++) {
      if (s.life[i] > 0) continue;
      const a = Math.random() * TAU;
      const r = Math.random() * spread;
      s.pos[i * 3] = center.x + Math.cos(a) * r;
      s.pos[i * 3 + 1] = center.y + Math.random() * 0.2;
      s.pos[i * 3 + 2] = center.z + Math.sin(a) * r;
      s.vel[i * 3] = (Math.random() - 0.5) * 0.5;
      s.vel[i * 3 + 1] = up * (0.4 + Math.random());
      s.vel[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      s.max[i] = 0.9 + Math.random() * 1.1;
      s.life[i] = s.max[i];
      const t = tints[Math.floor(Math.random() * tints.length)];
      s.tint.set(t, i * 3);
      made++;
    }
  }

  private updateSparks(dt: number) {
    const s = this.sparks;
    if (!s) return;
    for (let i = 0; i < s.life.length; i++) {
      if (s.life[i] <= 0) {
        s.col[i * 3] = s.col[i * 3 + 1] = s.col[i * 3 + 2] = 0;
        continue;
      }
      s.life[i] -= dt;
      s.pos[i * 3] += s.vel[i * 3] * dt;
      s.pos[i * 3 + 1] += s.vel[i * 3 + 1] * dt;
      s.pos[i * 3 + 2] += s.vel[i * 3 + 2] * dt;
      s.vel[i * 3 + 1] -= 0.25 * dt;
      const a = clamp01(s.life[i] / s.max[i]);
      const tw = 0.6 + 0.4 * Math.sin(this.time * 18 + i);
      s.col[i * 3] = s.tint[i * 3] * a * tw;
      s.col[i * 3 + 1] = s.tint[i * 3 + 1] * a * tw;
      s.col[i * 3 + 2] = s.tint[i * 3 + 2] * a * tw;
    }
    (s.points.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (s.points.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  }

  // ---------- main loop ----------

  private frame = (now: number) => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.frame);
    const dt = Math.min(0.05, (now - (this.last || now)) / 1000);
    this.last = now;
    this.time += dt;

    if (this.fastForward) return;
    this.stepTweens(dt);

    if (!this.visible) return;

    // candles
    for (const c of this.candles) {
      const f = 1 + Math.sin(this.time * 17 + c.seed) * 0.07 + Math.sin(this.time * 29 + c.seed * 2) * 0.05;
      const sway = Math.sin(this.time * 5 + c.seed) * 0.04;
      c.flame.scale.set(0.15 * c.lit * (1 - sway * 0.6), 0.34 * c.lit * f, 1);
      c.flame.material.rotation = sway;
      c.glow.material.opacity = c.lit * (0.55 + Math.sin(this.time * 13 + c.seed) * 0.08);
      c.light.intensity = c.lit * (2.3 + Math.sin(this.time * 15 + c.seed) * 0.35);
    }

    // butterflies idle flutter (only the ones that have landed)
    this.butterflies.forEach((b) => {
      if (b.root.userData.flying) return;
      const a = b.base + Math.sin(this.time * 1.6 + b.phase) * 0.035;
      for (const h of b.hinges) h.rotation.y = h.userData.side < 0 ? a : -a;
    });

    // knife: gentle bob while it waits, ribbon tails swaying
    if (this.knifeBob && !this.cutting) this.ks.y = this.knifeRest.y + Math.sin(this.time * 1.8) * 0.012;
    this.applyKnife();
    this.knife.tails.forEach((t, i) => {
      const s = i === 0 ? -1 : 1;
      t.rotation.z = s * (0.28 + Math.sin(this.time * 2.6 + i) * 0.07) + (this.cutting ? Math.sin(this.time * 9 + i) * 0.1 : 0);
    });

    // disco lights circling the cake
    if (this.discoOn > 0) {
      this.discoLights.forEach((l, i) => {
        const a = this.time * (0.7 + i * 0.25) + i * 2.1;
        l.position.set(Math.cos(a) * 3, 2.2 + Math.sin(a * 1.3) * 0.8, Math.sin(a) * 2.5 + 1.5);
        l.intensity = this.discoOn * 9;
      });
    }

    this.updateSparks(dt);
    this.updateHint();
    this.renderer.render(this.scene, this.camera);
  };

  private stepTweens(dt: number) {
    if (!this.tweens.length) return;
    const finished: Tween[] = [];
    for (const t of this.tweens) {
      t.elapsed += dt * 1000;
      const v = clamp01(t.elapsed / t.dur);
      t.fn(t.ease(v));
      if (v >= 1) finished.push(t);
    }
    if (finished.length) {
      this.tweens = this.tweens.filter((t) => !finished.includes(t));
      finished.forEach((t) => t.done());
    }
  }

  private fastForward = false;
  /** Test helper: runs the animation clock forward by `seconds` without waiting for frames (used by automated tests on slow software renderers). */
  async debugAdvance(seconds: number) {
    this.fastForward = true;
    const step = 1 / 30;
    for (let t = 0; t < seconds && !this.disposed; t += step) {
      this.time += step;
      this.stepTweens(step);
      await new Promise((r) => setTimeout(r, 0));
    }
    this.fastForward = false;
  }

  private updateHint() {
    const el = this.o.hintEl;
    const show = this.ready && !this.cutting;
    if (!show) {
      if (el.dataset.show !== "0") {
        el.dataset.show = "0";
      }
      return;
    }
    const v = new THREE.Vector3(this.knifeRest.x - 0.05, this.knifeRest.y + 0.1, this.knifeRest.z - 0.25).project(this.camera);
    const x = ((v.x + 1) / 2) * this.w;
    const y = ((1 - v.y) / 2) * this.h;
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
    el.dataset.show = "1";
  }

  // ---------- pointer ----------

  private pickKnife(e: PointerEvent): boolean {
    const r = this.o.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    return this.raycaster.intersectObject(this.knife.hit, false).length > 0;
  }
  private onPointerMove = (e: PointerEvent) => {
    if (!this.ready || this.cutting) return;
    const hit = this.pickKnife(e);
    if (hit !== this.hover) {
      this.hover = hit;
      this.o.onKnifeHover(hit);
    }
  };
  private onPointerDown = (e: PointerEvent) => {
    if (this.ready && !this.cutting && this.pickKnife(e)) void this.cut();
  };

  // ---------- choreography ----------

  /** The cake is built in front of the viewer, the butterflies fly in, the topper rises and the candles are placed and lit. */
  async reveal() {
    await this.constructorDone;
    if (this.disposed) return;
    this.visible = true;
    this.cake.visible = true;
    this.cake.scale.setScalar(1);
    this.rest.visible = false;
    this.slice.visible = false;
    this.board.scale.setScalar(0.0001);
    const center = new THREE.Vector3(0, 0, 0);

    // 1. stand + board
    this.spawnSparks(center, 50, 1.1, 0.8);
    void this.tween(1.1, (t) => this.board.scale.setScalar(Math.max(0.0001, t)), easeOutBack);
    void this.tween(1.2, (t) => this.plate.group.scale.setScalar(Math.max(0.0001, t)), easeOutBack);
    await this.wait(0.55);

    // 2. the cake rises layer by layer
    this.rest.visible = true;
    this.slice.visible = true;
    const parts = [this.rest, this.slice];
    this.spawnSparks(new THREE.Vector3(0, 0.3, 0), 70, 1.0, 0.8);
    await this.tween(
      1.5,
      (t) => {
        parts.forEach((p) => p.scale.set(lerp(0.9, 1, t), Math.max(0.0001, t), lerp(0.9, 1, t)));
        if (Math.random() < 0.5) this.spawnSparks(new THREE.Vector3(0, t * H, 0), 3, 1.0, 0.5);
      },
      easeOutBack,
    );
    parts.forEach((p) => p.scale.set(1, 1, 1));

    // 3. pearls pop onto the icing while the butterflies fly in
    void this.tween(1.3, (t) => this.setPearlScale(t), easeOut);
    this.butterflies.forEach((b) => {
      b.root.userData.flying = true;
    });
    const flights = this.butterflies.map((b) =>
      this.tween(2.2 + b.delay * 2, (u) => {
        const t = clamp01((u * (2.2 + b.delay * 2) - b.delay * 2) / 2.2);
        const e = easeInOut(t);
        b.root.scale.setScalar(Math.max(0.0001, Math.min(1, t * 4)));
        b.root.position.lerpVectors(b.start, b.final, e);
        b.root.position.y += Math.sin(t * Math.PI) * 0.5;
        b.root.position.x += Math.sin(t * 9 + b.phase) * 0.12 * (1 - t);
        const amp = 0.85 * (1 - t) + 0.05;
        const a = 0.35 + Math.sin(this.time * 24 + b.phase) * amp * 0.9;
        for (const h of b.hinges) h.rotation.y = h.userData.side < 0 ? a : -a;
        if (t >= 1) b.root.userData.flying = false;
      }, (x) => x),
    );
    await this.wait(1.2);

    // 4. topper rises out of the cake
    this.spawnSparks(new THREE.Vector3(0.4, H, -0.34), 30, 0.3, 1);
    void this.tween(1.1, (t) => this.topper.scale.setScalar(Math.max(0.0001, t)), easeOutBack);
    await Promise.all(flights);
    this.butterflies.forEach((b) => (b.root.userData.flying = false));
    this.o.onEvent("revealed");

    // 5. candles are placed one by one, then lit
    await this.wait(0.3);
    await Promise.all(
      this.candles.map((c, i) =>
        this.wait(i * 0.45).then(() =>
          this.tween(1.0, (t) => {
            c.group.position.y = lerp(H + 2.6, H, t);
            c.group.rotation.z = Math.sin(t * Math.PI * 2) * 0.08 * (1 - t);
          }, easeOutBack),
        ),
      ),
    );
    await this.wait(0.4);
    for (const c of this.candles) {
      const p = new THREE.Vector3().copy(c.group.position).add(c.tip);
      this.spawnSparks(p, 14, 0.08, 0.5, [[1, 0.85, 0.5], [1, 1, 0.9]]);
      void this.tween(0.7, (t) => (c.lit = t), easeOut);
      await this.wait(0.35);
    }
    this.o.onEvent("candlesLit");
    await this.wait(0.8);

    this.ready = true;
    this.o.onEvent("ready");
  }

  setDisco(on: boolean) {
    void this.tween(1.2, (t) => (this.discoOn = on ? t : 1 - t), easeOut);
  }

  /** The knife lifts itself off the table, presses down along two lines and carries the slice to the plate. */
  async cut() {
    if (!this.ready || this.cutting || this.disposed) return;
    this.cutting = true;
    this.ready = false;
    this.o.onKnifeHover(false);
    this.o.onEvent("cutStart");
    void this.tween(1.8, (t) => {
      this.focus = t;
      this.applyView();
    });

    const cutLine = (a: number, tipR: number, tipY: number, pitchDeg: number): Pose =>
      this.poseFromTip(new THREE.Vector3(Math.sin(a) * tipR, tipY, Math.cos(a) * tipR), this.yawInward(a), pitchDeg * D2R, 0);
    const pressDown = async (a: number, slit: THREE.Mesh) => {
      slit.visible = true;
      const from = { ...this.ks };
      const to = cutLine(a, 0.14, 0.05, 60);
      await this.tween(1.15, (t) => {
        this.ks = {
          x: lerp(from.x, to.x, t) + Math.sin(t * 40) * 0.004 * (1 - t),
          y: lerp(from.y, to.y, t),
          z: lerp(from.z, to.z, t),
          yaw: from.yaw,
          pitch: lerp(from.pitch, to.pitch, t),
          roll: 0,
        };
        slit.scale.z = Math.max(0.0001, easeOut(clamp01((t - 0.3) / 0.7)));
      });
      this.spawnSparks(new THREE.Vector3(Math.sin(a) * 0.5, H, Math.cos(a) * 0.5), 12, 0.4, 0.4, [[1, 0.75, 0.9], [1, 1, 1]]);
      await this.wait(0.25);
    };

    // 1. the knife flies from the table to above the first cut line
    await this.moveKnife(cutLine(SLICE_A0, 0.14, H + 0.55, 60), 1.9, 1.6);
    await this.wait(0.35);
    await pressDown(SLICE_A0, this.slits[0] as unknown as THREE.Mesh);
    this.o.onEvent("firstCut");

    // 2. lift, swing over to the second line and press again
    await this.moveKnife(cutLine(SLICE_A0, 0.14, H + 0.7, 60), 0.7);
    await this.moveKnife(cutLine(SLICE_A1, 0.14, H + 0.7, 60), 0.9, 0.35);
    await pressDown(SLICE_A1, this.slits[1] as unknown as THREE.Mesh);
    this.o.onEvent("secondCut");

    // 3. the knife comes out of the cake and slides in flat under the slice
    const bis = (SLICE_A0 + SLICE_A1) / 2;
    await this.moveKnife(cutLine(SLICE_A1, 0.14, H + 0.8, 60), 0.7);
    const bisDir = new THREE.Vector3(Math.sin(bis), 0, Math.cos(bis));
    const underYaw = this.yawInward(bis);
    const hover = this.poseFromTip(bisDir.clone().multiplyScalar(2.0).setY(0.35), underYaw, 0, -Math.PI / 2);
    await this.moveKnife(hover, 1.1, 0.5);
    this.slits.forEach((s) => (s.visible = false));
    const under = this.poseFromTip(bisDir.clone().multiplyScalar(0.28).setY(0.045), underYaw, 0, -Math.PI / 2);
    await this.moveKnife(under, 0.9);

    // 4. lift the slice and carry it to the plate
    const s0 = this.slice.position.clone();
    const yaw0 = this.slice.rotation.y;
    const kyaw0 = this.ks.yaw;
    const knifeOff = new THREE.Vector3(this.ks.x, this.ks.y, this.ks.z).sub(s0);
    const plateTop = new THREE.Vector3().copy(this.plate.group.position).add(new THREE.Vector3(0, 0.03, 0));
    const targetYaw = -bis;
    const centroid = new THREE.Vector3(0, 0, 0.52);
    const s1 = plateTop.clone().sub(centroid);
    this.o.onEvent("sliceFree");
    this.spawnSparks(new THREE.Vector3(Math.sin(bis) * 0.6, 0.5, Math.cos(bis) * 0.6), 40, 0.5, 0.9);
    await this.tween(3.6, (u) => {
      const px = easeInOut(clamp01((u - 0.3) / 0.7));
      const py = easeInOut(u);
      const pos = new THREE.Vector3(lerp(s0.x, s1.x, px), lerp(s0.y, s1.y, py) + 1.55 * Math.sin(Math.PI * u) + 0.06 * Math.min(1, u * 8), lerp(s0.z, s1.z, px));
      const yaw = yaw0 + (targetYaw - yaw0) * easeInOut(clamp01((u - 0.2) / 0.8));
      this.slice.position.copy(pos);
      this.slice.rotation.y = yaw;
      const d = yaw - yaw0;
      const off = knifeOff.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), d);
      this.ks.x = pos.x + off.x;
      this.ks.y = pos.y + off.y;
      this.ks.z = pos.z + off.z;
      this.ks.yaw = kyaw0 + d;
      if (Math.random() < 0.25) this.spawnSparks(pos.clone().add(new THREE.Vector3(0, 0.6, 0)), 2, 0.3, 0.2);
    });
    this.spawnSparks(plateTop, 26, 0.5, 0.7);

    // 5. the knife slides out, the camera settles back and the knife is put down
    const outDir = new THREE.Vector3(0, 0, 1);
    const k = { ...this.ks };
    await this.tween(0.9, (t) => {
      this.ks.x = k.x + outDir.x * 1.4 * t;
      this.ks.z = k.z + outDir.z * 1.4 * t;
      this.ks.y = k.y + 0.3 * Math.sin(Math.PI * t);
    });
    void this.tween(2.2, (t) => {
      this.focus = lerp(1, 0.55, t);
      this.applyView();
    });
    await this.moveKnife({ ...this.knifeRest, x: this.knifeRest.x + 0.2, z: this.knifeRest.z - 0.2 }, 1.6, 0.9);
    this.knifeRest = { ...this.ks };
    this.knifeBob = false;
    this.cutting = false;
    this.o.onEvent("done");
  }

  // ---------- teardown ----------

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.tweens = [];
    this.o.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.o.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.scene.traverse((obj) => {
      const m = obj as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose();
    });
    for (const d of this.disposables) {
      try {
        d.dispose();
      } catch {
        /* already disposed */
      }
    }
    for (const d of this.knife.disposables) d.dispose();
    Object.values(this.mats).forEach((v) => {
      if (v && !Array.isArray(v) && "dispose" in v) (v as THREE.Material).dispose();
    });
    this.renderer.dispose();
  }

  /** Used by the cake colours legend in tests/debug. */
  static readonly colors = cakeColors;
}
