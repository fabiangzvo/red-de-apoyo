import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { RequestHelpForm } from "@/components/request-help-form"

export const metadata: Metadata = {
  title: "Solicitar ayuda — Red de Apoyo Colombia",
  description:
    "Fija tu ubicación y construye tu lista de necesidades ítem por ítem para que los donantes puedan ayudarte.",
}

export default function SolicitarPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader active="solicitar" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="mb-8 max-w-2xl">
          <h1 className="text-balance font-display text-3xl font-bold tracking-tight md:text-4xl">
            Solicitar ayuda
          </h1>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
            Marca dónde estás y detalla exactamente qué necesitas. Cada ítem podrá
            ser tomado por un voluntario distinto, así recibes apoyo por partes.
          </p>
        </div>
        <RequestHelpForm />
      </main>
    </div>
  )
}
