"use client";

import * as React from "react";
import { useMap } from "react-leaflet";

/**
 * Leaflet caches the container size at mount. When MapContainer is rendered
 * inside a flex/grid whose height resolves on a later layout pass, the map
 * ends up with `getSize() === 0×0` and no tiles load.
 *
 * This helper runs inside <MapContainer> via useMap(), then:
 *   1. Calls invalidateSize on the next animation frame (covers the common case).
 *   2. Subscribes a ResizeObserver to the container so subsequent resizes
 *      (window, sidebar collapse, orientation change) stay in sync.
 */
export const MapResizer: React.FC = () => {
  const map = useMap();
  React.useEffect(() => {
    const raf = requestAnimationFrame(() => map.invalidateSize());
    const container = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(container);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [map]);
  return null;
};
