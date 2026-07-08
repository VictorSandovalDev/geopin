"use client";

import * as React from "react";
import type { Location } from "@geopin/types";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useJsApiLoader } from "@react-google-maps/api";
import { MapResizer } from "./MapResizer";

export interface StreetViewProps {
  location: Location;
  allowPan?: boolean;
  allowZoom?: boolean;
}

/**
 * Street-level viewer. Picks the best source at runtime:
 *
 *  1. Google Street View Embed — set NEXT_PUBLIC_GOOGLE_MAPS_KEY.
 *     Best visuals. Requires Google Cloud + Maps Embed API enabled.
 *
 *  2. Mapillary — set NEXT_PUBLIC_MAPILLARY_TOKEN.
 *     Free, community-sourced. We query the nearest image at runtime.
 *
 *  3. Aerial preview — zero-config fallback. Honest "bird's-eye" satellite
 *     imagery. Not a real panorama; game is playable but less iconic.
 */
export const StreetView: React.FC<StreetViewProps> = ({
  location,
  allowPan = true,
  allowZoom = true,
}) => {
  const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  const mapillaryToken = process.env.NEXT_PUBLIC_MAPILLARY_TOKEN;

  if (googleKey) {
    return (
      <GoogleStreetView
        location={location}
        apiKey={googleKey}
        allowPan={allowPan}
        allowZoom={allowZoom}
      />
    );
  }

  if (mapillaryToken) {
    return <MapillaryView location={location} token={mapillaryToken} />;
  }

  return (
    <AerialFallback
      location={location}
      allowPan={allowPan}
      allowZoom={allowZoom}
    />
  );
};

/* ──────────────────── Google Street View (JS API panorama) ──────────────────── */

/**
 * Uses the Maps JavaScript StreetViewPanorama instead of the iframe embed so we
 * can disable the controls that would leak the answer — chiefly `addressControl`
 * (the place/address label Google paints in the top-left) and `showRoadLabels`
 * (street names baked over the imagery). The iframe embed gives no way to hide
 * these because its DOM is cross-origin.
 */
const GoogleStreetView: React.FC<{
  location: Location;
  apiKey: string;
  allowPan?: boolean;
  allowZoom?: boolean;
}> = ({ location, apiKey, allowPan = true, allowZoom = true }) => {
  // Share the same loader id as GuessMapGoogle so the API is loaded once.
  const { isLoaded, loadError } = useJsApiLoader({
    id: "geopin-gmaps",
    googleMapsApiKey: apiKey,
  });

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const panoRef = React.useRef<google.maps.StreetViewPanorama | null>(null);

  // Detach on unmount so keyed remounts don't leak panorama instances.
  React.useEffect(
    () => () => {
      panoRef.current?.setVisible(false);
      panoRef.current = null;
    },
    [],
  );

  // Pin to the exact panorama the StreetViewService returned when we have its
  // id, so the scene matches the revealed coordinates. Otherwise snap to the
  // nearest pano at the coordinates.
  const usePano = location.provider === "google" && !!location.providerRef;

  React.useEffect(() => {
    if (!isLoaded || !containerRef.current) return;

    const options: google.maps.StreetViewPanoramaOptions = {
      pov: { heading: 210, pitch: 10 },
      zoom: 1,
      // ── hide everything that reveals the location ──
      addressControl: false, // top-left place/address label
      showRoadLabels: false, // street-name overlays on the imagery
      linksControl: false, // navigation arrows carry street names
      // ── chrome we don't want in-game ──
      fullscreenControl: false,
      motionTracking: false,
      motionTrackingControl: false,
      enableCloseButton: false,
      clickToGo: allowPan,
      disableDoubleClickZoom: !allowZoom,
      scrollwheel: allowZoom,
      panControl: allowPan,
      zoomControl: allowZoom,
    };

    if (usePano) {
      options.pano = location.providerRef!;
    } else {
      options.position = { lat: location.lat, lng: location.lng };
    }

    if (!panoRef.current) {
      panoRef.current = new google.maps.StreetViewPanorama(
        containerRef.current,
        options,
      );
    } else {
      panoRef.current.setOptions(options);
      if (usePano) panoRef.current.setPano(location.providerRef!);
      else panoRef.current.setPosition({ lat: location.lat, lng: location.lng });
      panoRef.current.setPov({ heading: 210, pitch: 10 });
    }
  }, [
    isLoaded,
    usePano,
    location.providerRef,
    location.lat,
    location.lng,
    allowPan,
    allowZoom,
  ]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center w-full h-full rounded-2xl border border-red-500/40 bg-panel/40 text-red-400 text-sm p-6 text-center">
        Google Street View failed to load. Enable <b>Maps JavaScript API</b> in
        Google Cloud and check the HTTP referrer restrictions.
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-border">
      <div ref={containerRef} className="w-full h-full" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-panel/40 text-ink-muted text-sm">
          Loading panorama…
        </div>
      )}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 text-xs uppercase tracking-wider bg-panel/80 border border-brand-cyan/40 px-3 py-1 rounded-full pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse-ring" />
        Street View
      </div>
    </div>
  );
};

