"use client";

import * as React from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { LatLng } from "@geopin/types";
import { MapResizer } from "./MapResizer";

const ACTOR_ICON = L.divIcon({
  className: "",
  html: `
    <div style="transform: translate(-50%,-50%);">
      <div style="
        width:20px;height:20px;border-radius:50%;
        background:linear-gradient(135deg,#22E9FF,#8B5CF6,#FF3CAC);
        box-shadow:0 0 18px rgba(34,233,255,0.8);
        border:2px solid white;"></div>
    </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const TRUTH_ICON = L.divIcon({
  className: "",
  html: `
    <div style="transform: translate(-50%,-50%);">
      <div style="
        width:22px;height:22px;border-radius:50%;
        background:radial-gradient(circle,#FFC93C 0%,#E67A00 80%);
        box-shadow:0 0 20px rgba(255,201,60,0.8);
        border:2px solid white;"></div>
    </div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

interface ClickCaptureProps {
  onClick: (latlng: LatLng) => void;
  disabled?: boolean;
}

function ClickCapture({ onClick, disabled }: ClickCaptureProps) {
  useMapEvents({
    click(e) {
      if (!disabled) onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export interface GuessMapProps {
  guess?: LatLng | null;
  truth?: LatLng | null;
  otherGuesses?: Array<LatLng & { username?: string }>;
  onGuessChange?: (g: LatLng) => void;
  disabled?: boolean;
  height?: number | string;
}

export const GuessMap: React.FC<GuessMapProps> = ({
  guess,
  truth,
  otherGuesses,
  onGuessChange,
  disabled,
  height = "100%",
}) => {
  return (
    <div
      style={{ height }}
      className="relative w-full rounded-2xl overflow-hidden border border-border"
    >
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        worldCopyJump
        className="h-full w-full"
      >
        <MapResizer />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickCapture
          onClick={(ll) => onGuessChange?.(ll)}
          disabled={disabled}
        />
        {guess && <Marker position={[guess.lat, guess.lng]} icon={ACTOR_ICON} />}
        {truth && <Marker position={[truth.lat, truth.lng]} icon={TRUTH_ICON} />}
        {guess && truth && (
          <Polyline
            positions={[
              [guess.lat, guess.lng],
              [truth.lat, truth.lng],
            ]}
            pathOptions={{
              color: "#22E9FF",
              weight: 3,
              dashArray: "6 8",
              opacity: 0.9,
            }}
          />
        )}
        {otherGuesses?.map((g, i) => (
          <Marker key={i} position={[g.lat, g.lng]} icon={ACTOR_ICON} />
        ))}
      </MapContainer>
    </div>
  );
};
