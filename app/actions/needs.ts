"use server";

import { db } from "@/lib/db";
import {
  itemReservations,
  items,
  points,
  users,
  type Item,
  type ItemReservation,
  type Point,
} from "@/lib/db/schema";
import { and, asc, desc, eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type NewItemInput = {
  category: string;
  product: string;
  detail?: string;
  quantity?: number | "";
};

export type PointWithItems = Point & { items: Item[] };

export async function getPointsWithItems(): Promise<PointWithItems[]> {
  const allPoints = await db
    .select()
    .from(points)
    .orderBy(desc(points.createdAt));

  const allItems = await db.select().from(items).orderBy(asc(items.createdAt));

  const allUsers = await db.select().from(users);

  // 1. Relación con la tabla points (ítems asociados a un punto físico de ayuda)
  const pointList: PointWithItems[] = allPoints.map((p) => ({
    ...p,
    items: allItems.filter((i) => i.pointId === p.id),
  }));

  // 2. Relación con la tabla users (donaciones registradas por usuarios sin punto físico)
  // Cada donación se lista de forma independiente sin agrupar por donante
  const userItemsWithoutPoint = allItems.filter(
    (i) => i.pointId === null && i.userId !== null,
  );

  for (const item of userItemsWithoutPoint) {
    const user = allUsers.find((u) => u.id === item.userId);
    const donorName = user?.name || item.reservedBy || "Donante registrado";
    const contactInfo =
      user?.phone || user?.email || item.reservedByContact || null;

    pointList.push({
      id: -item.id, // ID negativo único por ítem
      name: item.product, // Título: el artículo a donar
      contact: donorName, // Nombre de la persona
      note: item.detail
        ? `${item.detail}${contactInfo ? ` • Contacto: ${contactInfo}` : ""}`
        : contactInfo
          ? `Contacto: ${contactInfo}`
          : "Donación disponible para entrega inmediata.",
      lat: 4.6097,
      lng: -74.0817,
      createdAt: item.createdAt || new Date(),
      items: [item],
    });
  }

  return pointList;
}

export async function createNeedsList(input: {
  name: string;
  contact?: string;
  note?: string;
  lat: number;
  lng: number;
  items: NewItemInput[];
}): Promise<{ ok: true; pointId: number } | { ok: false; error: string }> {
  const name = input.name?.trim();
  if (!name) return { ok: false, error: "El nombre es obligatorio." };
  if (
    typeof input.lat !== "number" ||
    typeof input.lng !== "number" ||
    Number.isNaN(input.lat) ||
    Number.isNaN(input.lng)
  ) {
    return { ok: false, error: "Debes fijar tu ubicación en el mapa." };
  }
  const cleanItems = (input.items ?? []).filter(
    (i) => i.product?.trim() && i.category?.trim(),
  );
  if (cleanItems.length === 0) {
    return { ok: false, error: "Agrega al menos una necesidad a tu lista." };
  }

  const [point] = await db
    .insert(points)
    .values({
      name,
      contact: input.contact?.trim() || null,
      note: input.note?.trim() || null,
      lat: input.lat,
      lng: input.lng,
    })
    .returning();

  await db.insert(items).values(
    cleanItems.map((i) => ({
      pointId: point.id,
      category: i.category.trim(),
      product: i.product.trim(),
      detail: i.detail?.trim() || null,
      quantity: i.quantity && i.quantity > 0 ? i.quantity : 1,
      quantityReserved: 0,
    })),
  );

  revalidatePath("/mapa");
  return { ok: true, pointId: point.id };
}

export async function reserveItem(
  itemId: number,
  volunteerName: string,
  volunteerContact?: string,
) {
  return reserveItemQuantity(itemId, volunteerName, volunteerContact || "", 1);
}

export async function reserveItemQuantity(
  itemId: number,
  applicantName: string,
  applicantContact: string,
  requestedQuantity: number,
) {
  const name = applicantName?.trim();
  const contact = applicantContact?.trim();

  if (!name || !contact) {
    return {
      ok: false as const,
      error: "Debes ingresar tu nombre y datos de contacto.",
    };
  }

  if (
    !requestedQuantity ||
    requestedQuantity <= 0 ||
    !Number.isInteger(requestedQuantity)
  ) {
    return {
      ok: false as const,
      error: "Ingresa una cantidad válida mayor a cero.",
    };
  }

  const [item] = await db.select().from(items).where(eq(items.id, itemId));
  if (!item) {
    return { ok: false as const, error: "El ítem seleccionado no existe." };
  }

  const availableQuantity = item.quantity - item.quantityReserved;
  if (availableQuantity <= 0) {
    return {
      ok: false as const,
      error: "Este producto ya se encuentra completamente reservado.",
    };
  }

  if (requestedQuantity > availableQuantity) {
    return {
      ok: false as const,
      error: `Solo quedan ${availableQuantity} unidades disponibles.`,
    };
  }

  const newReservedQuantity = item.quantityReserved + requestedQuantity;
  const isFullyReserved = newReservedQuantity >= item.quantity;
  const newStatus = isFullyReserved ? "reserved" : item.status;

  const [reservation] = await db
    .insert(itemReservations)
    .values({
      itemId: item.id,
      name,
      contact,
      quantity: requestedQuantity,
      status: "reserved",
    })
    .returning();

  await db
    .update(items)
    .set({
      quantityReserved: newReservedQuantity,
      status: newStatus,
      reservedBy: name,
      reservedByContact: contact,
      reservedAt: new Date(),
    })
    .where(eq(items.id, itemId));

  revalidatePath("/mapa");
  revalidatePath("/mis-donaciones");
  revalidatePath("/ofertas");

  return { ok: true as const, reservation };
}

export async function cancelReservation(reservationId: number) {
  const [res] = await db
    .select()
    .from(itemReservations)
    .where(eq(itemReservations.id, reservationId));

  if (!res) {
    return { ok: false as const, error: "La reserva no existe." };
  }

  const [item] = await db.select().from(items).where(eq(items.id, res.itemId));

  if (item) {
    const newReservedQuantity = Math.max(
      0,
      item.quantityReserved - res.quantity,
    );
    const newStatus =
      newReservedQuantity < item.quantity
        ? item.isDonation
          ? "available"
          : "pending"
        : item.status;

    await db
      .update(items)
      .set({
        quantityReserved: newReservedQuantity,
        status: newStatus,
      })
      .where(eq(items.id, item.id));
  }

  await db
    .update(itemReservations)
    .set({ status: "cancelled" })
    .where(eq(itemReservations.id, reservationId));

  revalidatePath("/mapa");
  revalidatePath("/mis-donaciones");
  revalidatePath("/ofertas");

  return { ok: true as const };
}

export async function getItemReservations(
  itemId: number,
): Promise<ItemReservation[]> {
  return db
    .select()
    .from(itemReservations)
    .where(
      and(
        eq(itemReservations.itemId, itemId),
        eq(itemReservations.status, "reserved"),
      ),
    )
    .orderBy(desc(itemReservations.createdAt));
}

export async function releaseItem(itemId: number) {
  const [existing] = await db.select().from(items).where(eq(items.id, itemId));
  const newStatus = existing?.isDonation ? "available" : "pending";

  await db
    .update(items)
    .set({
      status: newStatus,
      quantityReserved: 0,
      reservedBy: null,
      reservedByContact: null,
      reservedAt: null,
    })
    .where(eq(items.id, itemId));

  await db
    .update(itemReservations)
    .set({ status: "cancelled" })
    .where(eq(itemReservations.itemId, itemId));

  revalidatePath("/mapa");
  revalidatePath("/mis-donaciones");
  revalidatePath("/ofertas");
  return { ok: true as const };
}

export async function deliverItem(itemId: number) {
  await db
    .update(items)
    .set({ status: "delivered", deliveredAt: new Date() })
    .where(and(eq(items.id, itemId), eq(items.status, "reserved")));
  revalidatePath("/mapa");
  return { ok: true as const };
}

export async function removeItem(pointId: number, itemId: number) {
  await db.delete(items).where(eq(items.id, itemId));

  if (pointId > 0) {
    const itemPoints = await db
      .select({
        items: items,
      })
      .from(items)
      .innerJoin(points, eq(points.id, items.pointId))
      .where(eq(points.id, pointId));

    if (itemPoints.length === 0) {
      await db.delete(points).where(eq(points.id, pointId));
    }
  }

  revalidatePath("/mapa");
  return { ok: true as const };
}
