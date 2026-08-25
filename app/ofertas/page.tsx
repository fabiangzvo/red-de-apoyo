import type { Metadata } from "next";
import { getDonorOffers } from "@/app/actions/offers";
import { SiteHeader } from "@/components/site-header";
import { DonorOffersSection } from "@/components/donor-offers-section";
import { HeartHandshake } from "lucide-react";

export const metadata: Metadata = {
  title: "Ofertas de Donantes | Levantándonos Colombia",
  description:
    "Consulta y busca ayudas, insumos y recursos donados directamente por la comunidad de voluntarios y donantes.",
};

export const dynamic = "force-dynamic";

export default async function OfertasPage() {
  const offers = await getDonorOffers();

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        <DonorOffersSection offers={offers} isStandaloneView={true} />
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <HeartHandshake className="size-4 text-primary" aria-hidden />
            <span>Levantándonos Colombia</span>
          </div>
          <p className="text-pretty text-center sm:text-right">
            Plataforma comunitaria sin ánimo de lucro.
          </p>
        </div>
      </footer>
    </div>
  );
}
