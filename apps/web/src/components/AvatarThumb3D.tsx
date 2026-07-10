"use client";

import * as React from "react";
import { Avatar, AvatarImageContext } from "@geopin/ui";

/**
 * Head-and-shoulders PNG snapshots of the 3D character, generated client-side
 * with a shared offscreen renderer and cached per seed. Provided to every
 * <Avatar> (nav, leaderboard, lobby…) through AvatarImageContext; the Mii SVG
 * stays as the fallback while the snapshot loads or when WebGL is missing.
 */

const cache = new Map<string, Promise<string>>();
let queue: Promise<unknown> = Promise.resolve();

function snapshot(seed: string): Promise<string> {
  let p = cache.get(seed);
  if (!p) {
    // Serialize through one offscreen renderer; three.js loads on demand so
    // SSR and non-WebGL browsers never touch it.
    p = (queue = queue.catch(() => {}).then(async () => {
      const [{ buildCharacter, disposeGroup }, THREE, ui] = await Promise.all([
        import("./Avatar3D"),
        import("three"),
        import("@geopin/ui"),
      ]);
      const cfg = ui.avatar3DFromSeed(seed);
      const r = getRenderer(THREE);
      const rig = await buildCharacter(cfg);
      r.scene.background = new THREE.Color(
        (ui.AVATAR_BGS[cfg.bg] ?? ui.AVATAR_BGS[0]!)[1],
      );
      r.scene.add(rig.group);
      r.renderer.render(r.scene, r.camera);
      const url = r.renderer.domElement.toDataURL("image/png");
      r.scene.remove(rig.group);
      disposeGroup(rig.group);
      return url;
    })) as Promise<string>;
    cache.set(seed, p);
    p.catch(() => cache.delete(seed));
  }
  return p;
}

type ThreeNS = typeof import("three");
let shared: {
  renderer: import("three").WebGLRenderer;
  scene: import("three").Scene;
  camera: import("three").PerspectiveCamera;
} | null = null;

function getRenderer(THREE: ThreeNS) {
  if (shared) return shared;
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setSize(192, 192);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x445066, 1.15));
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(2.5, 4, 3);
  scene.add(key);
  // Portrait framing: the head spans roughly y 1.45–2.1.
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 20);
  camera.position.set(0, 1.74, 2.35);
  camera.lookAt(0, 1.66, 0);
  shared = { renderer, scene, camera };
  return shared;
}

const Thumb: React.FC<{ seed: string; size: number }> = ({ seed, size }) => {
  const [url, setUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    snapshot(seed).then(
      (u) => alive && setUrl(u),
      () => {}, // fallback SVG stays
    );
    return () => {
      alive = false;
    };
  }, [seed]);

  if (!url) {
    // Escape the context so the fallback renders the built-in Mii SVG.
    return (
      <AvatarImageContext.Provider value={null}>
        <Avatar seed={seed} size={size} />
      </AvatarImageContext.Provider>
    );
  }
  return (
    <img
      src={url}
      width={size}
      height={size}
      alt=""
      draggable={false}
      style={{ width: size, height: size, objectFit: "cover" }}
    />
  );
};

export const AvatarThumbProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <AvatarImageContext.Provider value={Thumb}>
    {children}
  </AvatarImageContext.Provider>
);
