"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import {
  AVATAR_BGS,
  AVATAR_HAIR_COLORS,
  AVATAR_SHIRTS,
  AVATAR_SKINS,
  AVATAR3D_COSTUME_TOPS,
  AVATAR3D_PARTS,
  AVATAR3D_BODY,
  avatar3DPartFiles,
  type Avatar3DConfig,
} from "@geopin/ui";

export interface Avatar3DProps {
  config: Avatar3DConfig;
  /** Drag rotates the character (profile editor). */
  interactive?: boolean;
  /** Transparent background (for compositing over the hero globe). */
  transparent?: boolean;
  className?: string;
}

/* ----------------------------- GLB cache ----------------------------- */

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

const gltfCache = new Map<string, Promise<THREE.Group>>();

export function loadPart(file: string): Promise<THREE.Group> {
  let p = gltfCache.get(file);
  if (!p) {
    p = loader
      .loadAsync(`/avatar3d/${file}.glb`)
      .then((gltf) => gltf.scene);
    gltfCache.set(file, p);
  }
  return p;
}

/** Which tint (if any) applies to a part file. */
/**
 * Multiplying a tint over the painted atlas gives muddy, wrong colors, so
 * customized parts drop the texture and use a flat material color instead
 * (the toon look survives on lighting alone). topColor 0 = original texture.
 */
function tintFor(file: string, c: Avatar3DConfig): THREE.Color | null {
  if (file === AVATAR3D_BODY) {
    return new THREE.Color(AVATAR_SKINS[c.skin]?.[0] ?? "#FFDDBF");
  }
  if (
    (AVATAR3D_PARTS.hair as readonly (string | null)[]).includes(file) ||
    file.startsWith("moustache")
  ) {
    return new THREE.Color(AVATAR_HAIR_COLORS[c.hairColor] ?? "#2B2117");
  }
  const isTop = (AVATAR3D_PARTS.top as readonly string[]).indexOf(file);
  if (isTop >= 0 && !AVATAR3D_COSTUME_TOPS.has(isTop) && c.topColor > 0) {
    return new THREE.Color(AVATAR_SHIRTS[c.topColor - 1]?.[0] ?? "#FFFFFF");
  }
  return null;
}

/**
 * The rig rests in a T-pose; relax it so the character stands naturally.
 * Every part carries its own skeleton copy, so the same pose is applied to
 * each one to keep them aligned.
 */
/**
 * The rig rests in a T-pose. Each bone's local +X axis swings the arm in the
 * body plane (found empirically), so lowering the arms is a local rotateX.
 */
export function relaxPose(root: THREE.Object3D) {
  const rotX: Record<string, number> = {
    LeftArm: -0.9,
    RightArm: -0.9,
    LeftForeArm: -0.12,
    RightForeArm: -0.12,
  };
  root.traverse((obj) => {
    const r = rotX[obj.name];
    if (r && (obj as THREE.Bone).isBone) obj.rotateX(r);
  });
}

/**
 * Bones the idle animation drives. Every worn part carries its own skeleton
 * copy, so the same bone name maps to N bones that must move in unison.
 */
export interface CharacterRig {
  group: THREE.Group;
  bones: Map<string, THREE.Bone[]>;
  /** Rest quaternion per bone (after relaxPose) — animation deltas start here. */
  base: Map<string, THREE.Quaternion[]>;
}

const ANIMATED_BONES = [
  "Hips",
  "Spine",
  "Spine1",
  "Neck",
  "Head",
  "LeftArm",
  "RightArm",
  "LeftForeArm",
  "RightForeArm",
  "LeftHand",
  "RightHand",
  "LeftUpLeg",
  "RightUpLeg",
  "LeftLeg",
  "RightLeg",
  "LeftFoot",
  "RightFoot",
];

/**
 * Assemble the character: bare body + worn parts, each a skinned GLB scene
 * sharing the same rest pose, so adding them to one group lines them up.
 */
export async function buildCharacter(config: Avatar3DConfig): Promise<CharacterRig> {
  const g = new THREE.Group();
  const bones = new Map<string, THREE.Bone[]>();
  const base = new Map<string, THREE.Quaternion[]>();
  const files = avatar3DPartFiles(config);
  const scenes = await Promise.all(files.map(loadPart));
  scenes.forEach((scene, i) => {
    const file = files[i]!;
    const clone = SkeletonUtils.clone(scene);
    relaxPose(clone);
    const tint = tintFor(file, config);
    clone.traverse((obj) => {
      const bone = obj as THREE.Bone;
      if (bone.isBone && ANIMATED_BONES.includes(bone.name)) {
        if (!bones.has(bone.name)) {
          bones.set(bone.name, []);
          base.set(bone.name, []);
        }
        bones.get(bone.name)!.push(bone);
        base.get(bone.name)!.push(bone.quaternion.clone());
      }
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.frustumCulled = false; // skinned meshes mis-cull at close range
      if (tint) {
        const src = mesh.material as THREE.MeshStandardMaterial;
        const m = src.clone();
        m.map = null; // flat color — see tintFor
        m.color = tint;
        mesh.material = m;
      }
    });
    g.add(clone);
  });
  return { group: g, bones, base };
}

