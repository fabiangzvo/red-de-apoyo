"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CircleCheckBig,
  LoaderCircle,
  Locate,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORIES, categoryLabel } from "@/lib/constants";
import { createNeedsList, type NewItemInput } from "@/app/actions/needs";
import { cn } from "@/lib/utils";

const LocationPickerMap = dynamic(
  () => import("@/components/location-picker-map"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
        Cargando mapa…
      </div>
    ),
  },
);

type DraftItem = NewItemInput & { id: string };

function newDraft(): DraftItem {
  return {
    id: crypto.randomUUID(),
    category: "alimentos",
    product: "",
    detail: "",
  };
}

export function RequestHelpForm() {
  const router = useRouter();
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<DraftItem[]>([newDraft()]);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const validItems = useMemo(
    () => items.filter((i) => i.product.trim().length > 0),
    [items],
  );

  function useMyLocation() {
    setGpsError(null);
    if (!("geolocation" in navigator)) {
      setGpsError(
        "Tu dispositivo no permite geolocalización. Fija el pin manualmente.",
      );
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setGpsLoading(false);
      },
      () => {
        setGpsError(
          "No pudimos obtener tu ubicación. Toca el mapa para fijar el pin.",
        );
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function updateItem(id: string, patch: Partial<NewItemInput>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }
  function addItem() {
    setItems((prev) => [...prev, newDraft()]);
  }
  function removeItem(id: string) {
    setItems((prev) =>
      prev.length === 1 ? prev : prev.filter((i) => i.id !== id),
    );
  }

  async function submit() {
    setFormError(null);
    if (!name.trim())
      return setFormError("Escribe un nombre o referencia del punto.");
    if (!contact.trim()) return setFormError("Escribe tu número de contacto.");
    if (!position)
      return setFormError("Fija tu ubicación en el mapa antes de publicar.");
    if (validItems.length === 0)
      return setFormError("Agrega al menos una necesidad a tu lista.");

    setSubmitting(true);
    const res = await createNeedsList({
      name: name.trim(),
      contact: contact.trim() || undefined,
      note: note.trim() || undefined,
      lat: position[0],
      lng: position[1],
      items: validItems.map((i) => ({
        category: i.category,
        product: i.product,
        detail: i.detail,
      })),
    });

    localStorage.setItem(
      "userRequesting",
      JSON.stringify({ name, contact: contact?.trim() }),
    );

    setSubmitting(false);

    if (!res.ok) {
      setFormError(res.error);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl bg-card p-8 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-delivered/15 text-delivered">
          <CircleCheckBig className="size-7" aria-hidden />
        </span>
        <h2 className="mt-5 font-display text-2xl font-bold">
          ¡Lista publicada!
        </h2>
        <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">
          Tu punto ya aparece en el mapa de ayuda con {validItems.length}{" "}
          {validItems.length === 1 ? "necesidad" : "necesidades"}. Los donantes
          podrán encargarse de tus ítems por partes.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button render={<a href="/mapa" />}>
            Ver el mapa
            <ArrowRight className="size-4" aria-hidden />
          </Button>
          <Button
            variant="outline"
            onClick={() => router.refresh()}
            render={<a href="/" />}>
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
      {/* Step 1 — Location */}
      <section className="flex flex-col">
        <StepHeading n={1} title="Tu ubicación" />
        <p className="mt-1 text-sm text-muted-foreground">
          Usa tu GPS o toca el mapa para fijar el pin exacto de tu punto.
        </p>

        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          <div className="h-[320px] w-full">
            <LocationPickerMap
              value={position}
              onChange={(lat, lng) => setPosition([lat, lng])}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-card p-3">
            <Button
              variant="outline"
              size="sm"
              onClick={useMyLocation}
              disabled={gpsLoading}>
              {gpsLoading ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              ) : (
                <Locate className="size-4" aria-hidden />
              )}
              Usar mi ubicación
            </Button>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5" aria-hidden />
              {position
                ? `${position[0].toFixed(5)}, ${position[1].toFixed(5)}`
                : "Sin ubicación fijada"}
            </span>
          </div>
        </div>
        {gpsError && (
          <p className="mt-2 text-sm text-destructive">{gpsError}</p>
        )}

        <div className="mt-5 grid gap-3">
          <Field label="Nombre o referencia del punto" required>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Familia Restrepo / Albergue La Esperanza"
              className={inputCls}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Contacto" required>
              <input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Teléfono o WhatsApp"
                className={inputCls}
              />
            </Field>
            <Field label="Nota (opcional)">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Algún dato extra si lo deseas "
                className={inputCls}
              />
            </Field>
          </div>
        </div>
      </section>

      {/* Step 2 — Needs list */}
      <section className="flex flex-col">
        <StepHeading n={2} title="Tu lista de necesidades" />
        <p className="mt-1 text-sm text-muted-foreground">
          Agrega los ítems uno a uno para que los donantes puedan ayudarte por
          partes.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  Ítem {idx + 1}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length === 1}
                  aria-label={`Eliminar ítem ${idx + 1}`}>
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>

              <div className="grid gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => updateItem(item.id, { category: c.value })}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        item.category === c.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:bg-muted",
                      )}>
                      {c.label}
                    </button>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Elemento / producto">
                    <input
                      value={item.product}
                      onChange={(e) =>
                        updateItem(item.id, { product: e.target.value })
                      }
                      placeholder="Ej: Tejas de zinc"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Cantidad / detalle">
                    <input
                      value={item.detail ?? ""}
                      onChange={(e) =>
                        updateItem(item.id, { detail: e.target.value })
                      }
                      placeholder="Ej: 5 unidades"
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={addItem} className="border-dashed">
            <Plus className="size-4" aria-hidden />
            Agregar necesidad
          </Button>
        </div>

        {/* Step 3 — Publish */}
        <div className="mt-6 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Ítems en tu lista</span>
            <span className="font-semibold">{validItems.length}</span>
          </div>
          {validItems.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {validItems.map((i) => (
                <li
                  key={i.id}
                  className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
                  {categoryLabel(i.category)}: {i.product.trim()}
                </li>
              ))}
            </ul>
          )}
          {formError && (
            <p className="mt-3 text-sm text-destructive">{formError}</p>
          )}
          <Button
            className="mt-4 h-11 w-full text-base"
            onClick={submit}
            disabled={submitting}>
            {submitting ? (
              <>
                <LoaderCircle className="size-5 animate-spin" aria-hidden />
                Publicando…
              </>
            ) : (
              <>Publicar lista de necesidades</>
            )}
          </Button>
        </div>
      </section>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

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

function StepHeading({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {n}
      </span>
      <h2 className="font-display text-xl font-bold tracking-tight">{title}</h2>
    </div>
  );
}
