"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CircleCheckBig,
  Locate,
  MapPin,
  PlusCircle,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemRow } from "@/components/item-row";
import { StatusDot } from "@/components/status-badge";
import { CATEGORIES } from "@/lib/constants";
import { haversineKm } from "@/lib/geo";
import type { PointWithItems } from "@/app/actions/needs";
import { cn } from "@/lib/utils";

const HelpMap = dynamic(() => import("@/components/help-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
      Cargando mapa…
    </div>
  ),
});

const RADIUS_OPTIONS = [
  { label: "5 km", value: 5 },
  { label: "15 km", value: 15 },
  { label: "50 km", value: 50 },
  { label: "Todo", value: null },
];

export function HelpMapView({ points }: { points: PointWithItems[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [volunteerName, setVolunteerName] = useState("");
  const [volunteerContact, setVolunteerContact] = useState("");
  const [nameHint, setNameHint] = useState(false);

  function useMyLocation() {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  useEffect(() => {
    if (typeof window === "undefined") return;

    const userInfoStr = localStorage?.getItem("userInfo") || "{}";

    if (userInfoStr) {
      const userInfo = JSON.parse(userInfoStr);

      setVolunteerName(userInfo?.name ?? "");
      setVolunteerContact(userInfo?.phone ?? "");
    }
  }, []);

  const filtered = useMemo(() => {
    return points
      .map((p) => {
        const distance = userLocation
          ? haversineKm(userLocation, [p.lat, p.lng])
          : null;
        return { ...p, distance };
      })
      .filter((p) => {
        // Category filter: keep points that have at least one item in category
        if (category && !p.items.some((i) => i.category === category))
          return false;
        // Radius filter (only when we know user location)
        if (radiusKm != null && p.distance != null && p.distance > radiusKm)
          return false;
        return true;
      })
      .sort((a, b) => {
        if (a.distance != null && b.distance != null)
          return a.distance - b.distance;
        return 0;
      });
  }, [points, category, radiusKm, userLocation]);

  const selected = filtered.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="grid gap-4 lg:h-[calc(100svh-9rem)] lg:grid-cols-[380px_1fr]">
      {/* Sidebar */}
      <aside className="flex min-h-0 flex-col rounded-2xl border border-border bg-card">
        {/* Filters */}
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal className="size-4" aria-hidden />
            Filtros
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <FilterChip
              active={category === null}
              onClick={() => setCategory(null)}>
              Todas
            </FilterChip>
            {CATEGORIES.map((c) => (
              <FilterChip
                key={c.value}
                active={category === c.value}
                onClick={() => setCategory(c.value)}>
                {c.label}
              </FilterChip>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={useMyLocation}>
              <Locate className="size-4" aria-hidden />
              Mi ubicación
            </Button>
            <div className="flex flex-1 flex-wrap gap-1.5">
              {RADIUS_OPTIONS.map((r) => (
                <FilterChip
                  key={r.label}
                  active={radiusKm === r.value}
                  disabled={!userLocation && r.value != null}
                  onClick={() => setRadiusKm(r.value)}>
                  {r.label}
                </FilterChip>
              ))}
            </div>
          </div>
          {!userLocation && (
            <p className="mt-2 text-xs text-muted-foreground">
              Activa tu ubicación para filtrar por distancia.
            </p>
          )}
        </div>

        {/* List / detail */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {selected ? (
            <PointDetail
              point={selected}
              volunteerName={volunteerName}
              setVolunteerName={setVolunteerName}
              volunteerContact={volunteerContact}
              setVolunteerContact={setVolunteerContact}
              nameHint={nameHint}
              onNeedName={() => setNameHint(true)}
              onBack={() => {
                setSelectedId(null);
                setNameHint(false);
              }}
              onRefresh={() => router.refresh()}
            />
          ) : (
            <PointList
              points={filtered}
              onSelect={setSelectedId}
              hasLocation={!!userLocation}
            />
          )}
        </div>
      </aside>

      {/* Map */}
      <div className="relative h-[420px] overflow-hidden rounded-2xl border border-border lg:h-auto">
        <HelpMap
          points={filtered}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            setNameHint(false);
          }}
          userLocation={userLocation}
          radiusKm={radiusKm}
        />
      </div>
    </div>
  );
}

function PointList({
  points,
  onSelect,
  hasLocation,
}: {
  points: (PointWithItems & { distance: number | null })[];
  onSelect: (id: number) => void;
  hasLocation: boolean;
}) {
  if (points.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Sin resultados</p>
        <p className="mt-1">No hay puntos que coincidan con tus filtros.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {points.length} {points.length === 1 ? "punto" : "puntos"} de ayuda
      </p>
      {points.map((p) => {
        const pending = p.items.filter((i) => i.status === "pending").length;
        const total = p.items.length;
        const delivered = p.items.filter(
          (i) => i.status === "delivered",
        ).length;
        const allDone = total > 0 && delivered === total;
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className="w-full rounded-xl border border-border bg-background p-3.5 text-left transition-colors hover:border-primary/50 hover:bg-muted/40">
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium">{p.name}</span>
              {p.distance != null && (
                <span className="shrink-0 text-xs font-medium text-muted-foreground">
                  {p.distance < 1
                    ? `${Math.round(p.distance * 1000)} m`
                    : `${p.distance.toFixed(1)} km`}
                </span>
              )}
            </div>
            {p.note && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {p.note}
              </p>
            )}
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              {allDone ? (
                <span className="inline-flex items-center gap-1 font-medium text-delivered">
                  <CircleCheckBig className="size-3.5" aria-hidden />
                  Atendido completo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-medium text-pending">
                  <StatusDot status="pending" />
                  {pending} {pending === 1 ? "pendiente" : "pendientes"}
                </span>
              )}
              <span>{total} ítems</span>
            </div>
          </button>
        );
      })}
      {!hasLocation && (
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Activa tu ubicación para ordenar por cercanía.
        </p>
      )}
    </div>
  );
}

function PointDetail({
  point,
  volunteerName,
  setVolunteerName,
  volunteerContact,
  setVolunteerContact,
  nameHint,
  onNeedName,
  onBack,
  onRefresh,
}: {
  point: PointWithItems & { distance: number | null };
  volunteerName: string;
  setVolunteerName: (v: string) => void;
  volunteerContact: string;
  setVolunteerContact: (v: string) => void;
  nameHint: boolean;
  onNeedName: () => void;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const total = point.items.length;
  const delivered = point.items.filter((i) => i.status === "delivered").length;
  const allDone = total > 0 && delivered === total;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold leading-tight">
            {point.name}
          </h2>
          {point.note && (
            <p className="mt-0.5 text-sm text-muted-foreground">{point.note}</p>
          )}
          {point.contact && (
            <p className="mt-1 text-sm text-muted-foreground">
              Contacto: <span className="text-foreground">{point.contact}</span>
            </p>
          )}
          {point.distance != null && (
            <p className="mt-1 text-xs text-muted-foreground">
              A{" "}
              {point.distance < 1
                ? `${Math.round(point.distance * 1000)} m`
                : `${point.distance.toFixed(1)} km`}{" "}
              de ti
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onBack}
          aria-label="Cerrar detalle">
          <X className="size-4" aria-hidden />
        </Button>
      </div>

      {allDone && (
        <div className="rounded-lg border border-delivered/30 bg-delivered/10 p-3 text-sm text-delivered">
          ¡Gracias! Todos los requerimientos de este punto fueron atendidos.
        </div>
      )}

      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Tu nombre como voluntario / organización{" "}
            <span className="text-destructive">*</span>
          </span>
          <input
            value={volunteerName}
            onChange={(e) => setVolunteerName(e.target.value)}
            placeholder="Ej: Andrés / Fundación Manos Unidas"
            className={cn(
              "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:ring-3 focus-visible:ring-ring/30",
              nameHint && !volunteerName.trim()
                ? "border-destructive"
                : "border-input focus-visible:border-ring",
            )}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Número de contacto <span className="text-destructive">*</span>
          </span>
          <input
            type="tel"
            value={volunteerContact}
            onChange={(e) => setVolunteerContact(e.target.value)}
            placeholder="Ej: 300 123 4567"
            className={cn(
              "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:ring-3 focus-visible:ring-ring/30",
              nameHint && !volunteerContact.trim()
                ? "border-destructive"
                : "border-input focus-visible:border-ring",
            )}
          />
        </label>

        {nameHint && (!volunteerName.trim() || !volunteerContact.trim()) && (
          <span className="text-xs text-destructive">
            Completa tu nombre y número de contacto para poder reservar un ítem.
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {point.items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            volunteerName={volunteerName}
            volunteerContact={volunteerContact}
            onNeedName={onNeedName}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-muted",
      )}>
      {children}
    </button>
  );
}

export function EmptyState() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center">
      <MapPin className="mx-auto size-8 text-muted-foreground" aria-hidden />
      <h2 className="mt-4 font-display text-xl font-bold">Aún no hay puntos</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Todavía nadie ha publicado una lista de necesidades. Sé el primero en
        registrar un punto de ayuda.
      </p>
      <Button className="mt-5" render={<Link href="/solicitar" />}>
        <PlusCircle className="size-4" aria-hidden />
        Solicitar ayuda
      </Button>
    </div>
  );
}
