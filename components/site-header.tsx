import Link from "next/link";
import { HeartHandshake, MapPinned, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader({ active }: { active?: "solicitar" | "mapa" }) {
  return (
    <header className="sticky top-0 z-[1100] border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="relative flex size-9 flex-col rounded-lg text-primary-foreground overflow-hidden">
            <div className="grow-[2] bg-[#FCD116]"></div>
            <div className="flex-1 bg-primary"></div>
            <div className="flex-1 bg-[#CE1126]"></div>
            <HeartHandshake
              className="size-8 absolute inset-0 m-auto"
              aria-hidden
            />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-base font-bold tracking-tight">
              Red de Apoyo
            </span>
            <span className="text-xs text-muted-foreground">Colombia</span>
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <Button variant="outline" size="sm" render={<Link href="/mapa" />}>
            <MapPinned className="size-4" aria-hidden />
            <span className="hidden sm:inline">Ver mapa</span>
          </Button>
          <Button size="sm" render={<Link href="/solicitar" />}>
            <PlusCircle className="size-4" aria-hidden />
            Solicitar ayuda
          </Button>
        </nav>
      </div>
    </header>
  );
}
