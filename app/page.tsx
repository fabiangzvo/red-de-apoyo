import Link from "next/link";
import {
  CircleCheckBig,
  CircleDashed,
  Clock,
  HandHeart,
  HeartHandshake,
  PlusCircle,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { getPointsWithItems } from "@/app/actions/needs";
import { LiveStatPanel } from "@/components/live-stat-panel";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const points = await getPointsWithItems();
  const allItems = points.flatMap((p) => p.items);
  const stats = {
    families: points.length,
    pending: allItems.filter((i) => i.status === "pending").length,
    reserved: allItems.filter((i) => i.status === "reserved").length,
    delivered: allItems.filter((i) => i.status === "delivered").length,
  };

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
            <div className="flex flex-col justify-center">
              <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-secondary/5 px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-pending opacity-70" />
                  <span className="relative inline-flex size-2 rounded-full bg-pending" />
                </span>
                Respuesta activa al sismo
              </span>
              <h1 className="text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
                Ayuda humanitaria directa.
              </h1>
              <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
                Conectamos a las familias afectadas por el sismo con donantes y
                voluntarios. Publica exactamente lo que necesitas y recibe apoyo
                sin intermediarios.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="h-11 px-5 text-base"
                  render={<Link href="/solicitar" />}>
                  <PlusCircle className="size-5" aria-hidden />
                  Solicitar ayuda
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 px-5 text-base"
                  render={<Link href="/mapa" />}>
                  <HandHeart className="size-5" aria-hidden />
                  Quiero ayudar
                </Button>
              </div>
            </div>

            {/* Live stat panel */}
            <LiveStatPanel stats={stats} />
          </div>
        </section>

        {/* Two paths */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-balance font-display text-2xl font-bold tracking-tight md:text-3xl">
            ¿Cómo funciona?
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <PathCard
              tone="primary"
              eyebrow="Para damnificados"
              title="Pide ayuda"
              steps={[
                "Fija el pin exacto de tu ubicación en el mapa con tu GPS.",
                "Construye tu lista de necesidades: agrega los ítems uno a uno con categoría, producto y cantidad.",
                "Publica tu lista para que los donantes puedan ayudarte por partes.",
              ]}
              cta={{
                href: "/solicitar",
                label: "Crear mi lista",
                Icon: PlusCircle,
              }}
            />
            <PathCard
              tone="muted"
              eyebrow="Para donantes y voluntarios"
              title="Ofrece ayuda"
              steps={[
                "Filtra el mapa por categoría y por tu rango de distancia.",
                "Revisa el desglose ítem por ítem que cada persona publicó.",
                "Toma un ítem, entrégalo y márcalo como entregado. O libéralo si no puedes.",
              ]}
              cta={{ href: "/mapa", label: "Abrir el mapa", Icon: MapPin }}
            />
          </div>
        </section>

        {/* Status system */}
        <section className="border-t border-border bg-card/40">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-balance font-display text-2xl font-bold tracking-tight md:text-3xl">
              Sistema de reserva
            </h2>
            <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
              Cada necesidad tiene su propio estado. Así nadie duplica esfuerzos
              y las familias ven en tiempo real qué falta por atender.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <StatusCard
                Icon={CircleDashed}
                dot="bg-pending"
                title="Pendiente"
                desc="Nadie se ha encargado todavía. Aparece en el mapa de puntos por atender."
              />
              <StatusCard
                Icon={Clock}
                dot="bg-reserved"
                title="Reservado"
                desc="Un voluntario lo asumió. Tiene 6 horas para realizar la entrega antes de liberarse."
              />
              <StatusCard
                Icon={CircleCheckBig}
                dot="bg-delivered"
                title="Entregado"
                desc="El ítem se tacha y sale de la lista de pendientes. ¡Gracias por tu apoyo!"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <HeartHandshake className="size-4 text-primary" aria-hidden />
            <span>Levantandonos Colombia</span>
          </div>
          <p className="text-pretty text-center sm:text-right">
            Plataforma comunitaria sin ánimo de lucro.
          </p>
        </div>
      </footer>
    </div>
  );
}

function StatCell({
  Icon,
  value,
  label,
  tone,
}: {
  Icon: typeof Clock;
  value: number;
  label: string;
  tone: string;
}) {
  return (
    <div className="not-first:border-l border-border bg-background p-3">
      <Icon className={`mx-auto size-6 ${tone}`} aria-hidden strokeWidth={3} />
      <div className="mt-1.5 font-display text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function PathCard({
  tone,
  eyebrow,
  title,
  steps,
  cta,
}: {
  tone: "primary" | "muted";
  eyebrow: string;
  title: string;
  steps: string[];
  cta: { href: string; label: string; Icon: typeof MapPin };
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-6">
      <span
        className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
          tone === "primary"
            ? "bg-primary/12 text-primary"
            : "bg-secondary/12 text-secondary-foreground"
        }`}>
        {eyebrow}
      </span>
      <h3 className="mt-3 font-display text-2xl font-bold tracking-tight">
        {title}
      </h3>
      <ol className="mt-5 flex flex-1 flex-col gap-4">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary/30 text-xs font-bold text-secondary-foreground">
              {i + 1}
            </span>
            <span className="text-sm leading-relaxed text-muted-foreground">
              {step}
            </span>
          </li>
        ))}
      </ol>
      <Button
        className="mt-6 w-full"
        variant={tone === "primary" ? "default" : "outline"}
        render={<Link href={cta.href} />}>
        <cta.Icon className="size-4" aria-hidden />
        {cta.label}
      </Button>
    </div>
  );
}

function StatusCard({
  Icon,
  dot,
  title,
  desc,
}: {
  Icon: typeof Clock;
  dot: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/5 p-5">
      <div className="flex items-center gap-2">
        <span className={`size-2.5 rounded-full ${dot}`} aria-hidden />
        <span className="font-display font-semibold">{title}</span>
        <Icon
          className="ml-auto size-6 text-muted-foreground"
          aria-hidden
          strokeWidth={3}
        />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {desc}
      </p>
    </div>
  );
}
