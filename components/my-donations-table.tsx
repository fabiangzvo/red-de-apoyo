"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronDown,
  Trash2,
  Gift,
  Plus,
  Filter,
  Package,
  Pencil,
  User,
  MapPin,
  Phone,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  CATEGORIES,
  categoryLabel,
  categoryColor,
  getItemEffectiveStatus,
  type ItemStatus,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { deleteDonorOffer } from "@/app/actions/offers";
import { DonorOfferModal } from "@/components/donor-offer-modal";
import { StatusBadge } from "@/components/status-badge";

export interface OfferItem {
  id: number;
  userId: number | null;
  donorName: string;
  donorContact: string;
  category: string;
  title: string;
  detail: string | null;
  quantity: number | null;
  quantityReserved: number | null;
  locationName: string | null;
  status: string;
  createdAt: Date | string;
}

function MyOfferCard({
  item,
  onEdit,
  onDelete,
}: {
  item: OfferItem;
  onEdit: (item: OfferItem) => void;
  onDelete: (item: OfferItem) => void;
}) {
  const status = getItemEffectiveStatus({
    status: item.status,
    quantity: item.quantity,
    quantityReserved: item.quantityReserved,
    isDonation: true,
  });

  const total = item.quantity ?? 1;
  const reserved = item.quantityReserved ?? 0;
  const available =
    status === "delivered" || status === "reserved"
      ? 0
      : Math.max(0, total - reserved);

  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-xl border border-border bg-background p-4 shadow-xs transition-all hover:border-primary/80 hover:shadow-md hover:shadow-primary/10",
        status === "delivered" && "opacity-70",
      )}>
      <div>
        {/* Header tags: Category pill + StatusBadge + Options Dropdown */}
        <div className="flex items-center gap-2 justify-between w-full">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-md border px-2 py-0.5 text-xs font-semibold shadow-xs",
                categoryColor(item.category),
              )}>
              {categoryLabel(item.category)}
            </span>
            <StatusBadge status={status} />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex size-7 items-center justify-center rounded-lg border border-transparent cursor-pointer hover:bg-primary/10 hover:text-primary"
              aria-label="Opciones de donación">
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() => onEdit(item)}
                className="hover:!bg-primary/10 hover:!text-primary cursor-pointer group">
                <Pencil className="size-3.5 group-hover:text-primary" />
                Editar donación
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(item)}
                className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive group">
                <Trash2 className="size-3.5 group-hover:text-destructive" />
                Eliminar donación
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title */}
        <p
          className={cn(
            "mt-2 font-medium text-foreground text-base",
            status === "delivered" && "line-through decoration-delivered/60",
          )}>
          {item.title}
        </p>

        {/* Detail */}
        {item.detail && (
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {item.detail}
          </p>
        )}

        {/* Quantities Stock Info */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
            Disponibles: {available}
          </span>
          {reserved > 0 && (
            <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
              Reservadas: {reserved}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-muted-foreground text-[11px]">
            Total Stock: {total}
          </span>
        </div>
      </div>

      {/* Location info if present */}
      {item.locationName && (
        <div className="mt-3 pt-2.5 border-t border-border flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5 text-primary/70 shrink-0" />
          <span className="truncate font-medium text-foreground">
            {item.locationName}
          </span>
        </div>
      )}
    </div>
  );
}

export function MyDonationsTable({ offers }: { offers: OfferItem[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("todas");

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OfferItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<OfferItem | null>(null);

  const handleEdit = (item: OfferItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete.id;

    setDeletingId(id);
    try {
      const res = await deleteDonorOffer(id);
      if (res.ok) {
        router.refresh();
      } else {
        alert(res.error || "No se pudo eliminar la donación.");
      }
    } catch (err) {
      alert("Error al eliminar la donación.");
    } finally {
      setDeletingId(null);
      setItemToDelete(null);
    }
  };

  const filteredOffers = useMemo(() => {
    let list = [...offers];

    // Filter by search query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          (o.detail && o.detail.toLowerCase().includes(q)),
      );
    }

    // Filter by category
    if (selectedCategory !== "todas") {
      list = list.filter((o) => o.category === selectedCategory);
    }

    // Sort newest first by default
    list.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeB - timeA;
    });

    return list;
  }, [offers, search, selectedCategory]);

  return (
    <>
      <div>
        {/* Controls bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card py-2">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar por nombre de producto o detalle..."
              className="w-full rounded-lg border border-input bg-background pl-9 pr-4 py-2 text-sm placeholder:text-muted-foreground/70 focus:outline-hidden focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Category Filter & Add Button */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-primary/20 hover:text-primary hover:border-primary/20 outline-hidden cursor-pointer"
                aria-label="Filtrar por categoría">
                <Filter className="size-4" />
                <span>
                  {selectedCategory === "todas"
                    ? "Todas las categorías"
                    : categoryLabel(selectedCategory)}
                </span>
                <ChevronDown className="size-3.5 text-muted-foreground ml-1" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Categorías</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}>
                  <DropdownMenuRadioItem value="todas">
                    Todas las categorías
                  </DropdownMenuRadioItem>
                  {CATEGORIES.map((c) => (
                    <DropdownMenuRadioItem key={c.value} value={c.value}>
                      {c.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={handleCreateNew}
              size="sm"
              className="h-9 gap-1.5 font-medium">
              <Gift className="size-4" aria-hidden />
              <span>Ofrecer donación</span>
            </Button>
          </div>
        </div>

        {/* Offers Cards Grid */}
        {filteredOffers.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredOffers.map((item) => (
              <MyOfferCard
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={setItemToDelete}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
              <Package className="size-6" />
            </div>
            <h3 className="font-semibold text-foreground text-base">
              No se encontraron donaciones
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {search || selectedCategory !== "todas"
                ? "Intenta ajustar los filtros de búsqueda o categoría."
                : "Aún no has registrado ninguna ayuda disponible."}
            </p>
            {!search && selectedCategory === "todas" && (
              <Button
                onClick={handleCreateNew}
                size="sm"
                className="mt-4 gap-1.5">
                <Plus className="size-4" />
                Publicar mi primera donación
              </Button>
            )}
          </div>
        )}
      </div>

      <DonorOfferModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSuccess={() => {
          setEditingItem(null);
          router.refresh();
        }}
        initialData={editingItem}
      />

      <AlertDialog
        open={Boolean(itemToDelete)}
        onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto de donación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la ayuda{" "}
              <strong className="text-foreground">{itemToDelete?.title}</strong>{" "}
              de la lista de donaciones publicadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmDelete}
              disabled={Boolean(deletingId)}>
              {deletingId ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
