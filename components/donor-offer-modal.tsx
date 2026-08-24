"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { createDonorOffer } from "@/app/actions/offers";
import { CATEGORIES } from "@/lib/constants";
import {
  X,
  Gift,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DonorOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DonorOfferModal({
  isOpen,
  onClose,
  onSuccess,
}: DonorOfferModalProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const [category, setCategory] = useState("alimentos");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [locationName, setLocationName] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setTitle("");
    setDetail("");
    setLocationName("");
    setCategory("alimentos");
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Por favor ingresa un título para la ayuda disponible.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await createDonorOffer({
        category,
        title: title.trim(),
        detail: detail.trim() || undefined,
        locationName: locationName.trim() || undefined,
      });

      if (!res.ok) {
        setError(res.error || "Ocurrió un error al guardar la donación.");
      } else {
        setSuccess(true);
        setTimeout(() => {
          resetForm();
          onClose();
          if (onSuccess) onSuccess();
          router.refresh();
        }, 1200);
      }
    } catch (err) {
      setError("Error inesperado en el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

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
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-background shadow-2xl transition-all z-10 my-auto">
        {/* Close Button */}
        <button
          onClick={() => {
            resetForm();
            onClose();
          }}
          className="absolute right-4 top-4 z-20 flex size-8 items-center justify-center rounded-full bg-muted/80 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Cerrar modal"
        >
          <X className="size-4" />
        </button>

        {/* Modal Header */}
        <div className="relative bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent px-6 pt-6 pb-4 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-500/20">
            <Gift className="size-6" />
          </div>
          <h2 className="text-xl font-bold font-display tracking-tight text-foreground">
            Ofrecer Ayuda Disponible
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Registra los elementos o recursos que tienes disponibles para donar.
          </p>
        </div>

        <div className="px-6 pb-6">
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
              <span>¡Ayuda registrada con éxito! La oferta ya está disponible.</span>
            </div>
          )}

          {/* Donor Session Info Badge */}
          {session?.user && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs">
              <UserCheck className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground truncate">
                  Publicando como: {session.user.name}
                </p>
                <p className="text-muted-foreground truncate text-[11px]">
                  Contacto: {session.user.phone || session.user.email}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category selection */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">
                Categoría de la ayuda <span className="text-destructive">*</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      category === c.value
                        ? "border-emerald-500 bg-emerald-500 text-white font-semibold shadow-sm"
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title / Item name */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">
                Producto / Ayuda disponible <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. 15 Mercados familiares / 5 Cobijas térmicas"
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Detail / Description */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">
                Detalles / Cantidad / Especificaciones <span className="text-muted-foreground">(Opcional)</span>
              </label>
              <textarea
                rows={2}
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="Ej. Alimentos no perecederos en buen estado. Listos para entrega en caja."
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Location */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">
                Ubicación o Punto de entrega <span className="text-muted-foreground">(Opcional)</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Ej. Bogotá - Chapinero / Medellín - Centro"
                  className="w-full rounded-xl border border-input bg-background pl-9 pr-3.5 py-2 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || success}
              className="w-full py-2.5 font-semibold text-sm shadow-md bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Registrando ayuda...
                </>
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
