"use client"

import { useEffect } from "react"
import { Circle, MapContainer, Marker, TileLayer, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "@/lib/constants"
import type { PointWithItems } from "@/app/actions/needs"

function markerColor(point: PointWithItems) {
  const pending = point.items.filter((i) => i.status === "pending").length
  const reserved = point.items.filter((i) => i.status === "reserved").length
  if (pending > 0) return "var(--pending)"
  if (reserved > 0) return "var(--reserved)"
  return "var(--delivered)"
}

function makeIcon(point: PointWithItems, selected: boolean) {
  const color = markerColor(point)
  const pending = point.items.filter((i) => i.status === "pending").length
  const size = selected ? 40 : 34
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:${size}px;height:${size}px;">
      <div style="
        width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;
        background:${color};transform:rotate(-45deg);
        border:2px solid var(--background);
        box-shadow:0 2px 8px rgba(0,0,0,0.4);
        ${selected ? "outline:3px solid var(--primary);outline-offset:2px;" : ""}
      "></div>
      ${
        pending > 0
          ? `<span style="position:absolute;top:-6px;right:-6px;min-width:18px;height:18px;
              padding:0 4px;border-radius:9px;background:var(--background);color:${color};
              border:1.5px solid ${color};font-size:11px;font-weight:700;line-height:15px;
              text-align:center;font-family:var(--font-sans);">${pending}</span>`
          : ""
      }
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size - 4],
  })
}

function ViewController({
  focus,
  userLocation,
}: {
  focus: [number, number] | null
  userLocation: [number, number] | null
}) {
  const map = useMap()
  useEffect(() => {
    if (focus) map.setView(focus, Math.max(map.getZoom(), 15), { animate: true })
  }, [focus, map])
  useEffect(() => {
    if (userLocation && !focus) map.setView(userLocation, 13, { animate: true })
  }, [userLocation, focus, map])
  return null
}

const userIcon = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:50%;background:var(--primary);
    border:3px solid var(--background);box-shadow:0 0 0 4px color-mix(in oklab,var(--primary) 30%,transparent);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

export default function HelpMap({
  points,
  selectedId,
  onSelect,
  userLocation,
  radiusKm,
}: {
  points: PointWithItems[]
  selectedId: number | null
  onSelect: (id: number) => void
  userLocation: [number, number] | null
  radiusKm: number | null
}) {
  const focus =
    selectedId != null
      ? (() => {
          const p = points.find((x) => x.id === selectedId)
          return p ? ([p.lat, p.lng] as [number, number]) : null
        })()
      : null

  return (
    <MapContainer
      center={userLocation ?? DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ViewController focus={focus} userLocation={userLocation} />

      {userLocation && radiusKm && (
        <Circle
          center={userLocation}
          radius={radiusKm * 1000}
          pathOptions={{
            color: "var(--primary)",
            fillColor: "var(--primary)",
            fillOpacity: 0.06,
            weight: 1,
          }}
        />
      )}
      {userLocation && <Marker position={userLocation} icon={userIcon} />}

      {points.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={makeIcon(p, p.id === selectedId)}
          eventHandlers={{ click: () => onSelect(p.id) }}
        />
      ))}
    </MapContainer>
  )
}
