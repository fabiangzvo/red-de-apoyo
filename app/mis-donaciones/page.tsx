import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserOffers } from "@/app/actions/offers";
import { SiteHeader } from "@/components/site-header";
import { MyDonationsTable } from "@/components/my-donations-table";
import { Gift, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MyDonationsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="flex min-h-svh flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Lock className="size-7" />
            </div>
            <h1 className="font-display text-2xl font-bold">
              Acceso Requiere Sesión
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Debes iniciar sesión como donante para visualizar y gestionar tus
              donaciones registradas.
            </p>
            <div className="mt-6">
              <Button render={<Link href="/" />}>Volver al Inicio</Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const offers = await getUserOffers();

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 py-10">
        <div className="mx-auto max-w-6xl px-4 space-y-8">
          {/* Header Banner */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between pb-2">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Gift className="size-3.5" />
                Panel de Donante
              </span>
              <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
                Mis Donaciones Publicadas
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Administra las ayudas que has ofrecido a la comunidad. Puedes
                filtrar y ordenar tus registros.
              </p>
            </div>
          </div>

          {/* Table view with filter and sort */}
          <MyDonationsTable offers={offers} />
        </div>
      </main>
    </div>
  );
}
