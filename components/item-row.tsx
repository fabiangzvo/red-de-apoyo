"use client";

import { useState, useTransition } from "react";
import { CircleCheckBig, HandHeart, LoaderCircle, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { categoryLabel, type ItemStatus } from "@/lib/constants";
import { deliverItem, releaseItem, reserveItem } from "@/app/actions/needs";
import type { Item } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export function ItemRow({
  item,
  volunteerName,
  volunteerContact,
  onNeedName,
  onRefresh,
}: {
  item: Item;
  volunteerName: string;
  volunteerContact: string;
  onNeedName: () => void;
  onRefresh: () => void;
}) {
  const status = item.status as ItemStatus;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isCurrentUserReserved = item.reservedByContact === volunteerContact;

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok && res.error) setError(res.error);
      else onRefresh();
    });
  }

  function handleReserve() {
    if (!volunteerName.trim() || !volunteerContact.trim()) {
      onNeedName();
      return;
    }
    localStorage.setItem(
      "userInfo",
      JSON.stringify({ name: volunteerName, phone: volunteerContact }),
    );
    run(() =>
      reserveItem(item.id, volunteerName.trim(), volunteerContact.trim()),
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-background p-3.5",
        status === "delivered" && "opacity-70",
      )}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {categoryLabel(item.category)}
            </span>
            <StatusBadge status={status} />
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
          {item.reservedBy && status !== "pending" && (
            <p className="mt-1 text-xs text-muted-foreground">
              {status === "delivered" ? "Entregado por " : "Reservado por "}
              <span className="font-medium text-foreground">
                {item.reservedBy}
              </span>
              {item.reservedByContact && (
                <span className="ml-1 text-muted-foreground">
                  ({item.reservedByContact})
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {status === "pending" && (
        <Button
          size="sm"
          className="mt-3 w-full"
          onClick={handleReserve}
          disabled={pending}>
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : (
            <HandHeart className="size-4" aria-hidden />
          )}
          Me encargo de este ítem
        </Button>
      )}

      {status === "reserved" && isCurrentUserReserved && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            size="sm"
            onClick={() => run(() => deliverItem(item.id))}
            disabled={pending}>
            {pending ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : (
              <CircleCheckBig className="size-4" aria-hidden />
            )}
            Marcar entregado
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => run(() => releaseItem(item.id))}
            disabled={pending}>
            <Undo2 className="size-4" aria-hidden />
            Liberar
          </Button>
        </div>
      )}

      {status === "reserved" && isCurrentUserReserved && (
        <p className="mt-2 text-xs text-reserved-foreground">
          Ítem reservado. Tienes 6 horas para realizar la entrega.
        </p>
      )}

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
