"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { createDonorOffer, updateDonorOffer } from "@/app/actions/offers";
import { CATEGORIES } from "@/lib/constants";
import {
  X,
  Gift,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserCheck,
  Plus,
  Trash2,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DonorOfferInitialData {
  id: number;
  category: string;
  title: string;
  quantity?: number | null;
  detail?: string | null;
  locationName?: string | null;
}

interface DonorOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: DonorOfferInitialData | null;
}

type DraftOfferItem = {
  id: string;
  category: string;
  product: string;
  quantity: number | "";
  detail: string;
};

function newDraftItem(): DraftOfferItem {
  return {
    id: crypto.randomUUID(),
    category: "alimentos",
    product: "",
    quantity: 1,
    detail: "",
  };
}

const inputCls =
  "w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </span>
      {children}
    </label>
  );
}

export function DonorOfferModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: DonorOfferModalProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const isEditing = Boolean(initialData);

  const [items, setItems] = useState<DraftOfferItem[]>([newDraftItem()]);
  const [locationName, setLocationName] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setItems([
          {
            id: String(initialData.id),
            category: initialData.category || "alimentos",
            product: initialData.title || "",
            quantity:
              initialData.quantity && initialData.quantity > 0
                ? initialData.quantity
                : 1,
            detail: initialData.detail || "",
          },
        ]);
        setLocationName(initialData.locationName || "");
      } else {
        setItems([newDraftItem()]);
        setLocationName("");
      }
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const updateItem = (
    id: string,
    patch: Partial<Omit<DraftOfferItem, "id">>,
  ) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const addItem = () => {
    setItems((prev) => [...prev, newDraftItem()]);
  };

  const removeItem = (id: string) => {
    setItems((prev) =>
      prev.length === 1 ? prev : prev.filter((i) => i.id !== id),
    );
  };

  const resetForm = () => {
    setItems([newDraftItem()]);
    setLocationName("");
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validItems = items.filter((i) => i.product.trim().length > 0);

    if (validItems.length === 0) {
      setError("Por favor ingresa al menos un producto o ayuda disponible.");
      return;
    }

    setIsLoading(true);

    try {
      if (isEditing && initialData) {
        const item = validItems[0];
        const res = await updateDonorOffer(initialData.id, {
          category: item.category,
          title: item.product.trim(),
          quantity: Number(item.quantity) || 1,
          detail: item.detail.trim() || undefined,
          locationName: locationName.trim() || undefined,
        });

        if (!res.ok) {
          setError(res.error || "No se pudo actualizar la donación.");
        } else {
          setSuccess(true);
          setTimeout(() => {
            resetForm();
            onClose();
            if (onSuccess) onSuccess();
            router.refresh();
          }, 1000);
        }
      } else {
        const results = await Promise.all(
          validItems.map((item) =>
            createDonorOffer({
              category: item.category,
              title: item.product.trim(),
              quantity: Number(item.quantity) || 1,
              detail: item.detail.trim() || undefined,
              locationName: locationName.trim() || undefined,
            }),
          ),
        );

        const failed = results.find((res) => !res.ok);

        if (failed) {
          setError(failed.error || "Ocurrió un error al guardar la donación.");
        } else {
          setSuccess(true);
          setTimeout(() => {
            resetForm();
            onClose();
            if (onSuccess) onSuccess();
            router.refresh();
          }, 1200);
        }
      }
    } catch (err) {
      setError("Error inesperado en el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const validCount = items.filter((i) => i.product.trim().length > 0).length;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => {
          resetForm();
          onClose();
        }}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-background shadow-2xl transition-all z-10 my-auto max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <Button
          variant="tertiary"
          onClick={() => {
            resetForm();
            onClose();
          }}
          className="absolute right-4 top-4 z-20 flex size-8 items-center justify-center rounded-full transition"
          aria-label="Cerrar modal">
          <X className="size-4" />
        </Button>

        {/* Modal Header */}
        <div className="relative bg-gradient-to-b from-primary/10 via-primary/5 to-transparent px-6 pt-6 pb-4 text-center shrink-0">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
            {isEditing ? (
              <Pencil className="size-6" />
            ) : (
              <Gift className="size-6" />
            )}
          </div>
          <h2 className="text-xl font-bold font-display tracking-tight text-foreground">
            {isEditing ? "Editar Ayuda Disponible" : "Ofrecer Ayuda Disponible"}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {isEditing
              ? "Modifica los detalles del elemento o recurso que tienes para donar."
              : "Registra uno o varios elementos que tienes disponibles para donar."}
          </p>
        </div>

        <div className="px-6 pb-6 overflow-y-auto grow">
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-primary/10 border border-primary/20 p-3 text-xs text-primary">
              <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
              <span>
                {isEditing
                  ? "¡Donación actualizada con éxito!"
                  : `¡${validCount > 1 ? `${validCount} productos registrados` : "Ayuda registrada"} con éxito!`}
              </span>
            </div>
          )}

          {/* Donor Session Info Badge */}
          {session?.user && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
              <UserCheck className="size-4 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground truncate">
                  {isEditing ? "Editando como:" : "Publicando como:"}{" "}
                  {session.user.name}
                </p>
                <p className="text-muted-foreground truncate text-[11px]">
                  Contacto: {session.user.phone || session.user.email}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Needs / Offers list */}
            <div className="flex flex-col gap-3">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Ítem {idx + 1}
                    </span>
                    {!isEditing && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                        aria-label={`Eliminar ítem ${idx + 1}`}>
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-3">
                    <div>
                      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                        Categoría <span className="text-destructive">*</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {CATEGORIES.map((c) => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() =>
                              updateItem(item.id, { category: c.value })
                            }
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                              item.category === c.value
                                ? "border-primary bg-primary text-white font-semibold shadow-sm"
                                : "border-border bg-background text-muted-foreground hover:bg-muted",
                            )}>
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <Field label="Producto / Ayuda disponible" required>
                          <input
                            type="text"
                            value={item.product}
                            onChange={(e) =>
                              updateItem(item.id, { product: e.target.value })
                            }
                            placeholder="Ej. Mercados, Cobijas, Kits de aseo"
                            className={inputCls}
                          />
                        </Field>
                      </div>
                      <div>
                        <Field label="Cantidad (Stock)" required>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateItem(item.id, {
                                quantity:
                                  val === ""
                                    ? ""
                                    : Math.max(1, parseInt(val, 10) || 1),
                              });
                            }}
                            onBlur={() => {
                              if (item.quantity === "" || item.quantity < 1) {
                                updateItem(item.id, { quantity: 1 });
                              }
                            }}
                            className={inputCls}
                          />
                        </Field>
                      </div>
                    </div>
                    <div>
                      <Field label="Detalle adicional (Opcional)">
                        <input
                          type="text"
                          value={item.detail}
                          onChange={(e) =>
                            updateItem(item.id, { detail: e.target.value })
                          }
                          placeholder="Ej. Listo para entregar"
                          className={inputCls}
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              ))}

              {!isEditing && (
                <Button
                  variant="outline"
                  type="button"
                  onClick={addItem}
                  className="border-dashed w-full">
                  <Plus className="size-4" aria-hidden />
                  Agregar otra ayuda
                </Button>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">
                Ubicación o Punto de entrega{" "}
                <span className="text-muted-foreground">(Opcional)</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Ej. Bogotá - Chapinero / Medellín - Centro"
                  className="w-full rounded-xl border border-input bg-background pl-9 pr-3.5 py-2 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || success}
              className="w-full px-3">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {isEditing ? "Guardando cambios..." : "Registrando ayuda..."}
                </>
              ) : isEditing ? (
                "Guardar Cambios"
              ) : validCount > 1 ? (
                `Publicar ${validCount} Ayudas Disponibles`
              ) : (
                "Publicar Ayuda Disponible"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
