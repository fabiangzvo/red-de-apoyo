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
import { and, asc, desc, eq, inArray, ne, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type NewItemInput = {
  category: string;
  product: string;
  detail?: string;
  quantity?: number | "";
};

export type ItemWithReservations = Item & { reservations?: ItemReservation[] };
export type PointWithItems = Point & { items: ItemWithReservations[] };

export async function getPointsWithItems(): Promise<PointWithItems[]> {
  try {
    const allPoints = await db
      .select()
      .from(points)
      .orderBy(desc(points.createdAt), desc(points.id));

    const allItems = await db
      .select()
      .from(items)
      .orderBy(asc(items.createdAt), asc(items.id));

    const allUsers = await db.select().from(users);

    const allReservations = await db
      .select()
      .from(itemReservations)
      .where(eq(itemReservations.status, "reserved"));

    const itemsWithReservations: ItemWithReservations[] = allItems.map(
      (item) => ({
        ...item,
        reservations: allReservations.filter((r) => r.itemId === item.id),
      }),
    );

    // 1. Relación con la tabla points (ítems asociados a un punto físico de ayuda)
    const pointList: PointWithItems[] = allPoints.map((p) => ({
      ...p,
      items: itemsWithReservations.filter((i) => i.pointId === p.id),
    }));

    // 2. Relación con la tabla users (donaciones registradas por usuarios sin punto físico)
    // Cada donación se lista de forma independiente sin agrupar por donante
    const userItemsWithoutPoint = itemsWithReservations.filter(
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
  } catch (error) {
    console.error("Error fetching points with items:", error);
    return [];
  }
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

export async function releaseItem(itemId: number, contactInfo?: string) {
  const contact = contactInfo?.trim();
  const [existing] = await db.select().from(items).where(eq(items.id, itemId));
  if (!existing) {
    return { ok: false as const, error: "El ítem no existe." };
  }

  let releasedQuantity = 0;

  if (contact) {
    const userReservations = await db
      .select()
      .from(itemReservations)
      .where(
        and(
          eq(itemReservations.itemId, itemId),
          eq(itemReservations.contact, contact),
          eq(itemReservations.status, "reserved"),
        ),
      );

    if (userReservations.length > 0) {
      releasedQuantity = userReservations.reduce((acc, r) => acc + r.quantity, 0);

      await db
        .update(itemReservations)
        .set({ status: "cancelled" })
        .where(
          and(
            eq(itemReservations.itemId, itemId),
            eq(itemReservations.contact, contact),
            eq(itemReservations.status, "reserved"),
          ),
        );
    }
  }

  // Fallback if no contact given or no specific active reservation found:
  if (releasedQuantity === 0) {
    releasedQuantity =
      existing.quantityReserved > 0 ? existing.quantityReserved : existing.quantity;
    await db
      .update(itemReservations)
      .set({ status: "cancelled" })
      .where(
        and(
          eq(itemReservations.itemId, itemId),
          eq(itemReservations.status, "reserved"),
        ),
      );
  }

  const newQuantityReserved = Math.max(
    0,
    existing.quantityReserved - releasedQuantity,
  );

  const defaultStatus = existing.isDonation ? "available" : "pending";
  const newStatus = newQuantityReserved <= 0 ? defaultStatus : existing.status;

  let nextReservedBy: string | null = null;
  let nextReservedByContact: string | null = null;

  if (newQuantityReserved > 0) {
    const [remaining] = await db
      .select()
      .from(itemReservations)
      .where(
        and(
          eq(itemReservations.itemId, itemId),
          eq(itemReservations.status, "reserved"),
        ),
      )
      .orderBy(desc(itemReservations.createdAt));

    if (remaining) {
      nextReservedBy = remaining.name;
      nextReservedByContact = remaining.contact;
    }
  }

  await db
    .update(items)
    .set({
      status: newStatus,
      quantityReserved: newQuantityReserved,
      reservedBy: nextReservedBy,
      reservedByContact: nextReservedByContact,
      reservedAt: nextReservedBy ? existing.reservedAt : null,
    })
    .where(eq(items.id, itemId));

  revalidatePath("/mapa");
  revalidatePath("/mis-donaciones");
  revalidatePath("/ofertas");
  return { ok: true as const };
}

export async function deliverItem(itemId: number, contactInfo?: string) {
  const contact = contactInfo?.trim();

  const [item] = await db.select().from(items).where(eq(items.id, itemId));
  if (!item) {
    return { ok: false as const, error: "El ítem no existe." };
  }

  let deliveredQuantity = 0;

  if (contact) {
    const userReservations = await db
      .select()
      .from(itemReservations)
      .where(
        and(
          eq(itemReservations.itemId, itemId),
          eq(itemReservations.contact, contact),
          eq(itemReservations.status, "reserved"),
        ),
      );

    if (userReservations.length > 0) {
      deliveredQuantity = userReservations.reduce((acc, r) => acc + r.quantity, 0);

      await db
        .update(itemReservations)
        .set({ status: "delivered" })
        .where(
          and(
            eq(itemReservations.itemId, itemId),
            eq(itemReservations.contact, contact),
            eq(itemReservations.status, "reserved"),
          ),
        );
    }
  }

  // Fallback if no contact given or no specific reservation found:
  if (deliveredQuantity === 0) {
    deliveredQuantity =
      item.quantityReserved > 0 ? item.quantityReserved : item.quantity;
  }

  const newQuantityReserved = Math.max(
    0,
    item.quantityReserved - deliveredQuantity,
  );

  const newQuantity = Math.max(0, item.quantity - deliveredQuantity);

  const defaultStatus = item.isDonation ? "available" : "pending";
  const newStatus = newQuantity <= 0 ? "delivered" : defaultStatus;

  let nextReservedBy: string | null = null;
  let nextReservedByContact: string | null = null;

  if (newQuantityReserved > 0) {
    const [remaining] = await db
      .select()
      .from(itemReservations)
      .where(
        and(
          eq(itemReservations.itemId, itemId),
          eq(itemReservations.status, "reserved"),
        ),
      )
      .orderBy(desc(itemReservations.createdAt));

    if (remaining) {
      nextReservedBy = remaining.name;
      nextReservedByContact = remaining.contact;
    }
  }

  await db
    .update(items)
    .set({
      quantity: newQuantity,
      quantityReserved: newQuantityReserved,
      status: newStatus,
      deliveredAt: new Date(),
      reservedBy: nextReservedBy,
      reservedByContact: nextReservedByContact,
    })
    .where(eq(items.id, itemId));

  revalidatePath("/mapa");
  revalidatePath("/mis-donaciones");
  revalidatePath("/ofertas");
  revalidatePath("/mis-solicitudes");
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
  revalidatePath("/mis-solicitudes");
  return { ok: true as const };
}

export type RequestedItemData = {
  reservationId: number;
  itemId: number;
  pointId: number | null;
  quantityReserved: number;
  reservationStatus: string;
  createdAt: string | null;
  userReservationName: string;
  userReservationContact: string;
  product: string;
  category: string;
  detail: string | null;
  itemStatus: string;
  isDonation: boolean;
  isMapRequest: boolean;
  totalQuantity: number;
  providerName: string;
  providerContact: string;
  locationName: string | null;
};

export async function getUserRequestedItems(
  contacts: string[],
): Promise<RequestedItemData[]> {
  const validContacts = Array.from(
    new Set(contacts.map((c) => c.trim()).filter(Boolean)),
  );

  if (validContacts.length === 0) {
    return [];
  }

  try {
    // 1. Fetch item_reservations (reservations made by user on donor offers or map items)
    const reservations = await db
      .select({
        reservationId: itemReservations.id,
        itemId: itemReservations.itemId,
        quantity: itemReservations.quantity,
        status: itemReservations.status,
        createdAt: itemReservations.createdAt,
        userReservationName: itemReservations.name,
        userReservationContact: itemReservations.contact,
        // Item fields
        product: items.product,
        category: items.category,
        detail: items.detail,
        itemStatus: items.status,
        isDonation: items.isDonation,
        totalQuantity: items.quantity,
        quantityReserved: items.quantityReserved,
        reservedBy: items.reservedBy,
        reservedByContact: items.reservedByContact,
        pointId: items.pointId,
        userId: items.userId,
      })
      .from(itemReservations)
      .innerJoin(items, eq(itemReservations.itemId, items.id))
      .where(
        and(
          inArray(itemReservations.contact, validContacts),
          ne(itemReservations.status, "cancelled"),
        ),
      )
      .orderBy(desc(itemReservations.createdAt), desc(itemReservations.id));

    const reservedItemIds = new Set(reservations.map((r) => r.itemId));

    // Gather user IDs for registered donors
    const userIds = Array.from(
      new Set(
        reservations
          .map((r) => r.userId)
          .filter((id): id is number => id !== null),
      ),
    );

    const usersList =
      userIds.length > 0
        ? await db.select().from(users).where(inArray(users.id, userIds))
        : [];
    const usersMap = new Map(usersList.map((u) => [u.id, u]));

    const reservationPointIds = Array.from(
      new Set(
        reservations
          .map((r) => r.pointId)
          .filter((id): id is number => id !== null),
      ),
    );

    const reservationPointsList =
      reservationPointIds.length > 0
        ? await db
            .select()
            .from(points)
            .where(inArray(points.id, reservationPointIds))
        : [];
    const reservationPointsMap = new Map(
      reservationPointsList.map((p) => [p.id, p]),
    );

    const reservationResults: RequestedItemData[] = reservations.map((r) => {
      let providerName = "Donante registrado";
      let providerContact = "No especificado";
      let locationName: string | null = null;

      if (r.pointId && reservationPointsMap.has(r.pointId)) {
        const pt = reservationPointsMap.get(r.pointId)!;
        locationName = pt.note || "Ubicación en el mapa";
      }

      if (r.isDonation) {
        // 1. Resolve from registered user account if userId exists
        if (r.userId && usersMap.has(r.userId)) {
          const u = usersMap.get(r.userId)!;
          providerName = u.name || providerName;
          providerContact = u.phone || u.email || providerContact;
        } else if (r.reservedBy || r.reservedByContact) {
          if (r.reservedBy) providerName = r.reservedBy;
          if (r.reservedByContact) providerContact = r.reservedByContact;
        } else if (r.pointId && reservationPointsMap.has(r.pointId)) {
          const pt = reservationPointsMap.get(r.pointId)!;
          providerName = pt.name || providerName;
          providerContact = pt.contact || providerContact;
        }
      } else {
        // It's a help request published on the map (isDonation === false)
        if (r.reservedBy) {
          providerName = `Voluntario: ${r.reservedBy}`;
          providerContact = r.reservedByContact || "";
        } else {
          providerName = "En espera de voluntario";
          providerContact = "";
        }
      }

      return {
        reservationId: r.reservationId,
        itemId: r.itemId,
        pointId: r.pointId,
        quantityReserved: r.quantity,
        reservationStatus: r.status,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
        userReservationName: r.userReservationName,
        userReservationContact: r.userReservationContact,
        product: r.product,
        category: r.category,
        detail: r.detail,
        itemStatus: r.itemStatus,
        isDonation: r.isDonation,
        isMapRequest: !r.isDonation,
        totalQuantity: r.totalQuantity,
        providerName,
        providerContact,
        locationName,
      };
    });

    // 2. Fetch help requests created by the user on points (where points.contact in validContacts)
    const userPoints = await db
      .select()
      .from(points)
      .where(inArray(points.contact, validContacts));

    const userPointIds = userPoints.map((p) => p.id);
    let mapRequestResults: RequestedItemData[] = [];

    if (userPointIds.length > 0) {
      const userPointItems = await db
        .select()
        .from(items)
        .where(
          and(
            inArray(items.pointId, userPointIds),
            eq(items.isDonation, false),
          ),
        )
        .orderBy(desc(items.createdAt), desc(items.id));

      const pointsMap = new Map(userPoints.map((p) => [p.id, p]));

      mapRequestResults = userPointItems
        .filter((i) => !reservedItemIds.has(i.id))
        .map((i) => {
          const pt = i.pointId ? pointsMap.get(i.pointId) : null;
          const status =
            i.status === "delivered"
              ? "delivered"
              : i.quantityReserved > 0 || i.status === "reserved"
                ? "reserved"
                : "pending";

          return {
            reservationId: -i.id,
            itemId: i.id,
            pointId: i.pointId,
            quantityReserved: i.quantity,
            reservationStatus: status,
            createdAt: i.createdAt ? new Date(i.createdAt).toISOString() : null,
            userReservationName: pt?.name || "Solicitante",
            userReservationContact: pt?.contact || validContacts[0],
            product: i.product,
            category: i.category,
            detail: i.detail,
            itemStatus: i.status,
            isDonation: false,
            isMapRequest: true,
            totalQuantity: i.quantity,
            providerName: i.reservedBy
              ? `Voluntario: ${i.reservedBy}`
              : "Punto de ayuda en mapa",
            providerContact: i.reservedByContact || "En espera de voluntario",
            locationName: pt?.note || "Ubicación en mapa",
          };
        });
    }

    const combined = [...reservationResults, ...mapRequestResults];
    combined.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    return combined;
  } catch (error) {
    console.error("Error fetching user requested items:", error);
    return [];
  }
}
