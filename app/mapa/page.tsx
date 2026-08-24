import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { EmptyState, HelpMapView } from "@/components/help-map-view";
import { getPointsWithItems } from "@/app/actions/needs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mapa de ayuda — Levantandonos Colombia",
  description:
    "Encuentra puntos afectados por el sismo, revisa sus necesidades ítem por ítem y encárgate de lo que puedas entregar.",
};

export default async function MapaPage() {
  const points = await getPointsWithItems();
  console.log(JSON.stringify(points));
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader active="mapa" />
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-balance font-display text-2xl font-bold tracking-tight md:text-3xl">
              Mapa de ayuda
            </h1>
            <p className="mt-1 text-pretty text-muted-foreground">
              Elige a quién apoyar y encárgate de los ítems que puedas entregar.
            </p>
          </div>
          <Button variant="outline" render={<Link href="/solicitar" />}>
            <PlusCircle className="size-4" aria-hidden />
            Solicitar ayuda
          </Button>
        </div>

        {points.length === 0 ? (
          <EmptyState />
        ) : (
          <Suspense>
            <HelpMapView points={points} />
          </Suspense>
        )}
      </main>
    </div>
  );
}
