"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  items,
  donorOffers,
  itemReservations,
  users,
  type DonorOffer,
} from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createDonorOffer(data: {
  category: string;
  title: string;
  detail?: string;
  locationName?: string;
  quantity?: number;
  lat?: number;
  lng?: number;
}) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return {
        ok: false,
        error:
          "Debes iniciar sesión como donante para registrar tus ayudas disponibles.",
      };
    }

    if (!data.category?.trim() || !data.title?.trim()) {
      return {
        ok: false,
        error:
          "Por favor selecciona una categoría e ingresa el título de la ayuda.",
      };
    }

    const userId = session.user.id ? parseInt(session.user.id, 10) : null;
    const contact =
      session.user.phone || session.user.email || "No especificado";

    const detailText = [
      data.detail?.trim(),
      data.locationName?.trim()
        ? `Ubicación: ${data.locationName.trim()}`
        : null,
    ]
      .filter(Boolean)
      .join(" — ");

    const totalQty = data.quantity && data.quantity > 0 ? data.quantity : 1;

    // Insert into items table as a donation item
    const [newItem] = await db
      .insert(items)
      .values({
        category: data.category.trim(),
        product: data.title.trim(),
        detail: detailText || null,
        status: "available",
        isDonation: true,
        userId: userId,
        quantity: totalQty,
        quantityReserved: 0,
        reservedBy: session.user.name || "Donante",
        reservedByContact: contact,
      })
      .returning();

    // Also insert into donorOffers table for compatibility
    const [newOffer] = await db
      .insert(donorOffers)
      .values({
        userId: userId,
        donorName: session.user.name || "Donante",
        donorContact: contact,
        category: data.category.trim(),
        title: data.title.trim(),
        detail: data.detail?.trim() || null,
        locationName: data.locationName?.trim() || null,
        lat: data.lat ?? null,
        lng: data.lng ?? null,
        status: "available",
      })
      .returning();

    revalidatePath("/");
    revalidatePath("/mapa");

    return { ok: true, item: newItem, offer: newOffer };
  } catch (error: any) {
    console.error("Error creating donor offer:", error);
    return { ok: false, error: "Error al registrar la productos de donación." };
  }
}

export async function getDonorOffers() {
  try {
    const donationItems = await db
      .select()
      .from(items)
      .where(eq(items.isDonation, true))
      .orderBy(desc(items.createdAt), desc(items.id));

    const allReservations = await db
      .select()
      .from(itemReservations)
      .where(eq(itemReservations.status, "reserved"));

    const allUsers = await db.select().from(users);
    const legacyOffers = await db.select().from(donorOffers);

    if (donationItems.length > 0) {
      return donationItems.map((item) => {
        const user = item.userId
          ? allUsers.find((u) => u.id === item.userId)
          : null;

        const legacyOffer = legacyOffers.find(
          (o) =>
            o.id === item.id ||
            (item.userId && o.userId === item.userId && o.title === item.product),
        );

        const donorName =
          user?.name ||
          legacyOffer?.donorName ||
          (item.quantityReserved === 0 ? item.reservedBy : null) ||
          "Donante registrado";

        const donorContact =
          user?.phone ||
          user?.email ||
          legacyOffer?.donorContact ||
          (item.quantityReserved === 0 ? item.reservedByContact : null) ||
          "Contacto no especificado";

        const locationName = legacyOffer?.locationName || null;
        const lat = legacyOffer?.lat ?? null;
        const lng = legacyOffer?.lng ?? null;

        return {
          id: item.id,
          userId: item.userId,
          donorName,
          donorContact,
          category: item.category,
          title: item.product,
          detail: item.detail,
          locationName,
          lat,
          lng,
          status: item.status,
          createdAt: item.createdAt,
          quantity: item.quantity,
          quantityReserved: item.quantityReserved,
          reservedBy: item.reservedBy,
          reservedByContact: item.reservedByContact,
          reservations: allReservations.filter((r) => r.itemId === item.id),
        };
      });
    }

    const offers = await db
      .select()
      .from(donorOffers)
      .orderBy(desc(donorOffers.createdAt), desc(donorOffers.id));
    return offers;
  } catch (error) {
    console.error("Error fetching donor offers:", error);
    return [];
  }
}

export async function getUserOffers() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];

    const userId = parseInt(session.user.id, 10);
    const donationItems = await db
      .select()
      .from(items)
      .where(and(eq(items.userId, userId), eq(items.isDonation, true)))
      .orderBy(desc(items.createdAt));

    const legacyOffers = await db
      .select()
      .from(donorOffers)
      .where(eq(donorOffers.userId, userId))
      .orderBy(desc(donorOffers.createdAt));

    const mappedItems = donationItems.map((item) => ({
      id: item.id,
      userId: item.userId,
      donorName: item.reservedBy || session?.user?.name || "Donante",
      donorContact: item.reservedByContact || "Contacto no especificado",
      category: item.category,
      title: item.product,
      detail: item.detail,
      locationName: null,
      status: item.status,
      createdAt: item.createdAt,
      quantity: item.quantity,
      quantityReserved: item.quantityReserved,
    }));

    const mappedOffers = legacyOffers.map((offer) => ({
      id: offer.id,
      userId: offer.userId,
      donorName: offer.donorName,
      donorContact: offer.donorContact,
      category: offer.category,
      title: offer.title,
      detail: offer.detail,
      locationName: offer.locationName,
      status: offer.status,
      createdAt: offer.createdAt,
      quantity: offer.quantity,
      quantityReserved: 0,
    }));

    return mappedItems.length > 0 ? mappedItems : mappedOffers;
  } catch (error) {
    console.error("Error fetching user offers:", error);
    return [];
  }
}

export async function deleteDonorOffer(offerId: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { ok: false, error: "No autorizado" };
    }

    await db.delete(items).where(eq(items.id, offerId));
    await db.delete(donorOffers).where(eq(donorOffers.id, offerId));

    revalidatePath("/");
    revalidatePath("/mapa");
    revalidatePath("/mis-donaciones");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: "Error al eliminar el producto" };
  }
}

export async function updateDonorOffer(
  offerId: number,
  data: {
    category: string;
    title: string;
    quantity?: number;
    detail?: string;
    locationName?: string;
  },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { ok: false, error: "No autorizado" };
    }

    if (!data.category?.trim() || !data.title?.trim()) {
      return {
        ok: false,
        error:
          "Por favor selecciona una categoría e ingresa el título de la ayuda.",
      };
    }

    const detailText = [
      data.detail?.trim(),
      data.locationName?.trim()
        ? `Ubicación: ${data.locationName.trim()}`
        : null,
    ]
      .filter(Boolean)
      .join(" — ");

    const newQty = data.quantity && data.quantity > 0 ? data.quantity : 1;

    await db
      .update(items)
      .set({
        category: data.category.trim(),
        product: data.title.trim(),
        quantity: newQty,
        detail: detailText || null,
      })
      .where(eq(items.id, offerId));

    await db
      .update(donorOffers)
      .set({
        category: data.category.trim(),
        title: data.title.trim(),
        quantity: newQty,
        detail: data.detail?.trim() || null,
        locationName: data.locationName?.trim() || null,
      })
      .where(eq(donorOffers.id, offerId));

    revalidatePath("/");
    revalidatePath("/mapa");
    revalidatePath("/mis-donaciones");
    revalidatePath("/mis-donaciones");

    return { ok: true };
  } catch (error) {
    console.error("Error updating donor offer:", error);
    return { ok: false, error: "Error al actualizar la donación." };
  }
}
