"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  HandHeart,
  Search,
  X,
  Phone,
  User,
  MapPin,
  CircleCheckBig,
  Undo2,
  Trash2,
  Clock,
  LoaderCircle,
  Package,
  ChevronDown,
  Gift,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getUserRequestedItems,
  deliverItem,
  releaseItem,
  removeItem,
  type RequestedItemData,
} from "@/app/actions/needs";
import { categoryLabel, categoryColor } from "@/lib/constants";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function MyRequestsView() {
  const router = useRouter();
  const { data: session } = useSession();

  const [activeContacts, setActiveContacts] = useState<string[]>([]);
  const [requestedItems, setRequestedItems] = useState<RequestedItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Mandatory Phone Modal state
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [modalPhoneInput, setModalPhoneInput] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "reserved" | "delivered"
  >("all");

  // Load user contacts on mount
  useEffect(() => {
    const contactsSet = new Set<string>();

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("userRequesting");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.contact) contactsSet.add(parsed.contact.trim());
          if (parsed.phone) contactsSet.add(parsed.phone.trim());
        } catch (e) {}
      }

      const savedUserInfo = localStorage.getItem("userInfo");
      if (savedUserInfo) {
        try {
          const parsedUser = JSON.parse(savedUserInfo);
          if (parsedUser.phone) contactsSet.add(parsedUser.phone.trim());
        } catch (e) {}
      }
    }

    if (session?.user) {
      if (session.user.phone) contactsSet.add(session.user.phone.trim());
      if (session.user.email) contactsSet.add(session.user.email.trim());
    }

    const initialContacts = Array.from(contactsSet);
    if (initialContacts.length > 0) {
      setActiveContacts(initialContacts);
      setShowPhoneModal(false);
    } else {
      setShowPhoneModal(true);
      setLoading(false);
    }
  }, [session]);

  // Fetch requested items whenever activeContacts change
  const fetchItems = async (contacts: string[]) => {
    if (contacts.length === 0) {
      setRequestedItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getUserRequestedItems(contacts);
      setRequestedItems(data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las solicitudes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeContacts.length > 0) {
      fetchItems(activeContacts);
    }
  }, [activeContacts]);

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const phone = modalPhoneInput.trim();
    if (!phone) {
      setModalError("Por favor ingresa tu número de teléfono.");
      return;
    }
    if (phone.length < 7) {
      setModalError("Por favor ingresa un número válido (mínimo 7 dígitos).");
      return;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(
        "userRequesting",
        JSON.stringify({ phone, contact: phone }),
      );
    }

    setModalError(null);
    setShowPhoneModal(false);
    setActiveContacts([phone]);
  };

  function runAction(
    actionFn: () => Promise<{ ok: boolean; error?: string }>,
    reservationId: number,
  ) {
    setPendingId(reservationId);
    setError(null);
    startTransition(async () => {
      try {
        const res = await actionFn();
        if (!res.ok && res.error) {
          setError(res.error);
        } else {
          await fetchItems(activeContacts);
          router.refresh();
        }
      } catch (err) {
        setError("Error al procesar la acción.");
      } finally {
        setPendingId(null);
      }
    });
  }

  // Filter items
  const filteredItems = requestedItems.filter((item) => {
    // Status Filter
    if (statusFilter !== "all" && item.reservationStatus !== statusFilter) {
      return false;
    }

    // Text Search Match
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchProduct = item.product.toLowerCase().includes(q);
      const matchDetail = item.detail?.toLowerCase().includes(q) || false;
      const matchProvider = item.providerName.toLowerCase().includes(q);
      if (!matchProduct && !matchDetail && !matchProvider) {
        return false;
      }
    }

    return true;
  });

  return (
    <main className="flex-1 bg-background py-8 md:py-12">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <HandHeart className="size-3.5" />
              Gestión de Solicitudes
            </span>
            <h1 className="mt-2 font-display text-2xl font-bold tracking-tight md:text-3xl">
              Mis Ayudas Solicitadas
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
              Revisa el estado de las solicitudes publicadas en el mapa y
              donaciones reservadas. Márcalas como recibidas o cancélalas si ya
              no las necesitas.
            </p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="mt-6 grid gap-3 md:grid-cols-12 bg-card">
          {/* Search Input */}
          <div className="relative md:col-span-8 lg:col-span-9">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar por producto, detalle o donante..."
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

          {/* Status Dropdown Filter */}
          <div className="flex justify-end items-center md:col-span-4 lg:col-span-3">
            <DropdownMenu>
              <DropdownMenuTrigger className="group flex h-10 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-primary/20 hover:text-primary hover:!border-primary/20 outline-none cursor-pointer">
                <span>
                  {statusFilter === "all"
                    ? "Todos los estados"
                    : statusFilter === "pending"
                      ? "En espera"
                      : statusFilter === "reserved"
                        ? "Reservados"
                        : "Recibidos"}
                </span>
                <ChevronDown className="size-3.5 text-muted-foreground ml-1 group-hover:text-primary transition-colors shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Estados</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={statusFilter}
                  onValueChange={(val) => setStatusFilter(val as any)}>
                  <DropdownMenuRadioItem value="all">
                    Todos los estados
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="pending">
                    En espera
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="reserved">
                    Reservados
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="delivered">
                    Recibidos
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {/* Counter label */}
        <div className="flex items-center justify-between">
          {/* Active Contact Badge Bar */}
          {activeContacts.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card py-2 ">
              <span className="flex gap-1 items-center text-sm">
                Consultando solicitudes para:{" "}
                <strong className="font-semibold text-primary">
                  {activeContacts[0]}
                </strong>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs p-1 "
                  onClick={() => {
                    setModalPhoneInput(activeContacts[0] || "");
                    setModalError(null);
                    setShowPhoneModal(true);
                  }}>
                  <Pencil className="size-3.5" />
                </Button>
              </span>
            </div>
          )}
          <span className="text-xs font-medium text-muted-foreground bg-card px-3 py-1.5 ">
            {filteredItems.length}{" "}
            {statusFilter === "pending"
              ? "en espera"
              : statusFilter === "reserved"
                ? "reservados"
                : statusFilter === "delivered"
                  ? "recibidos"
                  : "solicitudes"}
          </span>
        </div>
        {error && (
          <div className="mt-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}
        {/* Content Cards Grid */}
        {loading ? (
          <div className="mt-12 flex flex-col items-center justify-center gap-3 text-muted-foreground py-12">
            <LoaderCircle className="size-8 animate-spin text-primary" />
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <div
                key={`${item.itemId}-${item.reservationId}`}
                className="flex flex-col justify-between rounded-xl border border-border bg-background p-4 shadow-xs transition-all hover:border-primary/80 hover:shadow-md hover:shadow-primary/10">
                <div>
                  {/* Category Pill + Reservation Status Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded-md border px-2 py-0.5 text-xs font-semibold shadow-xs ${categoryColor(item.category)}`}>
                      {categoryLabel(item.category)}
                    </span>

                    {item.reservationStatus === "pending" && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <Clock className="size-3" />
                        En espera
                      </span>
                    )}

                    {item.reservationStatus === "reserved" && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Clock className="size-3" />
                        {item.isMapRequest
                          ? "Reservado por voluntario"
                          : "Reservado"}
                      </span>
                    )}

                    {item.reservationStatus === "delivered" && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <CircleCheckBig className="size-3" />
                        Recibido
                      </span>
                    )}
                  </div>

                  {/* Product Title */}
                  <div className="flex items-center gap-2 mt-2.5">
                    <h3 className="font-medium text-foreground text-lg flex gap-2">
                      {item.product}
                    </h3>
                    <span className="inline-flex items-center gap-2 font-semibold text-primary bg-primary/10 px-2 py-1 h-5 rounded-md text-xs">
                      {item.quantityReserved}{" "}
                      {item.quantityReserved === 1 ? "unidad" : "unidades"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {item.detail || "Sin descripción"}
                  </p>
                </div>

                {/* Provider details & actions */}
                <div className="mt-2 space-y-3">
                  <div className="space-y-1 text-sm">
                    {item.providerName && (
                      <div className="flex items-center gap-1.5 text-foreground truncate">
                        <User className="size-5 shrink-0" />
                        <span className="truncate">
                          {item.isDonation ? (
                            <>
                              <span className="font-bold">Ofrecido por:</span>{" "}
                              {item.providerName}
                            </>
                          ) : (
                            item.providerName
                          )}
                        </span>
                      </div>
                    )}

                    {item.providerContact &&
                      item.providerContact !== "No especificado" && (
                        <div className="flex items-center gap-1.5 text-primary font-medium">
                          <Phone className="size-3.5 shrink-0" />
                          <span>{item.providerContact}</span>
                        </div>
                      )}
                  </div>

                  {/* Action Buttons / Delivered Status Message */}
                  {item.reservationStatus === "delivered" ? (
                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 py-2 px-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <CircleCheckBig className="size-4 shrink-0" />
                        <span>Ayuda recibida y entregada con éxito</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-4 border-t border-border">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1.5 font-medium flex-1"
                          onClick={() =>
                            runAction(
                              () =>
                                deliverItem(
                                  item.itemId,
                                  item.userReservationContact,
                                ),
                              item.reservationId,
                            )
                          }
                          disabled={
                            pendingId === item.reservationId || isPending
                          }>
                          {pendingId === item.reservationId && isPending ? (
                            <LoaderCircle className="size-3.5 animate-spin" />
                          ) : (
                            <CircleCheckBig className="size-3.5" />
                          )}
                          Marcar recibido
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1.5 font-medium flex-1"
                          onClick={() =>
                            runAction(
                              () =>
                                item.isMapRequest && item.pointId
                                  ? removeItem(item.pointId, item.itemId)
                                  : releaseItem(
                                      item.itemId,
                                      item.userReservationContact,
                                    ),
                              item.reservationId,
                            )
                          }
                          disabled={
                            pendingId === item.reservationId || isPending
                          }>
                          {pendingId === item.reservationId && isPending ? (
                            <LoaderCircle className="size-3.5 animate-spin" />
                          ) : item.isMapRequest ? (
                            <Trash2 className="size-3.5" />
                          ) : (
                            <Undo2 className="size-3.5" />
                          )}
                          Cancelar solicitud
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="mt-8 bg-card/50 p-12 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
              <Gift className="size-6" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              {activeContacts.length === 0
                ? "Ingresa tu número de teléfono para ver tus solicitudes"
                : "No se han encontrado resultados"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
              {activeContacts.length === 0
                ? "Si has solicitado productos en la plataforma, ingresa tu teléfono o contacto para gestionarlas."
                : ""}
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button variant="outline" render={<Link href="/mapa" />}>
                Ver mapa de ayuda
              </Button>
              <Button render={<Link href="/ofertas" />}>
                Ver productos de donantes
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Mandatory Phone Input Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in-0 duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            {activeContacts.length > 0 && (
              <button
                type="button"
                onClick={() => setShowPhoneModal(false)}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition p-1 rounded-full hover:bg-muted"
                aria-label="Cerrar modal">
                <X className="size-4" />
              </button>
            )}

            <div className="text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Phone className="size-6" />
              </div>
              <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
                Consulta tus solicitudes
              </h2>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Por favor ingresa tu número de teléfono de contacto para
                consultar y gestionar tus solicitudes de ayuda o donaciones
                reservadas.
              </p>
            </div>

            <form onSubmit={handleModalSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Número de Teléfono / Contacto{" "}
                  <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="tel"
                    required
                    autoFocus
                    value={modalPhoneInput}
                    onChange={(e) => {
                      setModalPhoneInput(e.target.value);
                      if (modalError) setModalError(null);
                    }}
                    placeholder="Ej: 3001234567"
                    className="w-full h-11 pl-10 pr-4 text-sm rounded-xl border border-border bg-background placeholder:text-muted-foreground/70 focus:outline-hidden focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                </div>
                {modalError && (
                  <p className="mt-1.5 text-xs text-destructive font-medium">
                    {modalError}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full h-11 font-medium gap-2">
                Ver mis solicitudes
              </Button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
