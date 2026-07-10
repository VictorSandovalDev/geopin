"use client";

import * as React from "react";

/**
 * Icon-sized render of a single avatar part GLB (a hat, a jacket, a shoe…)
 * on a transparent background, so pickers show the real item instead of a
 * generic emoji. Snapshots share one offscreen renderer and are cached per
 * file+tint; the camera auto-frames each part from its bounding box.
 */

const cache = new Map<string, Promise<string>>();
let queue: Promise<unknown> = Promise.resolve();

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
    alpha: true,
    preserveDrawingBuffer: true,
  });
  renderer.setSize(128, 128);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x445066, 1.3));
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(2.5, 4, 3);
  scene.add(key);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 30);
  shared = { renderer, scene, camera };
  return shared;
}

function snapshotPart(file: string, tint: string | null): Promise<string> {
  const cacheKey = `${file}|${tint ?? ""}`;
  let p = cache.get(cacheKey);
  if (!p) {
    p = (queue = queue.catch(() => {}).then(async () => {
      const [{ loadPart, relaxPose, disposeGroup }, THREE] = await Promise.all([
        import("./Avatar3D"),
        import("three"),
      ]);
      const [SkeletonUtils, source] = await Promise.all([
        import("three/examples/jsm/utils/SkeletonUtils.js"),
        loadPart(file),
      ]);
      const part = SkeletonUtils.clone(source);
      relaxPose(part);
      part.traverse((obj) => {
        const mesh = obj as import("three").Mesh;
        if (!mesh.isMesh) return;
        mesh.frustumCulled = false;
        if (tint) {
          const m = (mesh.material as import("three").MeshStandardMaterial).clone();
          m.map = null;
          m.color = new THREE.Color(tint);
          mesh.material = m;
        }
      });

      const r = getRenderer(THREE);
      r.scene.add(part);
      // Skinned bounds come from the skeleton pose — update matrices first.
      part.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(part);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const radius = Math.max(size.x, size.y, size.z) * 0.5 || 0.1;
      const dist = (radius / Math.tan((r.camera.fov * Math.PI) / 360)) * 1.25;
      r.camera.position.set(center.x, center.y + radius * 0.15, center.z + dist);
      r.camera.lookAt(center);
      r.renderer.render(r.scene, r.camera);
      const url = r.renderer.domElement.toDataURL("image/png");
      r.scene.remove(part);
      disposeGroup(part);
      return url;
    })) as Promise<string>;
    cache.set(cacheKey, p);
    p.catch(() => cache.delete(cacheKey));
  }
  return p;
}

export const PartThumb3D: React.FC<{
  file: string;
  size: number;
  tint?: string | null;
  className?: string;
}> = ({ file, size, tint = null, className }) => {
  const [url, setUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    snapshotPart(file, tint).then(
      (u) => alive && setUrl(u),
      () => {},
    );
    return () => {
      alive = false;
    };
  }, [file, tint]);

  return url ? (
    <img
      src={url}
      width={size}
      height={size}
      alt=""
      draggable={false}
      className={className}
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  ) : (
    <span className={className} style={{ width: size, height: size, display: "inline-block" }} />
  );
};
