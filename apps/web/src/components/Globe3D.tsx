"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";

/**
 * Interactive 3D globe for the landing hero (GeoGuessr-style). WebGL via
 * cobe (~5 kB). Auto-rotates and can be dragged with the mouse / touch.
 */
export function Globe3D({ size = 560 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Rotation state lives in refs so the render loop reads fresh values
  // without re-creating the globe.
  const phiRef = useRef(0);
  const pointerStart = useRef<number | null>(null);
  const pointerDelta = useRef(0);
  const velocity = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let width = 0;
    const onResize = () => {
      width = canvas.offsetWidth;
    };
    onResize();
    window.addEventListener("resize", onResize);

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.24,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 20000,
      mapBrightness: 5.2,
      baseColor: [0.12, 0.17, 0.36],     // deep night blue (brand void)
      markerColor: [0.13, 0.91, 1],      // brand cyan
      glowColor: [0.1, 0.45, 0.75],
      markers: [
        { location: [4.711, -74.072], size: 0.09 },   // Bogotá
        { location: [6.244, -75.581], size: 0.06 },   // Medellín
        { location: [19.433, -99.133], size: 0.07 },  // CDMX
        { location: [-34.604, -58.382], size: 0.07 }, // Buenos Aires
        { location: [-23.551, -46.633], size: 0.07 }, // São Paulo
        { location: [40.417, -3.704], size: 0.06 },   // Madrid
        { location: [48.857, 2.352], size: 0.06 },    // Paris
        { location: [35.677, 139.766], size: 0.07 },  // Tokyo
        { location: [40.713, -74.006], size: 0.07 },  // New York
        { location: [-33.869, 151.209], size: 0.06 }, // Sydney
        { location: [30.044, 31.236], size: 0.05 },   // Cairo
        { location: [-1.292, 36.822], size: 0.05 },   // Nairobi
      ],
      onRender: (state) => {
        // Inertial rotation: drag sets velocity, idle drifts slowly.
        if (pointerStart.current === null) {
          phiRef.current += velocity.current;
          velocity.current *= 0.93; // friction
          phiRef.current += 0.0035; // idle drift
        }
        state.phi = phiRef.current + pointerDelta.current;
        state.width = width * 2;
        state.height = width * 2;
      },
    });

    return () => {
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const endDrag = () => {
    if (pointerStart.current === null) return;
    phiRef.current += pointerDelta.current;
    pointerStart.current = null;
    pointerDelta.current = 0;
  };

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        maxWidth: size,
        aspectRatio: "1",
        cursor: "grab",
        contain: "layout paint size",
      }}
      className="mx-auto select-none touch-none [&:active]:cursor-grabbing"
      onPointerDown={(e) => {
        pointerStart.current = e.clientX;
        velocity.current = 0;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (pointerStart.current === null) return;
        const delta = (e.clientX - pointerStart.current) / 120;
        velocity.current = delta - pointerDelta.current;
        pointerDelta.current = delta;
      }}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
    />
  );
}
