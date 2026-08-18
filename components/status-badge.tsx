import { CircleCheckBig, CircleDashed, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ItemStatus } from "@/lib/constants"

const CONFIG: Record<
  ItemStatus,
  { label: string; className: string; Icon: typeof Clock }
> = {
  pending: {
    label: "Pendiente",
    className: "bg-pending/15 text-pending border-pending/30",
    Icon: CircleDashed,
  },
  reserved: {
    label: "Reservado",
    className: "bg-reserved/20 text-reserved-foreground border-reserved/40",
    Icon: Clock,
  },
  delivered: {
    label: "Entregado",
    className: "bg-delivered/15 text-delivered border-delivered/30",
    Icon: CircleCheckBig,
  },
}

export function StatusBadge({
  status,
  className,
}: {
  status: ItemStatus
  className?: string
}) {
  const { label, className: cls, Icon } = CONFIG[status] ?? CONFIG.pending
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        cls,
        className,
      )}
    >
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  )
}

export function StatusDot({ status }: { status: ItemStatus }) {
  const color =
    status === "delivered"
      ? "bg-delivered"
      : status === "reserved"
        ? "bg-reserved"
        : "bg-pending"
  return <span className={cn("inline-block size-2 rounded-full", color)} aria-hidden />
}
