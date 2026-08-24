"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Trash2,
  Gift,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  Package,
  Pencil,
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { CATEGORIES, categoryLabel } from "@/lib/constants";
import { deleteDonorOffer } from "@/app/actions/offers";
import { DonorOfferModal } from "@/components/donor-offer-modal";

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

type SortField = "title" | "category" | "status" | "createdAt";
type SortOrder = "asc" | "desc";

export function MyDonationsTable({ offers }: { offers: OfferItem[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("todas");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OfferItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<OfferItem | null>(null);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

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

  const filteredAndSortedOffers = useMemo(() => {
    let list = [...offers];

    // Filter by name / search query
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

    // Sort list
    list.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === "createdAt") {
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
      } else if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = (bValue || "").toLowerCase();
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [offers, search, selectedCategory, sortField, sortOrder]);

  return (
    <>
      <div>
        {/* Controls bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card py-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar por nombre de producto o detalle..."
              className="w-full rounded-lg border border-input bg-background pl-9 pr-4 py-2 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Category Filter & Add Button */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-primary/20 hover:text-primary hover:border-primary/20 outline-none cursor-pointer"
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

        {/* Table Container */}
        <div className="overflow-hidden rounded-2xl border border-primary/10 bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-primary/10 bg-primary/20 text-xs font-semibold ">
                  <th
                    onClick={() => toggleSort("title")}
                    className="py-3.5 px-4 cursor-pointer hover:bg-primary/10 transition select-none">
                    <div className="flex items-center gap-1.5">
                      <span>Producto / Nombre</span>
                      {sortField === "title" ? (
                        sortOrder === "asc" ? (
                          <ChevronUp className="size-3.5" />
                        ) : (
                          <ChevronDown className="size-3.5" />
                        )
                      ) : (
                        <ArrowUpDown className="size-3" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("category")}
                    className="py-3.5 px-4 cursor-pointer hover:bg-primary/10 transition select-none">
                    <div className="flex items-center gap-1.5">
                      <span>Categoría</span>
                      {sortField === "category" ? (
                        sortOrder === "asc" ? (
                          <ChevronUp className="size-3.5" />
                        ) : (
                          <ChevronDown className="size-3.5" />
                        )
                      ) : (
                        <ArrowUpDown className="size-3" />
                      )}
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-center">Stock Total</th>
                  <th className="py-3.5 px-4 text-center">Reservado</th>
                  <th className="py-3.5 px-4 text-center">Disponible</th>
                  <th className="py-3.5 px-4">Detalles / Nota</th>
                  <th
                    onClick={() => toggleSort("status")}
                    className="py-3.5 px-4 cursor-pointer hover:bg-primary/10 transition select-none">
                    <div className="flex items-center gap-1.5">
                      <span>Estado</span>
                      {sortField === "status" ? (
                        sortOrder === "asc" ? (
                          <ChevronUp className="size-3.5" />
                        ) : (
                          <ChevronDown className="size-3.5" />
                        )
                      ) : (
                        <ArrowUpDown className="size-3" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("createdAt")}
                    className="py-3.5 px-4 cursor-pointer hover:bg-primary/20 transition select-none">
                    <div className="flex items-center gap-1.5">
                      <span>Fecha</span>
                      {sortField === "createdAt" ? (
                        sortOrder === "asc" ? (
                          <ChevronUp className="size-3.5" />
                        ) : (
                          <ChevronDown className="size-3.5" />
                        )
                      ) : (
                        <ArrowUpDown className="size-3" />
                      )}
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAndSortedOffers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/5 mb-3">
                        <Package className="size-6" />
                      </div>
                      <p className="font-semibold text-foreground text-sm">
                        No se encontraron donaciones
                      </p>
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
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedOffers.map((item) => {
                    const dateFormatted = new Date(
                      item.createdAt,
                    ).toLocaleDateString("es-CO", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });

                    const total = item.quantity ?? 1;
                    const reserved = item.quantityReserved ?? 0;
                    const available = Math.max(0, total - reserved);

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-primary/5 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-foreground">
                          {item.title}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                            {categoryLabel(item.category)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center text-xs font-semibold text-foreground">
                          {total}
                        </td>
                        <td className="py-3.5 px-4 text-center text-xs font-semibold text-amber-600 dark:text-amber-400">
                          {reserved}
                        </td>
                        <td className="py-3.5 px-4 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          {available}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-muted-foreground max-w-xs truncate">
                          {item.detail || "—"}
                        </td>
                        <td className="py-3.5 px-4">
                          {item.status === "available" ||
                          item.status === "pending" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="size-3" />
                              Disponible
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 border border-primary/10 px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                              <Clock className="size-3" />
                              {item.status}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                          {dateFormatted}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleEdit(item)}
                              className=" hover:bg-primary/10"
                              aria-label={`Editar ${item.title}`}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={deletingId === item.id}
                              onClick={() => setItemToDelete(item)}
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              aria-label={`Eliminar ${item.title}`}>
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
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
            <AlertDialogTitle>¿Eliminar oferta de donación?</AlertDialogTitle>
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
