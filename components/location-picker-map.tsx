"use client"

import { useEffect } from "react"
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "@/lib/constants"

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:28px;height:28px;border-radius:50% 50% 50% 0;
    background:var(--primary);transform:rotate(-45deg);
    border:2px solid var(--background);
    box-shadow:0 2px 6px rgba(0,0,0,0.35);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 26],
})

function ClickHandler({
  onChange,
}: {
  onChange: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function Recenter({ position }: { position: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.setView(position, Math.max(map.getZoom(), 15))
  }, [position, map])
  return null
}

export default function LocationPickerMap({
  value,
  onChange,
}: {
  value: [number, number] | null
  onChange: (lat: number, lng: number) => void
}) {
  return (
    <MapContainer
      center={value ?? DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onChange={onChange} />
      <Recenter position={value} />
      {value && <Marker position={value} icon={pinIcon} />}
    </MapContainer>
  )
}
