"use client";

import * as React from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import type { LatLng } from "@geopin/types";

export interface GuessMapGoogleProps {
  guess?: LatLng | null;
  truth?: LatLng | null;
  otherGuesses?: Array<LatLng & { username?: string }>;
  onGuessChange?: (g: LatLng) => void;
  disabled?: boolean;
  apiKey: string;
  /** Changes per round — used to force cleanup of leftover overlays. */
  roundKey?: number | string;
}

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };
const DEFAULT_CENTER = { lat: 20, lng: 0 };

/**
 * Imperatively-managed Google Map. @react-google-maps/api's declarative
 * <Polyline> / <Marker> components don't always tear down on unmount, so we
 * hold refs to the overlays and explicitly call setMap(null) before redraw.
 * That guarantees no leftover lines/markers leak between rounds.
 */
export const GuessMapGoogle: React.FC<GuessMapGoogleProps> = ({
  guess,
  truth,
  otherGuesses,
  onGuessChange,
  disabled,
  apiKey,
  roundKey,
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "geopin-gmaps",
    googleMapsApiKey: apiKey,
  });

  const [map, setMap] = React.useState<google.maps.Map | null>(null);

  const guessMarkerRef = React.useRef<google.maps.Marker | null>(null);
  const truthMarkerRef = React.useRef<google.maps.Marker | null>(null);
  const polylineRef = React.useRef<google.maps.Polyline | null>(null);
  const otherMarkersRef = React.useRef<google.maps.Marker[]>([]);

  const clearOverlays = React.useCallback(() => {
    guessMarkerRef.current?.setMap(null);
    guessMarkerRef.current = null;
    truthMarkerRef.current?.setMap(null);
    truthMarkerRef.current = null;
    polylineRef.current?.setMap(null);
    polylineRef.current = null;
    for (const m of otherMarkersRef.current) m.setMap(null);
    otherMarkersRef.current = [];
  }, []);

  // Re-render overlays on any relevant change — always clear first.
  React.useEffect(() => {
    if (!map || !isLoaded) return;
    clearOverlays();

    if (guess) {
      guessMarkerRef.current = new google.maps.Marker({
        map,
        position: { lat: guess.lat, lng: guess.lng },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: "#22E9FF",
          fillOpacity: 1,
          strokeColor: "#080B1A",
          strokeWeight: 2,
        },
      });
    }
    if (truth) {
      truthMarkerRef.current = new google.maps.Marker({
        map,
        position: { lat: truth.lat, lng: truth.lng },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: "#FFC93C",
          fillOpacity: 1,
          strokeColor: "#080B1A",
          strokeWeight: 2,
        },
      });
    }
    if (guess && truth) {
      polylineRef.current = new google.maps.Polyline({
        map,
        path: [
          { lat: guess.lat, lng: guess.lng },
          { lat: truth.lat, lng: truth.lng },
        ],
        strokeOpacity: 0,
        icons: [
          {
            icon: {
              path: "M 0,-1 0,1",
              strokeOpacity: 1,
              strokeColor: "#22E9FF",
              scale: 3,
            },
            offset: "0",
            repeat: "12px",
          },
        ],
      });
    }
    if (otherGuesses?.length) {
      for (const g of otherGuesses) {
        const m = new google.maps.Marker({
          map,
          position: { lat: g.lat, lng: g.lng },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#8B5CF6",
            fillOpacity: 1,
            strokeColor: "#080B1A",
            strokeWeight: 2,
          },
        });
        otherMarkersRef.current.push(m);
      }
    }
  }, [
    map,
    isLoaded,
    clearOverlays,
    guess?.lat,
    guess?.lng,
    truth?.lat,
    truth?.lng,
    roundKey,
    otherGuesses?.map((g) => `${g.lat},${g.lng}`).join("|"),
  ]);

  // Unmount cleanup
  React.useEffect(() => () => clearOverlays(), [clearOverlays]);

  const handleClick = React.useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (disabled || !e.latLng) return;
      onGuessChange?.({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    },
    [onGuessChange, disabled],
  );

  // Frame guess + truth when both exist (reveal animation).
  // Uses a symmetric padding so the two points sit comfortably in the viewport
  // and clamps the zoom so nearby guesses don't zoom in so deep that you lose
  // the 2D context, and far-apart ones don't zoom out past a readable level.
  React.useEffect(() => {
    if (!map || !guess || !truth || !isLoaded) return;
    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: guess.lat, lng: guess.lng });
    bounds.extend({ lat: truth.lat, lng: truth.lng });
    map.fitBounds(bounds, { top: 90, bottom: 90, left: 70, right: 70 });

    // Clamp zoom after fitBounds finishes its own async layout.
    const listener = google.maps.event.addListenerOnce(map, "idle", () => {
      const z = map.getZoom() ?? 2;
      if (z > 12) map.setZoom(12); // too zoomed in on a very close guess
      if (z < 3) map.setZoom(3); // opposite ends of the earth
    });
    return () => google.maps.event.removeListener(listener);
  }, [map, guess?.lat, guess?.lng, truth?.lat, truth?.lng, isLoaded]);

  // Reset to world on round change — BUT only if we're not in reveal mode.
  // Otherwise we'd undo the fitBounds above and leave the player staring at
  // an empty world map when the round ends.
  React.useEffect(() => {
    if (!map || !isLoaded) return;
    if (truth) return; // reveal in progress — fitBounds owns the view
    map.panTo(DEFAULT_CENTER);
    map.setZoom(2);
  }, [roundKey, map, isLoaded, truth]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center w-full h-full rounded-2xl border border-red-500/40 bg-panel/40 text-red-400 text-sm p-6 text-center">
        Google Maps failed to load. Enable <b>Maps JavaScript API</b> in Google
        Cloud and verify the HTTP referrer restrictions.
      </div>
    );
  }
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center w-full h-full rounded-2xl border border-border bg-panel/40 text-ink-muted text-sm">
        Loading map…
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-border">
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={DEFAULT_CENTER}
        zoom={2}
        onLoad={(m) => setMap(m)}
        onUnmount={() => {
          clearOverlays();
          setMap(null);
        }}
        onClick={handleClick}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          streetViewControl: false,
          fullscreenControl: false,
          mapTypeControl: false,
          clickableIcons: false,
          gestureHandling: "greedy",
          minZoom: 2,
          restriction: {
            latLngBounds: { north: 85, south: -85, east: 180, west: -180 },
            strictBounds: true,
          },
        }}
      />
    </div>
  );
};