/**
 * Procedural stance + idle: breathing, a lazy arm sway and the head looking
 * around, plus the selected pose's bone offsets (wave, victory…). Applied as
 * local-axis deltas over the rest pose, identically to every part's skeleton
 * so the outfit never drifts apart.
 */
export function animateIdle(rig: CharacterRig, t: number, poseIndex = 0) {
  const pose = (name: string, fn: (b: THREE.Bone) => void) => {
    const bs = rig.bones.get(name);
    const q0 = rig.base.get(name);
    if (!bs || !q0) return;
    bs.forEach((b, i) => {
      b.quaternion.copy(q0[i]!);
      fn(b);
    });
  };

  const breathe = Math.sin(t * 1.9) * 0.025;
  const look = Math.sin(t * 0.55) * 0.16 + Math.sin(t * 0.23) * 0.06;
  const tilt = Math.sin(t * 0.4) * 0.04;
  // Arms only ever lift AWAY from the torso (0..1), so they can't clip
  // through the body at the swing extremes.
  const liftL = (Math.sin(t * 1.1) + 1) * 0.5 * 0.05;
  const liftR = (Math.sin(t * 1.1 + Math.PI * 0.6) + 1) * 0.5 * 0.05;

  pose("Spine", (b) => b.rotateX(breathe));
  pose("Spine1", (b) => b.rotateX(breathe * 0.6));
  pose("Hips", (b) => b.rotateY(Math.sin(t * 1.1) * 0.02));
  pose("Neck", (b) => b.rotateY(look * 0.4));
  pose("Head", (b) => {
    b.rotateY(look);
    b.rotateZ(tilt);
  });

  if (poseIndex === 1) {
    // Wave: right arm raised, forearm swinging hello.
    const wave = Math.sin(t * 5.5) * 0.28;
    pose("LeftArm", (b) => b.rotateX(liftL + breathe));
    pose("LeftForeArm", (b) => b.rotateX(liftL * 0.4));
    // The long-axis twist (rotateY) turns the palm forward — without it the
    // hand keeps its T-pose orientation and looks broken.
    pose("RightArm", (b) => {
      b.rotateX(2.5 + breathe);
      b.rotateY(1.25);
    });
    pose("RightForeArm", (b) => b.rotateX(0.45 + wave));
    pose("RightHand", (b) => b.rotateX(0.15));
  } else if (poseIndex === 2) {
    // Victory: both arms up in a V, tiny celebratory pulse.
    const pump = (Math.sin(t * 2.4) + 1) * 0.5 * 0.08;
    pose("LeftArm", (b) => {
      b.rotateX(2.3 + pump + breathe);
      b.rotateY(-1.25);
    });
    pose("RightArm", (b) => {
      b.rotateX(2.3 + pump + breathe);
      b.rotateY(1.25);
    });
    pose("LeftForeArm", (b) => b.rotateX(0.25));
    pose("RightForeArm", (b) => b.rotateX(0.25));
  } else if (poseIndex === 3) {
    // Walk in place. Leg bones swing forward/back around their local Z axis
    // (X scissors them sideways); knees bend on the back swing. Arms
    // counter-swing and the torso leans slightly into the stride.
    const speed = 4.2;
    const step = Math.sin(t * speed);
    const kneeBend = (phase: number) =>
      Math.max(0, -Math.sin(t * speed + phase)) * 0.9 + 0.08;
    pose("Spine", (b) => b.rotateX(0.07 + breathe));
    // Hips twist into each stride; the per-footfall vertical bob lives in
    // the render loop (bones only rotate here).
    pose("Hips", (b) => b.rotateY(step * 0.09));
    pose("LeftUpLeg", (b) => b.rotateZ(step * 0.55));
    pose("RightUpLeg", (b) => b.rotateZ(-step * 0.55));
    pose("LeftLeg", (b) => b.rotateZ(kneeBend(0)));
    pose("RightLeg", (b) => b.rotateZ(kneeBend(Math.PI)));
    pose("LeftArm", (b) => {
      b.rotateX(0.12 + breathe);
      b.rotateZ(-step * 0.3);
    });
    pose("RightArm", (b) => {
      b.rotateX(0.12 + breathe);
      b.rotateZ(step * 0.3);
    });
    pose("LeftForeArm", (b) => b.rotateX(0.2));
    pose("RightForeArm", (b) => b.rotateX(0.2));
  } else {
    pose("LeftArm", (b) => b.rotateX(liftL + breathe));
    pose("RightArm", (b) => b.rotateX(liftR + breathe));
    pose("LeftForeArm", (b) => b.rotateX(liftL * 0.4));
    pose("RightForeArm", (b) => b.rotateX(liftR * 0.4));
  }
}

