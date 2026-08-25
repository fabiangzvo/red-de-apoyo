"use client";

import { Gift, MapPin, Phone, User, CheckCircle } from "lucide-react";
import { categoryLabel, categoryColor } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { DonorOffer } from "@/lib/db/schema";

export function DonorOffersSection({ offers }: { offers: DonorOffer[] }) {
  if (offers.length === 0) return null;

  return (
    <section className="border-t border-border bg-emerald-500/5 py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Gift className="size-3.5" />
              Ofertas de Donantes
            </span>
            <h2 className="mt-3 font-display text-2xl font-bold tracking-tight md:text-3xl">
              Ayudas disponibles publicadas por donantes
            </h2>
            <p className="mt-1 text-muted-foreground text-sm max-w-xl">
              Donaciones directas ofrecidas por nuestra comunidad de donantes registrados.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="flex flex-col justify-between rounded-2xl border border-emerald-500/20 bg-background p-5 shadow-sm transition hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "rounded-md border px-2.5 py-0.5 text-xs font-semibold",
                      categoryColor(offer.category),
                    )}>
                    {categoryLabel(offer.category)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="size-3" />
                    Disponible
                  </span>
                </div>

                <h3 className="mt-3 font-semibold text-foreground text-base">
                  {offer.title}
                </h3>

                {offer.detail && (
                  <p className="mt-1.5 text-xs text-muted-foreground line-clamp-3">
                    {offer.detail}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-border space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <User className="size-3.5 text-emerald-600" />
                  <span className="truncate">{offer.donorName}</span>
                </div>
                {offer.locationName && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-muted-foreground" />
                    <span className="truncate">{offer.locationName}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Phone className="size-3.5 text-muted-foreground" />
                  <span className="truncate">{offer.donorContact}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
