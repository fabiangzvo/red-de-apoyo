"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  CircleCheckBig,
  Locate,
  MapPin,
  PlusCircle,
  SlidersHorizontal,
  X,
  RefreshCcw,
  UserCheck,
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
  { label: "Todo", value: null },
  { label: "2 km", value: 2 },
  { label: "5 km", value: 5 },
  { label: "10 km", value: 10 },
];

const STATUS_OPTIONS = [
  { label: "Todos", value: null },
  { label: "Disponibles", value: "available" },
  { label: "Pendientes", value: "pending" },
  { label: "Reservados", value: "reserved" },
  { label: "Entregados", value: "delivered" },
];

export function HelpMapView({ points }: { points: PointWithItems[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const initialStatus = searchParams.get("status");

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(
    initialStatus,
  );
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [volunteerName, setVolunteerName] = useState("");
  const [volunteerContact, setVolunteerContact] = useState("");
  const [nameHint, setNameHint] = useState(false);
  const [requestingContact, setRequestingContact] = useState("");
  const [isDonation, setIsDonation] = useState<boolean>(false);

  useEffect(() => {
    const statusParam = searchParams.get("status");
    setStatusFilter(statusParam);
  }, [searchParams]);

  function handleStatusChange(value: string | null) {
    setStatusFilter(value);
    const params = new URLSearchParams(window.location.search);
    if (value) {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    const query = params.toString();
    const newUrl = query ? `/mapa?${query}` : "/mapa";
    router.replace(newUrl, { scroll: false });
  }

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
    const userRequestingStr = localStorage?.getItem("userRequesting") || "{}";

    if (userInfoStr) {
      const userInfo = JSON.parse(userInfoStr);
      const userRequesting = JSON.parse(userRequestingStr);

      setVolunteerName(userInfo?.name ?? "");
      setVolunteerContact(userInfo?.phone ?? "");
      setRequestingContact(userRequesting?.contact ?? "");
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      if (session.user.name) {
        setVolunteerName(session.user.name);
      }
      const contact = session.user.phone || session.user.email || "";
      if (contact) {
        setVolunteerContact(contact);
      }
    }
  }, [session]);

  const filtered = useMemo(() => {
    return points
      .map((p) => {
        const distance = userLocation
          ? haversineKm(userLocation, [p.lat, p.lng])
          : null;
        return { ...p, distance };
      })
      .filter((p) => {
        // Type filter: keep points that have at least one item of type
        if (
          isDonation !== null &&
          !p.items.some((i) => Boolean(i.isDonation) === isDonation)
        )
          return false;
        // Category filter: keep points that have at least one item in category
        if (category && !p.items.some((i) => i.category === category))
          return false;
        // Status filter: "delivered" requires all items to be delivered
        if (statusFilter === "delivered") {
          if (
            p.items.length === 0 ||
            !p.items.every((i) => i.status === "delivered")
          )
            return false;
        } else if (
          statusFilter &&
          !p.items.some((i) => i.status === statusFilter)
        ) {
          return false;
        }
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
  }, [points, category, statusFilter, radiusKm, userLocation, isDonation]);

  const selected = filtered.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-4 lg:grid lg:h-[calc(100svh-9rem)] lg:grid-cols-[380px_1fr]">
      {/* Sidebar */}
      <aside className="contents lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden lg:rounded-2xl lg:border lg:border-border lg:bg-card">
        {/* Filters */}
        <div className="order-1 rounded-2xl border border-border bg-card p-4 lg:order-none lg:rounded-none lg:border-0 lg:border-b lg:border-border">
          <div className="flex items-center gap-2 text-lg font-bold">
            <SlidersHorizontal className="size-4" aria-hidden />
            Filtros
          </div>
          <p className="font-semibold mt-4 text-sm">Me interesa</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[
              { label: "Apoyar", value: false },
              { label: "Solicitar Ayuda", value: true },
            ].map((c) => (
              <FilterChip
                key={c.value.toString()}
                active={isDonation === c.value}
                onClick={() => setIsDonation(c.value)}>
                {c.label}
              </FilterChip>
            ))}
          </div>
          <p className="font-semibold mt-4 text-sm">Categorias</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
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
          <p className="font-semibold mt-4 text-sm">Estado</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((s) => (
              <FilterChip
                key={s.label}
                active={statusFilter === s.value}
                onClick={() => handleStatusChange(s.value)}>
                {s.label}
              </FilterChip>
            ))}
          </div>
          <p className="font-semibold mt-4 text-sm flex gap-3 items-center justify-between w-full">
            <label>Radio de búsqueda</label>
            <Button variant="secondary" size="sm" onClick={useMyLocation}>
              <Locate className="size-4" aria-hidden />
              Mi ubicación
            </Button>
          </p>
          <div className="mt-2 flex items-center gap-2">
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
        <div className="order-3 min-h-0 flex-1 rounded-2xl border border-border bg-card p-4 overflow-y-auto lg:order-none lg:rounded-none lg:border-0">
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
                router.refresh();
              }}
              onRefresh={() => router.refresh()}
              requestingContact={requestingContact}
            />
          ) : (
            <PointList
              points={filtered}
              onSelect={setSelectedId}
              hasLocation={!!userLocation}
              onRefresh={() => router.refresh()}
            />
          )}
        </div>
      </aside>

      {/* Map */}
      <div className="order-2 relative h-[380px] sm:h-[420px] overflow-hidden rounded-2xl border border-border lg:order-none lg:h-auto">
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
  onRefresh,
}: {
  points: (PointWithItems & { distance: number | null })[];
  onSelect: (id: number) => void;
  hasLocation: boolean;
  onRefresh: () => void;
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
      <div className="flex justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {points.length} {points.length === 1 ? "punto" : "puntos"} de ayuda
        </p>
        <p>
          <RefreshCcw
            className="size-4 cursor-pointer"
            aria-hidden
            onClick={onRefresh}
          />
        </p>
      </div>
      {points.map((p) => {
        const pending = p.items.filter((i) => i.status === "pending").length;
        const reserved = p.items.filter((i) => i.status === "reserved").length;
        const delivered = p.items.filter(
          (i) => i.status === "delivered",
        ).length;
        const total = p.items.length;
        const allDone = total > 0 && delivered === total;
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className="w-full rounded-xl border border-border bg-background p-3.5 text-left transition-colors hover:border-primary/80 hover:cursor-pointer group hover:shadow-md hover:shadow-primary/10 ">
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium group-hover:text-primary">
                {p.name}
              </span>
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
              {p.id < 0 ? (
                <div className="flex items-center font-medium text-foreground">
                  <span>Ofrecido por: {p.contact || "Donante registrado"}</span>
                </div>
              ) : allDone ? (
                <span className="inline-flex items-center gap-1 font-medium text-delivered">
                  <CircleCheckBig className="size-3.5" aria-hidden />
                  Atendido completo
                </span>
              ) : (
                <div className="flex items-center gap-2.5">
                  {pending > 0 && (
                    <span className="inline-flex items-center gap-1 font-medium text-pending">
                      <StatusDot status="pending" />
                      {pending} {pending === 1 ? "pendiente" : "pendientes"}
                    </span>
                  )}
                  {reserved > 0 && (
                    <span className="inline-flex items-center gap-1 font-medium text-reserved">
                      <StatusDot status="reserved" />
                      {reserved} {reserved === 1 ? "reservado" : "reservados"}
                    </span>
                  )}
                </div>
              )}
              <span>
                {p.id < 0
                  ? `${Math.max(0, (p.items[0]?.quantity || 1) - (p.items[0]?.quantityReserved || 0))} disp. / ${p.items[0]?.quantity || 1} total`
                  : `${total} ítems`}
              </span>
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
  requestingContact,
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
  requestingContact: string;
}) {
  const { data: session } = useSession();
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

      {session?.user ? (
        <div className="flex items-center gap-3 rounded-lg border shadow-md shadow-primary/10 bg-background p-3 text-xs">
          <UserCheck className="size-5 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-primary truncate">
              {session.user.name || "Donante Autenticado"}
            </p>
            <p className="text-muted-foreground truncate text-[11px]">
              {session.user.phone || session.user.email} • Donante registrado
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              {point.id < 0
                ? "Tu nombre (Solicitante / Damnificado)"
                : "Tu nombre como voluntario / organización"}{" "}
              <span className="text-destructive">*</span>
            </span>
            <input
              value={volunteerName}
              onChange={(e) => setVolunteerName(e.target.value)}
              placeholder={
                point.id < 0
                  ? "Ej: María Rodríguez / Familia Pérez"
                  : "Ej: Andrés / Fundación Manos Unidas"
              }
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
              Número de contacto (Teléfono / WhatsApp){" "}
              <span className="text-destructive">*</span>
            </span>
            <input
              type="tel"
              value={volunteerContact}
              onChange={(e) =>
                setVolunteerContact(e.target.value.replace(/\D/g, ""))
              }
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
              {point.id < 0
                ? "Completa tu nombre y teléfono para que el donante pueda comunicarse contigo."
                : "Completa tu nombre y número de contacto para poder reservar un ítem."}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {point.items.map((item) => {
          const currentUserId = session?.user?.id
            ? parseInt(session.user.id, 10)
            : null;
          const isItemOwner =
            !!point.contact &&
            !!volunteerContact &&
            (point.contact === volunteerContact ||
              item.reservedByContact === volunteerContact ||
              (Boolean(session?.user) &&
                (item.userId === currentUserId ||
                  point.contact === session?.user?.phone)));

          console.log(
            isItemOwner,
            volunteerContact,
            item.userId,
            item,
            point,
            session?.user,
          );
          return (
            <ItemRow
              key={item.id}
              item={item}
              volunteerName={volunteerName}
              volunteerContact={volunteerContact}
              onNeedName={onNeedName}
              onRefresh={onRefresh}
              isOwner={isItemOwner}
              pointId={point.id}
              canDelete={point.contact === volunteerContact}
            />
          );
        })}
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
          : "border-border bg-background hover:text-primary hover:bg-primary/20 hover:cursor-pointer",
      )}>
      {children}
    </button>
  );
}

export function EmptyState() {
  return (
    <div className="mx-auto max-w-md rounded-2xl bg-card p-8 text-center">
      <MapPin
        className="mx-auto size-12 text-[#CE1126] [&>circle]:fill-background [&>circle]:stroke-background [&>path]:fill-[#CE1126]"
        aria-hidden
      />
      <h2 className="mt-4 font-display text-xl font-bold">Aún no hay puntos</h2>
      <p className="mt-2 text-lg leading-relaxed text-muted-foreground">
        Todavía nadie ha publicado una lista de necesidades. Agradecemos tu
        disposición.
      </p>
    </div>
  );
}
