"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  AVATAR_BGS,
  AVATAR_HAIR_COLORS,
  AVATAR_SHIRTS,
  AVATAR_SKINS,
  type AvatarConfig,
} from "@geopin/ui";

export interface Avatar3DProps {
  config: AvatarConfig;
  /** Drag rotates the character (profile editor). */
  interactive?: boolean;
  /** Transparent background (for compositing over the hero globe). */
  transparent?: boolean;
  className?: string;
}

/**
 * GeoGuessr-style chibi character rendered with three.js, built procedurally
 * from the same AvatarConfig the 2D thumbnails use — same skin, hair, shirt
 * and accessories, so both representations match.
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

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    camera.position.set(0, 1.95, 7.4);
    camera.lookAt(0, 1.68, 0);

    // Soft studio lighting — key + fill + rim, like the reference render.
    scene.add(new THREE.HemisphereLight(0xffffff, 0x445066, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(2.5, 4, 3);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x99c4ff, 0.7);
    rim.position.set(-3, 2, -3);
    scene.add(rim);

    const holder = new THREE.Group();
    scene.add(holder);
    let character = buildCharacter(configRef.current);
    holder.add(character);

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

      // Rebuild the mesh when the config changes (editor live-preview).
      const key2 = JSON.stringify(configRef.current);
      if (key2 !== lastConfigKey) {
        lastConfigKey = key2;
        holder.remove(character);
        disposeGroup(character);
        character = buildCharacter(configRef.current);
        holder.add(character);
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
      character.position.y = Math.sin(t * 1.6) * 0.035; // idle bob
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      disposeGroup(character);
      renderer.dispose();
      mount.removeChild(el);
    };
    // The scene is rebuilt through configRef inside the loop; only the mode
    // flags require a full remount.
  }, [interactive, transparent]);

  return <div ref={mountRef} className={className} style={{ width: "100%", height: "100%" }} />;
}

/* ------------------------- character factory ------------------------- */

function mat(color: string | number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color as string),
    roughness: 0.82,
    metalness: 0.02,
    ...opts,
  });
}

function capsule(r: number, len: number, material: THREE.Material) {
  return new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 16), material);
}

function sphere(r: number, material: THREE.Material, w = 24, h = 18) {
  return new THREE.Mesh(new THREE.SphereGeometry(r, w, h), material);
}

const JEANS = "#3E5CA8";
const JEANS_DARK = "#31488A";
const DARK = "#20242F";

