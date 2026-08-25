"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Gift,
  MapPin,
  Phone,
  User,
  Search,
  X,
  SlidersHorizontal,
  RefreshCw,
  ChevronDown,
  HandHeart,
  LoaderCircle,
  Undo2,
  CircleCheckBig,
  AlertCircle,
  Trash2,
} from "lucide-react";
import {
  categoryLabel,
  categoryColor,
  CATEGORIES,
  getItemEffectiveStatus,
  type ItemStatus,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import type { DonorOffer } from "@/lib/db/schema";
import { reserveItemQuantity, releaseItem, deliverItem } from "@/app/actions/needs";

export interface DonorOfferExtended extends DonorOffer {
  quantityReserved?: number | null;
  reservedBy?: string | null;
  reservedByContact?: string | null;
}

interface DonorOffersSectionProps {
  offers: DonorOfferExtended[];
  isStandaloneView?: boolean;
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
          ? "border-primary bg-primary text-primary-foreground font-semibold"
          : "border-border bg-background hover:text-primary hover:bg-primary/20 hover:cursor-pointer",
      )}>
      {children}
    </button>
  );
}

function RequestHelpModal({
  isOpen,
  onClose,
  offer,
  volunteerName,
  volunteerContact,
  setVolunteerName,
  setVolunteerContact,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  offer: DonorOfferExtended;
  volunteerName: string;
  volunteerContact: string;
  setVolunteerName: (val: string) => void;
  setVolunteerContact: (val: string) => void;
  onSuccess: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [nameHint, setNameHint] = useState(false);

  const totalQty = offer.quantity || 1;
  const reservedQty = offer.quantityReserved || 0;
  const availableQty = Math.max(0, totalQty - reservedQty);

  const [requestQty, setRequestQty] = useState<number>(
    availableQty > 0 ? 1 : 0,
  );

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setNameHint(false);
      setRequestQty(availableQty > 0 ? 1 : 0);
    }
  }, [isOpen, availableQty]);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!volunteerName.trim() || !volunteerContact.trim()) {
      setNameHint(true);
      return;
    }
    setNameHint(false);

    if (typeof window !== "undefined") {
      localStorage.setItem(
        "userRequesting",
        JSON.stringify({
          name: volunteerName.trim(),
          contact: volunteerContact.trim(),
        }),
      );
    }

    setError(null);
    startTransition(async () => {
      const res = await reserveItemQuantity(
        offer.id,
        volunteerName.trim(),
        volunteerContact.trim(),
        requestQty,
      );
      if (!res.ok) {
        setError(res.error || "No se pudo solicitar la donación.");
      } else {
        onSuccess();
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-background shadow-2xl transition-all z-10 my-auto flex flex-col">
        {/* Close Button */}
        <Button
          variant="tertiary"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex size-8 items-center justify-center rounded-full transition"
          aria-label="Cerrar modal">
          <X className="size-4" />
        </Button>

        {/* Modal Header */}
        <div className="relative bg-gradient-to-b from-primary/10 via-primary/5 to-transparent px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={cn(
                "rounded-md border px-2 py-0.5 text-xs font-semibold shadow-xs",
                categoryColor(offer.category),
              )}>
              {categoryLabel(offer.category)}
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              {availableQty} disponible{availableQty === 1 ? "" : "s"}
            </span>
          </div>
          <h2 className="text-lg font-bold font-display tracking-tight text-foreground pr-6">
            Solicitar: {offer.title}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Ofrecido por:{" "}
            <strong className="text-foreground">{offer.donorName}</strong>
          </p>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-2 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Tu nombre (Solicitante / Damnificado){" "}
                <span className="text-destructive">*</span>
              </span>
              <input
                value={volunteerName}
                onChange={(e) => setVolunteerName(e.target.value)}
                placeholder="Ej: María Rodríguez / Familia Pérez"
                className={cn(
                  "w-full rounded-xl border bg-background px-3 py-2 text-sm outline-hidden placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary/30",
                  nameHint && !volunteerName.trim()
                    ? "border-destructive"
                    : "border-input",
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
                  "w-full rounded-xl border bg-background px-3 py-2 text-sm outline-hidden placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary/30",
                  nameHint && !volunteerContact.trim()
                    ? "border-destructive"
                    : "border-input",
                )}
              />
            </label>

            {nameHint &&
              (!volunteerName.trim() || !volunteerContact.trim()) && (
                <span className="text-xs text-destructive block">
                  Completa tu nombre y teléfono para poder solicitar esta ayuda.
                </span>
              )}

            <div className="pt-1">
              <label className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground mb-1.5">
                <span>Cantidad a solicitar (Máx: {availableQty})</span>
              </label>
              <input
                type="number"
                min={1}
                max={availableQty}
                value={requestQty}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (isNaN(val)) setRequestQty(1);
                  else setRequestQty(Math.min(availableQty, Math.max(1, val)));
                }}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-1/2">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={pending || availableQty <= 0}
              className="w-1/2 gap-1.5">
              {pending ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              ) : (
                <HandHeart className="size-4" aria-hidden />
              )}
              {`Solicitar ${requestQty} ${requestQty === 1 ? "unidad" : "unidades"}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OfferCard({
  offer,
  volunteerName,
  volunteerContact,
  setVolunteerName,
  setVolunteerContact,
}: {
  offer: DonorOfferExtended;
  volunteerName: string;
  volunteerContact: string;
  setVolunteerName: (val: string) => void;
  setVolunteerContact: (val: string) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const status = getItemEffectiveStatus({
    status: offer.status,
    quantity: offer.quantity,
    quantityReserved: offer.quantityReserved,
    isDonation: true,
  });

  const totalQty = offer.quantity || 1;
  const reservedQty = offer.quantityReserved || 0;
  const availableQty =
    status === "delivered" || status === "reserved"
      ? 0
      : Math.max(0, totalQty - reservedQty);

  const isCurrentUserReserved =
    Boolean(volunteerContact.trim()) &&
    offer.reservedByContact === volunteerContact.trim();

  function handleDeliver() {
    setError(null);
    startTransition(async () => {
      const res = await deliverItem(offer.id, volunteerContact);
      if (!res.ok) {
        setError("No se pudo entregar.");
      } else {
        router.refresh();
      }
    });
  }

  function handleRelease() {
    setError(null);
    startTransition(async () => {
      const res = await releaseItem(offer.id);
      if (!res.ok) {
        setError("No se pudo cancelar la solicitud.");
      } else {
        router.refresh();
      }
    });
  }

  return (
    <>
      <div
        className={cn(
          "flex flex-col justify-between rounded-xl border border-border bg-background p-3.5 shadow-xs transition-all hover:border-primary/80 hover:shadow-md hover:shadow-primary/10",
          status === "delivered" && "opacity-70",
        )}>
        <div>
          {/* Header tags: Category pill + StatusBadge */}
          <div className="flex items-center gap-2 justify-between w-full">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-md border px-2 py-0.5 text-xs font-semibold shadow-xs",
                  categoryColor(offer.category),
                )}>
                {categoryLabel(offer.category)}
              </span>
              <StatusBadge status={status} />
            </div>
          </div>

          {/* Title */}
          <p
            className={cn(
              "mt-2 font-medium text-foreground",
              status === "delivered" && "line-through decoration-delivered/60",
            )}>
            {offer.title}
          </p>

          {/* Detail */}
          {offer.detail && (
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {offer.detail}
            </p>
          )}

          {/* Quantities Stock Info */}
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              Disponibles: {availableQty}
            </span>
            {reservedQty > 0 && (
              <span className="inline-flex items-center gap-1 font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                Reservadas: {reservedQty}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-muted-foreground text-[11px]">
              Total Stock: {totalQty}
            </span>
          </div>
        </div>

        {/* Donor details & Action Button */}
        <div className="mt-4 pt-3 border-t border-border space-y-3">
          {/* Donor info */}
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-medium text-foreground min-w-0">
                <User className="size-3.5 text-primary shrink-0" />
                <span className="truncate">
                  Ofrecido por: {offer.donorName}
                </span>
              </div>
            </div>

            {offer.locationName && (
              <div className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{offer.locationName}</span>
              </div>
            )}

            {offer.donorContact && offer.donorContact !== "No especificado" && (
              <div className="flex items-center gap-1.5 pt-0.5">
                <Phone className="size-3.5 text-muted-foreground shrink-0" />
                <span className="truncate font-mono">{offer.donorContact}</span>
              </div>
            )}
          </div>

          {/* Request Button -> triggers Modal */}
          {status !== "delivered" && availableQty > 0 && (
              <Button
                size="sm"
                className="w-full gap-2 mt-2 font-medium"
                onClick={() => setIsModalOpen(true)}>
                <HandHeart className="size-4" />
                Solicitar ayuda
              </Button>
            )}

          {status === "reserved" && (
            <div className="rounded-lg border border-border bg-muted/40 p-2.5 text-xs space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground">
                  Ítem Reservado
                </span>
                {isCurrentUserReserved && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Button
                      size="sm"
                      className="h-7 text-xs px-2 gap-1"
                      onClick={handleDeliver}
                      disabled={pending}>
                      {pending ? (
                        <LoaderCircle className="size-3 animate-spin" />
                      ) : (
                        <CircleCheckBig className="size-3" />
                      )}
                      Marcar recibido
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs px-2 gap-1"
                      onClick={handleRelease}
                      disabled={pending}>
                      {pending ? (
                        <LoaderCircle className="size-3 animate-spin" />
                      ) : (
                        <Undo2 className="size-3" />
                      )}
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
              {offer.reservedBy && (
                <p className="text-muted-foreground text-[11px]">
                  Solicitado por:{" "}
                  <span className="font-medium text-foreground">
                    {offer.reservedBy}
                  </span>
                  {offer.reservedByContact && ` (${offer.reservedByContact})`}
                </p>
              )}
            </div>
          )}

          {status === "delivered" && (
            <div className="rounded-lg border border-border bg-muted/40 p-2 text-xs text-muted-foreground flex items-center gap-1.5">
              <CircleCheckBig className="size-3.5 text-emerald-500" />
              <span>Esta ayuda ya ha sido entregada.</span>
            </div>
          )}

          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
      </div>

      {/* Modal with request form */}
      <RequestHelpModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        offer={offer}
        volunteerName={volunteerName}
        volunteerContact={volunteerContact}
        setVolunteerName={setVolunteerName}
        setVolunteerContact={setVolunteerContact}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}

export function DonorOffersSection({
  offers,
  isStandaloneView = false,
}: DonorOffersSectionProps) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title">("newest");

  // Requester details stored in state and persisted in localStorage under userRequesting
  const [volunteerName, setVolunteerName] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("userRequesting");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.name || "";
        } catch (e) {}
      }
    }
    return "";
  });

  const [volunteerContact, setVolunteerContact] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("userRequesting");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.contact || parsed.phone || "";
        } catch (e) {}
      }
    }
    return "";
  });

  useEffect(() => {
    if (session?.user) {
      if (session.user.name && !volunteerName) {
        setVolunteerName(session.user.name);
      }
      if ((session.user.phone || session.user.email) && !volunteerContact) {
        setVolunteerContact(session.user.phone || session.user.email || "");
      }
    }
  }, [session]);

  // Filter only offers with available stock
  const inStockOffers = useMemo(() => {
    return offers.filter((o) => {
      const status = getItemEffectiveStatus({
        status: o.status,
        quantity: o.quantity,
        quantityReserved: o.quantityReserved,
        isDonation: true,
      });
      return status !== "delivered" && status !== "reserved";
    });
  }, [offers]);

  // Calculate category counts for in-stock offers
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: inStockOffers.length };
    inStockOffers.forEach((o) => {
      const cat = (o.category || "").toLowerCase();
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [inStockOffers]);

  // Filter and sort offers
  const filteredOffers = useMemo(() => {
    return inStockOffers
      .filter((offer) => {
        // Text Search Match
        const q = searchQuery.toLowerCase().trim();
        if (q) {
          const matchTitle = offer.title?.toLowerCase().includes(q);
          const matchDetail = offer.detail?.toLowerCase().includes(q);
          const matchLocation = offer.locationName?.toLowerCase().includes(q);
          const matchDonor = offer.donorName?.toLowerCase().includes(q);
          if (!matchTitle && !matchDetail && !matchLocation && !matchDonor) {
            return false;
          }
        }

        // Category Match
        if (selectedCategory !== "all") {
          if (
            (offer.category || "").toLowerCase() !==
            selectedCategory.toLowerCase()
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "title") {
          return a.title.localeCompare(b.title);
        }
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : a.id;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : b.id;

        if (sortBy === "oldest") {
          return timeA - timeB;
        }
        // default "newest"
        return timeB - timeA;
      });
  }, [inStockOffers, searchQuery, selectedCategory, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCategory !== "all" ||
    sortBy !== "newest";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSortBy("newest");
  };

  return (
    <section
      className={cn(
        "py-8 md:py-12",
        !isStandaloneView && "border-t border-border bg-primary/5",
      )}>
      <div className="mx-auto max-w-6xl px-4">
        {/* Header section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Gift className="size-3.5" />
              Ofertas de Donantes
            </span>
            <h1 className="mt-2 font-display text-2xl font-bold tracking-tight md:text-3xl">
              Ayudas y recursos ofrecidos por la comunidad
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
              Explora las donaciones directas con stock disponible. Utiliza los
              filtros de búsqueda para encontrar e ingresar tus datos para
              reservar insumos específicos.
            </p>
          </div>
        </div>

        {/* Filters Controls Panel */}
        <div className="mt-6 bg-card/80 p-4 md:p-5 space-y-4">
          {/* Top Row: Search Input + Sort Dropdown */}
          <div className="grid gap-3 md:grid-cols-12">
            {/* Search Input */}
            <div className="relative md:col-span-8 lg:col-span-9">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por producto, descripción, ciudad o donante..."
                className="w-full h-10 pl-10 pr-9 text-sm rounded-lg border border-border bg-background/50 placeholder:text-muted-foreground/70 focus:outline-hidden focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full transition"
                  aria-label="Limpiar búsqueda">
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Sort Dropdown Menu */}
            <div className="flex justify-end items-center md:col-span-4 lg:col-span-3">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex h-10 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-primary/20 hover:text-primary hover:border-primary/20 outline-none cursor-pointer">
                  <span>
                    {sortBy === "newest"
                      ? "Más recientes primero"
                      : sortBy === "oldest"
                        ? "Más antiguos primero"
                        : "Orden alfabético (A-Z)"}
                  </span>
                  <ChevronDown className="size-3.5 text-muted-foreground ml-1" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuRadioGroup
                    value={sortBy}
                    onValueChange={(val) => setSortBy(val as any)}>
                    <DropdownMenuRadioItem value="newest">
                      Más recientes primero
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="oldest">
                      Más antiguos primero
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="title">
                      Orden alfabético (A-Z)
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Bottom Row: FilterChips for Categories & Reset button */}
          <div className="flex flex-wrap items-center justify-between gap-3 ">
            {/* Category FilterChips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <FilterChip
                active={selectedCategory === "all"}
                onClick={() => setSelectedCategory("all")}>
                Todas ({inStockOffers.length})
              </FilterChip>

              {CATEGORIES.map((cat) => {
                const catValue = cat.value.toLowerCase();
                const isSelected = selectedCategory.toLowerCase() === catValue;
                const count = categoryCounts[catValue] || 0;

                return (
                  <FilterChip
                    key={cat.value}
                    active={isSelected}
                    onClick={() => setSelectedCategory(cat.value)}>
                    {cat.label} {count > 0 ? `(${count})` : ""}
                  </FilterChip>
                );
              })}
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="destructive"
                size="sm"
                onClick={clearFilters}
                className="h-8 text-xs gap-1.5 px-2.5">
                <Trash2 className="size-4" />
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full justify-end">
          <span className="text-xs font-medium text-muted-foreground bg-card px-3 py-1.5">
            {filteredOffers.length} ofertas disponibles
          </span>
        </div>
        {/* Offers Cards Grid */}
        {filteredOffers.length > 0 ? (
          <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredOffers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                volunteerName={volunteerName}
                volunteerContact={volunteerContact}
                setVolunteerName={setVolunteerName}
                setVolunteerContact={setVolunteerContact}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-muted-foreground mb-4">
              {inStockOffers.length === 0 ? (
                <Gift className="size-6 text-muted-foreground" />
              ) : (
                <SlidersHorizontal className="size-6 text-muted-foreground" />
              )}
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              {inStockOffers.length === 0
                ? "No hay ofertas de donantes con stock disponible por el momento"
                : "No se encontraron ofertas"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
              {inStockOffers.length === 0
                ? "Sé el primero en registrar una donación disponible para apoyar a las personas que lo necesitan."
                : "Intenta modificar el término de búsqueda o cambiar los filtros de categoría."}
            </p>
            {hasActiveFilters && (
              <div className="mt-5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-2">
                  <RefreshCw className="size-3.5" />
                  Restablecer todos los filtros
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