/* ──────────────────── Mapillary (runtime lookup + embed) ─────────────────── */

const MapillaryView: React.FC<{ location: Location; token: string }> = ({
  location,
  token,
}) => {
  const [imageId, setImageId] = React.useState<string | null>(null);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setImageId(null);
    setNotFound(false);

    const url =
      `https://graph.mapillary.com/images` +
      `?fields=id&closeto=${location.lng},${location.lat}` +
      `&limit=1&access_token=${token}`;

    fetch(url)
      .then((r) => r.json())
      .then((data: { data?: Array<{ id: string }> }) => {
        if (cancelled) return;
        const first = data.data?.[0];
        if (first?.id) setImageId(first.id);
        else setNotFound(true);
      })
      .catch(() => !cancelled && setNotFound(true));

    return () => {
      cancelled = true;
    };
  }, [location.lat, location.lng, token]);

  if (notFound) {
    return (
      <AerialFallback
        location={location}
        allowPan
        allowZoom
        reason="No Mapillary imagery near this location — showing aerial."
      />
    );
  }

  if (!imageId) {
    return (
      <div className="flex items-center justify-center w-full h-full rounded-2xl border border-border bg-panel/40 text-ink-muted text-sm">
        Loading panorama…
      </div>
    );
  }

  const src = `https://www.mapillary.com/embed?image_key=${imageId}&style=photo`;
  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-border">
      <iframe
        src={src}
        title="Mapillary view"
        className="w-full h-full"
        allow="fullscreen"
        style={{ border: 0 }}
      />
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 text-xs uppercase tracking-wider bg-panel/80 border border-brand-cyan/40 px-3 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse-ring" />
        Mapillary
      </div>
    </div>
  );
};

/* ──────────────────── Aerial fallback (zero-config) ──────────────────────── */

/**
 * MapContainer only reads `center` at mount — without this, every round after
 * the first keeps showing the previous location's imagery.
 */
const RecenterOnLocation: React.FC<{ lat: number; lng: number }> = ({
  lat,
  lng,
}) => {
  const map = useMap();
  React.useEffect(() => {
    map.setView([lat, lng], 13);
  }, [map, lat, lng]);
  return null;
};

const AerialFallback: React.FC<
  StreetViewProps & { reason?: string }
> = ({ location, allowPan, allowZoom, reason }) => {
  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-border">
      <MapContainer
        center={[location.lat, location.lng]}
        zoom={13}
        minZoom={8}
        maxZoom={18}
        dragging={allowPan}
        scrollWheelZoom={allowZoom}
        doubleClickZoom={allowZoom}
        zoomControl
        attributionControl={false}
        className="h-full w-full"
      >
        <MapResizer />
        <RecenterOnLocation lat={location.lat} lng={location.lng} />
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles © Esri"
        />
      </MapContainer>
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 text-xs uppercase tracking-wider bg-panel/80 border border-border px-3 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
        Aerial preview
      </div>
      <div className="absolute bottom-3 right-3 z-20 max-w-xs text-right text-[11px] text-ink-dim">
        {reason ??
          "Set NEXT_PUBLIC_GOOGLE_MAPS_KEY or NEXT_PUBLIC_MAPILLARY_TOKEN to enable real street-level view."}
      </div>
    </div>
  );
};