function buildCharacter(config: AvatarConfig): THREE.Group {
  const g = new THREE.Group();

  const [skin] = AVATAR_SKINS[config.skin] ?? AVATAR_SKINS[0]!;
  const [, skinShade] = AVATAR_SKINS[config.skin] ?? AVATAR_SKINS[0]!;
  const hairC = AVATAR_HAIR_COLORS[config.hairColor] ?? AVATAR_HAIR_COLORS[0]!;
  const [shirt] = AVATAR_SHIRTS[config.shirt] ?? AVATAR_SHIRTS[0]!;

  const skinMat = mat(skin);
  const hairMat = mat(hairC, { roughness: 0.9 });
  const shirtMat = mat(shirt, { roughness: 0.92 });

  /* legs + shoes */
  const legL = capsule(0.17, 0.34, mat(JEANS));
  legL.position.set(-0.24, 0.42, 0);
  const legR = legL.clone();
  legR.position.x = 0.24;
  g.add(legL, legR);

  const beltMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.52, 0.5, 0.16, 24),
    mat(JEANS_DARK),
  );
  beltMesh.position.y = 0.72;
  g.add(beltMesh);

  const shoeMat = mat("#EDEFF4", { roughness: 0.6 });
  const shoeL = sphere(0.19, shoeMat);
  shoeL.scale.set(1.1, 0.6, 1.5);
  shoeL.position.set(-0.24, 0.12, 0.05);
  const shoeR = shoeL.clone();
  shoeR.position.x = 0.24;
  g.add(shoeL, shoeR);

  /* torso */
  const torso = capsule(0.52, 0.5, shirtMat);
  torso.position.y = 1.08;
  torso.scale.set(1, 0.95, 0.82);
  g.add(torso);

  /* sleeves + arms + hands */
  const sleeveL = capsule(0.15, 0.12, shirtMat);
  sleeveL.position.set(-0.56, 1.32, 0);
  sleeveL.rotation.z = 0.55;
  const sleeveR = sleeveL.clone();
  sleeveR.position.x = 0.56;
  sleeveR.rotation.z = -0.55;
  g.add(sleeveL, sleeveR);

  const armL = capsule(0.1, 0.5, skinMat);
  armL.position.set(-0.72, 0.95, 0);
  armL.rotation.z = 0.14;
  const armR = armL.clone();
  armR.position.x = 0.72;
  armR.rotation.z = -0.14;
  g.add(armL, armR);

  const handL = sphere(0.13, skinMat);
  handL.position.set(-0.78, 0.6, 0.03);
  const handR = handL.clone();
  handR.position.x = 0.78;
  g.add(handL, handR);

  /* head — oversized chibi head */
  const head = new THREE.Group();
  head.position.y = 2.32;
  g.add(head);

  const headR = 0.92;
  const skull = sphere(headR, skinMat, 32, 24);
  skull.scale.set(
    config.head === 2 ? 1.08 : 1,
    config.head === 1 ? 1.06 : 0.98,
    0.96,
  );
  head.add(skull);

  const earL = sphere(0.14, skinMat);
  earL.position.set(-headR * 0.96, -0.02, 0);
  const earR = earL.clone();
  earR.position.x = headR * 0.96;
  head.add(earL, earR);

  /* face — placed on the +z hemisphere */
  const fz = headR * 0.9; // face depth
  const eyeY = 0.02;
  const eyeX = 0.3;
  const darkMat = mat(DARK, { roughness: 0.4 });

  const hasShades = config.extra === 3;
  if (!hasShades) {
    if (config.eyes === 2) {
      // happy closed — thin curved tubes
      for (const sx of [-1, 1]) {
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(sx * eyeX - 0.11, eyeY - 0.02, fz),
          new THREE.Vector3(sx * eyeX, eyeY + 0.09, fz + 0.04),
          new THREE.Vector3(sx * eyeX + 0.11, eyeY - 0.02, fz),
        );
        head.add(
          new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.025, 8), darkMat),
        );
      }
    } else {
      const ry = config.eyes === 3 ? 0.06 : config.eyes === 1 ? 0.12 : 0.11;
      const rx = config.eyes === 1 ? 0.12 : 0.08;
      for (const sx of [-1, 1]) {
        const eye = sphere(1, darkMat, 16, 12);
        eye.scale.set(rx, ry, 0.05);
        eye.position.set(sx * eyeX, eyeY, fz);
        head.add(eye);
      }
    }
  }

  /* brows */
  const browMat = mat(hairC, { roughness: 0.9 });
  for (const sx of [-1, 1]) {
    const brow = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, config.brows === 3 ? 0.075 : 0.045, 0.03),
      browMat,
    );
    brow.position.set(sx * eyeX, eyeY + (hasShades ? 0.3 : 0.24), fz + 0.02);
    if (config.brows === 1) brow.rotation.z = sx * -0.28;
    if (config.brows === 2) brow.rotation.z = sx * 0.18;
    head.add(brow);
  }

  /* nose */
  const nose = sphere(config.nose === 1 ? 0.085 : 0.06, mat(skinShade));
  nose.position.set(0, -0.16, fz + 0.05);
  head.add(nose);

  /* mouth */
  const mouthMat = mat("#8C3A3A", { roughness: 0.5 });
  if (config.mouth === 1 || config.mouth === 3) {
    const open = sphere(1, mat("#6E2A31"), 16, 12);
    open.scale.set(config.mouth === 1 ? 0.14 : 0.09, 0.1, 0.05);
    open.position.set(0, -0.38, fz - 0.02);
    head.add(open);
  } else if (config.mouth === 2) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.035, 0.03), mouthMat);
    line.position.set(0, -0.37, fz - 0.01);
    head.add(line);
  } else {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.14, -0.33, fz - 0.02),
      new THREE.Vector3(config.mouth === 4 ? 0.06 : 0, -0.44, fz + 0.02),
      new THREE.Vector3(0.16, config.mouth === 4 ? -0.3 : -0.33, fz - 0.02),
    );
    head.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.028, 8), mouthMat));
  }

  /* hair */
  addHair(head, config.hair, hairMat, headR);

  /* extras */
  addExtra(head, config, hairMat, headR);

  return g;
}

