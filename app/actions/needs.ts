"use server";

import { db } from "@/lib/db";
import { items, points, type Item, type Point } from "@/lib/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { join } from "path";

export type NewItemInput = {
  category: string;
  product: string;
  detail?: string;
};

export type PointWithItems = Point & { items: Item[] };

export async function getPointsWithItems(): Promise<PointWithItems[]> {
  const allPoints = await db
    .select()
    .from(points)
    .orderBy(desc(points.createdAt));
  const allItems = await db.select().from(items).orderBy(asc(items.createdAt));

  return allPoints.map((p) => ({
    ...p,
    items: allItems.filter((i) => i.pointId === p.id),
  }));
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
  const name = volunteerName?.trim();
  const contact = volunteerContact?.trim() || null;
  if (!name)
    return { ok: false as const, error: "Indica tu nombre como voluntario." };

  const result = await db
    .update(items)
    .set({
      status: "reserved",
      reservedBy: name,
      reservedByContact: contact,
      reservedAt: new Date(),
    })
    .where(and(eq(items.id, itemId), eq(items.status, "pending")))
    .returning();

  if (result.length === 0) {
    return {
      ok: false as const,
      error: "Este ítem ya fue tomado por otra persona.",
    };
  }
  revalidatePath("/mapa");
  return { ok: true as const };
}

export async function releaseItem(itemId: number) {
  await db
    .update(items)
    .set({
      status: "pending",
      reservedBy: null,
      reservedByContact: null,
      reservedAt: null,
    })
    .where(and(eq(items.id, itemId), eq(items.status, "reserved")));
  revalidatePath("/mapa");
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
  const itemPoints = await db
    .select({
      items: items,
    })
    .from(items)
    .innerJoin(points, eq(points.id, items.pointId))
    .where(eq(points.id, pointId));

  await db.delete(items).where(eq(items.id, itemId));

  if (itemPoints.length <= 1) {
    await db.delete(points).where(eq(points.id, pointId));
  }

  revalidatePath("/mapa");
  return { ok: true as const };
}
