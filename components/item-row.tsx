"use client";

import { useState, useTransition } from "react";
import {
  CircleCheckBig,
  HandHeart,
  LoaderCircle,
  Trash2,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import {
  categoryLabel,
  categoryColor,
  getItemEffectiveStatus,
  type ItemStatus,
} from "@/lib/constants";
import {
  deliverItem,
  releaseItem,
  removeItem,
  reserveItemQuantity,
} from "@/app/actions/needs";
import { useSession } from "next-auth/react";
import type { Item, ItemReservation } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export function ItemRow({
  item,
  volunteerName,
  volunteerContact,
  onNeedName,
  onRefresh,
  isOwner = false,
  pointId,
  canDelete = false,
}: {
  item: Item & { reservations?: ItemReservation[] };
  volunteerName: string;
  volunteerContact: string;
  onNeedName: () => void;
  onRefresh: () => void;
  isOwner: boolean;
  pointId: number;
  canDelete?: boolean;
}) {
  const status = getItemEffectiveStatus(item);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const availableQty =
    status === "delivered" || status === "reserved"
      ? 0
      : Math.max(0, (item.quantity || 1) - (item.quantityReserved || 0));
  const reservedQty = item.quantityReserved || 0;
  const totalQty = item.quantity || 1;

  const [requestQty, setRequestQty] = useState<number | "">(
    availableQty > 0 ? 1 : "",
  );

  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user);

  const activeContact =
    session?.user?.phone || session?.user?.email || volunteerContact;

  const activeReservations =
    item.reservations?.filter((r) => r.status === "reserved") || [];

  const currentUserReservations = activeReservations.filter(
    (r) =>
      r.contact === volunteerContact.trim() ||
      (isLoggedIn &&
        (r.contact === session?.user?.phone ||
          r.contact === session?.user?.email)),
  );

  const userReservedQty =
    currentUserReservations.length > 0
      ? currentUserReservations.reduce((acc, r) => acc + r.quantity, 0)
      : reservedQty;

  const isCurrentUserReserved =
    currentUserReservations.length > 0 ||
    (Boolean(item.reservedByContact) &&
      (item.reservedByContact === volunteerContact ||
        (isLoggedIn &&
          (item.reservedByContact === session?.user?.phone ||
            item.reservedByContact === session?.user?.email))));

  const reserversCount =
    activeReservations.length > 0
      ? activeReservations.length
      : item.reservedBy && (reservedQty > 0 || status === "delivered")
        ? 1
        : 0;

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok && res.error) {
        setError(res.error);
        onRefresh();
      } else {
        onRefresh();
      }
    });
  }

  function handleReserveQuantity(qty: number) {
    const finalName = session?.user?.name || volunteerName.trim();
    const finalContact =
      session?.user?.phone || session?.user?.email || volunteerContact.trim();

    if (!finalName || !finalContact) {
      onNeedName();
      return;
    }
    if (typeof window !== "undefined" && !session?.user) {
      if (item.isDonation) {
        localStorage.setItem(
          "userRequesting",
          JSON.stringify({
            name: finalName,
            contact: finalContact,
          }),
        );
      } else {
        localStorage.setItem(
          "userInfo",
          JSON.stringify({
            name: finalName,
            phone: finalContact,
          }),
        );
      }
    }
    run(() => reserveItemQuantity(item.id, finalName, finalContact, qty));
  }

  function handleRemoveItem() {
    run(() => removeItem(pointId, item.id));
  }

  const canReserve =
    status !== "delivered" &&
    status !== "reserved" &&
    availableQty > 0 &&
    !isOwner &&
    !isCurrentUserReserved &&
    !(item.isDonation && isLoggedIn) &&
    error !== "Este producto ya se encuentra completamente reservado.";

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-background p-3.5",
        status === "delivered" && "opacity-70",
      )}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 w-full">
          <div className="flex items-center gap-2 justify-between w-full">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-md border px-2 py-0.5 text-xs font-semibold shadow-xs",
                  categoryColor(item.category),
                )}>
                {categoryLabel(item.category)}
              </span>
              <StatusBadge status={status} />
            </div>
            {canDelete && status !== "delivered" && (
              <Button variant="ghost" size="icon-sm" onClick={handleRemoveItem}>
                <Trash2 className="size-4" aria-hidden />
              </Button>
            )}
          </div>
          <p
            className={cn(
              "mt-2 font-medium",
              status === "delivered" && "line-through decoration-delivered/60",
            )}>
            {item.product}
          </p>
          {item.detail && (
            <p className="text-sm text-muted-foreground">{item.detail}</p>
          )}

          {/* Quantities Stock Info */}
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              Disponibles: {availableQty}
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
              Reservadas: {reservedQty}
            </span>
            <span className="inline-flex items-center gap-1 text-muted-foreground text-[11px]">
              Total Stock: {totalQty}
            </span>
          </div>

          {reserversCount > 0 && (reservedQty > 0 || status === "delivered") && (
            <p className="mt-1.5 text-xs text-muted-foreground font-medium">
              {status === "delivered"
                ? item.isDonation
                  ? "Entregado a "
                  : "Entregado por "
                : item.isDonation
                  ? "Solicitado por "
                  : "Reservado por "}
              <span className="text-foreground font-semibold">
                {reserversCount} {reserversCount === 1 ? "persona" : "personas"}
              </span>
            </p>
          )}
        </div>
      </div>

      {canReserve && (
        <div className="mt-3 flex flex-col gap-2 rounded-lg border border-primary/50 bg-primary/10 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-medium">
              {item.isDonation
                ? `Cantidad a solicitar (Máx: ${availableQty})`
                : `Cantidad a aportar (Máx: ${availableQty})`}
            </label>
            <input
              type="number"
              min={1}
              max={availableQty}
              value={requestQty}
              onChange={(e) => {
                const val = e.target.value;
                setRequestQty(
                  val === ""
                    ? ""
                    : Math.min(availableQty, Math.max(1, Number(val))),
                );
              }}
              onBlur={() => {
                if (requestQty === "") setRequestQty(1);
              }}
              className="w-20 rounded-md border border-input bg-background px-2.5 py-1 text-right text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <Button
            size="sm"
            className="w-full"
            onClick={() => handleReserveQuantity(requestQty || 0)}
            disabled={pending || availableQty <= 0}>
            {pending ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : (
              <HandHeart className="size-4" aria-hidden />
            )}
            {item.isDonation || status === "available"
              ? `Solicitar ${requestQty} ${requestQty === 1 ? "unidad" : "unidades"}`
              : `Me encargo de ${requestQty} ${requestQty === 1 ? "unidad" : "unidades"}`}
          </Button>
        </div>
      )}

      {reservedQty > 0 && isCurrentUserReserved && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            size="sm"
            onClick={() => run(() => deliverItem(item.id, activeContact))}
            disabled={pending}>
            {pending ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : (
              <CircleCheckBig className="size-4" aria-hidden />
            )}
            {item.isDonation ? "Marcar recibido" : "Marcar entregado"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => run(() => releaseItem(item.id, activeContact))}
            disabled={pending}>
            <Undo2 className="size-4" aria-hidden />
            {item.isDonation ? "Cancelar solicitud" : "Liberar"}
          </Button>
        </div>
      )}

      {reservedQty > 0 && isCurrentUserReserved && (
        <p className="mt-2 text-xs text-muted-foreground">
          {item.isDonation
            ? `Has solicitado ${userReservedQty} ${userReservedQty === 1 ? "unidad" : "unidades"}. El donante se pondrá en contacto contigo.`
            : `Tienes ${userReservedQty} ${userReservedQty === 1 ? "unidad reservada" : "unidades reservadas"} para entrega.`}
        </p>
      )}

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