function hemisphereShell(r: number, material: THREE.Material, thetaLength: number) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(r, 32, 18, 0, Math.PI * 2, 0, thetaLength),
    material,
  );
}

function addHair(
  head: THREE.Group,
  variant: number,
  hairMat: THREE.MeshStandardMaterial,
  headR: number,
) {
  switch (variant) {
    case 1: { // short crop
      const shell = hemisphereShell(headR * 1.05, hairMat, Math.PI * 0.46);
      shell.position.y = 0.03;
      head.add(shell);
      break;
    }
    case 2: { // side part
      const shell = hemisphereShell(headR * 1.05, hairMat, Math.PI * 0.42);
      shell.position.y = 0.05;
      shell.rotation.z = 0.12;
      head.add(shell);
      const fringe = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.16, 0.24),
        hairMat,
      );
      fringe.position.set(-0.25, 0.62, headR * 0.62);
      fringe.rotation.z = 0.28;
      head.add(fringe);
      break;
    }
    case 3: { // spiky
      const shell = hemisphereShell(headR * 1.04, hairMat, Math.PI * 0.4);
      shell.position.y = 0.05;
      head.add(shell);
      for (let i = 0; i < 5; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.3, 8), hairMat);
        const a = (i - 2) * 0.42;
        spike.position.set(Math.sin(a) * 0.5, 0.86 + Math.cos(a) * 0.12, 0.12);
        spike.rotation.z = -a * 0.6;
        head.add(spike);
      }
      break;
    }
    case 4: { // cap with GeoPin logo (reference look)
      const capMat = mat("#23262F", { roughness: 0.85 });
      const dome = hemisphereShell(headR * 1.08, capMat, Math.PI * 0.44);
      dome.position.y = 0.06;
      dome.rotation.x = -0.1;
      head.add(dome);
      const brim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.58, 0.62, 0.06, 24, 1, false, 0, Math.PI),
        capMat,
      );
      brim.rotation.y = -Math.PI / 2;
      brim.position.set(0, 0.34, headR * 0.6);
      brim.scale.set(1.3, 1, 1.6);
      brim.rotation.x = 0.08;
      head.add(brim);
      // pin badge
      const badge = sphere(0.13, mat("#E23B3B", { roughness: 0.4 }));
      badge.scale.set(1, 1.25, 0.5);
      badge.position.set(0, 0.62, headR * 0.86);
      head.add(badge);
      const badgeDot = sphere(0.05, mat("#FFFFFF", { roughness: 0.3 }));
      badgeDot.position.set(0, 0.66, headR * 0.93);
      head.add(badgeDot);
      break;
    }
    case 5: { // curly
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        const rr = 0.55 + (i % 3) * 0.08;
        const puff = sphere(0.22 + (i % 2) * 0.05, hairMat, 12, 10);
        puff.position.set(
          Math.cos(a) * rr,
          0.62 + Math.sin(i * 1.7) * 0.14,
          Math.sin(a) * rr * 0.8,
        );
        head.add(puff);
      }
      const crown = sphere(0.42, hairMat, 12, 10);
      crown.position.y = 0.85;
      head.add(crown);
      break;
    }
    case 6: { // long
      const shell = hemisphereShell(headR * 1.06, hairMat, Math.PI * 0.52);
      shell.position.y = 0.03;
      head.add(shell);
      for (const sx of [-1, 1]) {
        const side = capsule(0.16, 0.9, hairMat);
        side.position.set(sx * headR * 0.82, -0.5, -0.1);
        head.add(side);
      }
      const back = new THREE.Mesh(
        new THREE.CylinderGeometry(headR * 0.7, headR * 0.55, 1.1, 16, 1, false, 0, Math.PI),
        hairMat,
      );
      back.rotation.y = Math.PI;
      back.position.set(0, -0.35, -headR * 0.4);
      head.add(back);
      break;
    }
    case 7: { // bun
      const shell = hemisphereShell(headR * 1.05, hairMat, Math.PI * 0.45);
      shell.position.y = 0.04;
      head.add(shell);
      const bun = sphere(0.28, hairMat);
      bun.position.set(0, headR * 1.02, -0.15);
      head.add(bun);
      break;
    }
    default:
      break; // bald
  }
}

