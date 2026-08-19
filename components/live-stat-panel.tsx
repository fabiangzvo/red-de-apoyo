"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CircleCheckBig,
  CircleDashed,
  Clock,
  RefreshCcw,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type Stats = {
  families: number;
  pending: number;
  reserved: number;
  delivered: number;
};

export function LiveStatPanel({ stats }: { stats: Stats }) {
  const router = useRouter();

  return (
    <div className="relative flex items-center">
      <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">
          En este momento
        </p>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="font-display text-5xl font-bold text-primary">
            {stats.families}
          </span>
          <span className="text-sm text-muted-foreground">
            {stats.families === 1
              ? "punto necesita apoyo"
              : "puntos necesitan apoyo"}
          </span>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <StatCell
            Icon={CircleDashed}
            value={stats.pending}
            label="Pendientes"
            tone="text-pending"
          />
          <StatCell
            Icon={Clock}
            value={stats.reserved}
            label="Reservados"
            tone="text-reserved-foreground"
          />
          <StatCell
            Icon={CircleCheckBig}
            value={stats.delivered}
            label="Entregados"
            tone="text-delivered"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-6 w-full justify-between bg-secondary/10 py-5"
          render={<Link href="/mapa" />}>
          Ver el mapa de ayuda
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
      <RefreshCcw
        className="absolute top-8 right-4 size-5 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
        aria-hidden
        onClick={() => router.refresh()}
      />
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