export function disposeGroup(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh) {
      // Geometry is shared via the GLB cache — only tinted material clones
      // belong to this instance.
      const m = mesh.material;
      if (Array.isArray(m)) m.forEach((x) => x.dispose());
      else m?.dispose();
    }
  });
}

/* ------------------------------ component ---------------------------- */

/**
 * Customizable character (Creative Character GLB pack) rendered with
 * three.js from the same Avatar3DConfig the 2D thumbnails snapshot.
 */
export function Avatar3D({
  config,
  interactive = false,
  transparent = false,
  className,
}: Avatar3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    if (interactive) renderer.domElement.style.cursor = "grab";
    renderer.domElement.style.touchAction = interactive ? "none" : "auto";

    const scene = new THREE.Scene();
    if (!transparent) {
      const [, bgB] = AVATAR_BGS[configRef.current.bg] ?? AVATAR_BGS[0]!;
      scene.background = new THREE.Color(bgB);
    }

    // Character stands 0..~2.1 world units tall.
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    camera.position.set(0, 1.3, 5.6);
    camera.lookAt(0, 1.02, 0);

    // Soft studio lighting — key + fill + rim.
    scene.add(new THREE.HemisphereLight(0xffffff, 0x445066, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(2.5, 4, 3);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x99c4ff, 0.7);
    rim.position.set(-3, 2, -3);
    scene.add(rim);

    const holder = new THREE.Group();
    scene.add(holder);

    let rig: CharacterRig | null = null;
    let buildToken = 0;
    const rebuild = (cfg: Avatar3DConfig) => {
      const token = ++buildToken;
      buildCharacter(cfg).then((next) => {
        if (token !== buildToken) {
          disposeGroup(next.group);
          return;
        }
        if (rig) {
          holder.remove(rig.group);
          disposeGroup(rig.group);
        }
        rig = next;
        holder.add(rig.group);
      });
    };
    rebuild(configRef.current);

    /* resize */
    const resize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    /* drag to rotate */
    let dragging = false;
    let lastX = 0;
    let targetRotY = 0;
    let velocity = 0;
    const el = renderer.domElement;
    const onDown = (e: PointerEvent) => {
      if (!interactive) return;
      dragging = true;
      lastX = e.clientX;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      velocity = dx * 0.012;
      targetRotY += velocity;
    };
    const onUp = () => {
      dragging = false;
      el.style.cursor = interactive ? "grab" : "";
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);

    /* animate: idle bob + sway (+ drag inertia) */
    let raf = 0;
    let lastConfigKey = JSON.stringify(configRef.current);
    const clock = new THREE.Clock();
    const tick = () => {
      raf = requestAnimationFrame(tick);

      // Rebuild when the config changes (editor live-preview).
      const key2 = JSON.stringify(configRef.current);
      if (key2 !== lastConfigKey) {
        lastConfigKey = key2;
        rebuild(configRef.current);
        if (!transparent) {
          const [, bgB] = AVATAR_BGS[configRef.current.bg] ?? AVATAR_BGS[0]!;
          scene.background = new THREE.Color(bgB);
        }
      }

      const t = clock.getElapsedTime();
      if (!dragging) {
        velocity *= 0.94;
        targetRotY += velocity;
        if (!interactive) targetRotY = Math.sin(t * 0.5) * 0.18;
      }
      holder.rotation.y += (targetRotY - holder.rotation.y) * 0.15;
      if (rig) {
        // Walking bounces once per footfall; other poses breathe gently.
        rig.group.position.y =
          configRef.current.pose === 3
            ? Math.abs(Math.cos(t * 4.2)) * 0.05
            : Math.sin(t * 1.9) * 0.012;
        animateIdle(rig, t, configRef.current.pose);
      }
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      buildToken++; // cancel in-flight builds
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      if (rig) disposeGroup(rig.group);
      renderer.dispose();
      mount.removeChild(el);
    };
    // The scene is rebuilt through configRef inside the loop; only the mode
    // flags require a full remount.
  }, [interactive, transparent]);

  return <div ref={mountRef} className={className} style={{ width: "100%", height: "100%" }} />;
}