function addExtra(
  head: THREE.Group,
  config: AvatarConfig,
  hairMat: THREE.MeshStandardMaterial,
  headR: number,
) {
  const fz = headR * 0.9;
  const frameMat = mat("#20242F", { roughness: 0.35 });
  switch (config.extra) {
    case 1: { // round glasses
      for (const sx of [-1, 1]) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.025, 8, 24), frameMat);
        ring.position.set(sx * 0.3, 0.02, fz + 0.05);
        head.add(ring);
      }
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 0.03), frameMat);
      bridge.position.set(0, 0.05, fz + 0.05);
      head.add(bridge);
      break;
    }
    case 2: { // square glasses
      for (const sx of [-1, 1]) {
        const lens = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.26, 0.04), frameMat);
        const inner = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 0.2, 0.05),
          mat("#B9D4E8", { roughness: 0.15, transparent: true, opacity: 0.5 }),
        );
        lens.position.set(sx * 0.3, 0.02, fz + 0.05);
        inner.position.copy(lens.position);
        head.add(lens, inner);
      }
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.03, 0.03), frameMat);
      bridge.position.set(0, 0.05, fz + 0.06);
      head.add(bridge);
      break;
    }
    case 3: { // sunglasses (reference look)
      const lensMat = mat("#14161e", { roughness: 0.2, metalness: 0.3 });
      for (const sx of [-1, 1]) {
        const lens = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.24, 0.05), lensMat);
        lens.position.set(sx * 0.27, 0.04, fz + 0.04);
        head.add(lens);
      }
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.045), lensMat);
      bridge.position.set(0, 0.1, fz + 0.05);
      head.add(bridge);
      for (const sx of [-1, 1]) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.04), lensMat);
        arm.position.set(sx * 0.62, 0.08, fz - 0.38);
        arm.rotation.y = sx * (Math.PI / 2.15);
        head.add(arm);
      }
      break;
    }
    case 4: { // mustache
      const st = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 8, 20, Math.PI), hairMat);
      st.position.set(0, -0.28, fz);
      st.rotation.z = Math.PI;
      head.add(st);
      break;
    }
    case 5: { // beard
      const beard = new THREE.Mesh(
        new THREE.SphereGeometry(headR * 0.98, 24, 16, 0, Math.PI * 2, Math.PI * 0.62, Math.PI * 0.3),
        hairMat,
      );
      beard.scale.set(0.98, 1.05, 0.98);
      beard.position.y = -0.02;
      head.add(beard);
      break;
    }
    case 6: { // blush
      for (const sx of [-1, 1]) {
        const blush = sphere(1, mat("#F08A9B", { roughness: 0.9 }), 12, 10);
        blush.scale.set(0.11, 0.06, 0.04);
        blush.position.set(sx * 0.55, -0.18, fz - 0.09);
        head.add(blush);
      }
      break;
    }
    default:
      break;
  }
}

function disposeGroup(group: THREE.Group) {
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      const m = obj.material;
      if (Array.isArray(m)) m.forEach((x) => x.dispose());
      else m.dispose();
    }
  });
}
