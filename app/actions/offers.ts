"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { items, donorOffers, type DonorOffer } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createDonorOffer(data: {
  category: string;
  title: string;
  detail?: string;
  locationName?: string;
  lat?: number;
  lng?: number;
}) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return {
        ok: false,
        error: "Debes iniciar sesión como donante para registrar tus ayudas disponibles.",
      };
    }

    if (!data.category?.trim() || !data.title?.trim()) {
      return {
        ok: false,
        error: "Por favor selecciona una categoría e ingresa el título de la ayuda.",
      };
    }

    const userId = session.user.id ? parseInt(session.user.id, 10) : null;
    const contact = session.user.phone || session.user.email || "No especificado";

    const detailText = [
      data.detail?.trim(),
      data.locationName?.trim() ? `Ubicación: ${data.locationName.trim()}` : null,
    ]
      .filter(Boolean)
      .join(" — ");

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
    return { ok: false, error: "Error al registrar la oferta de donación." };
  }
}

export async function getDonorOffers() {
  try {
    const donationItems = await db
      .select()
      .from(items)
      .where(eq(items.isDonation, true))
      .orderBy(desc(items.createdAt));

    if (donationItems.length > 0) {
      return donationItems.map((item) => ({
        id: item.id,
        userId: item.userId,
        donorName: item.reservedBy || "Donante",
        donorContact: item.reservedByContact || "Contacto no especificado",
        category: item.category,
        title: item.product,
        detail: item.detail,
        locationName: null,
        lat: null,
        lng: null,
        status: item.status,
        createdAt: item.createdAt,
      }));
    }

    const offers = await db
      .select()
      .from(donorOffers)
      .orderBy(desc(donorOffers.createdAt));
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
    return { ok: false, error: "Error al eliminar la oferta" };
  }
}

export async function updateDonorOffer(
  offerId: number,
  data: {
    category: string;
    title: string;
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
        error: "Por favor selecciona una categoría e ingresa el título de la ayuda.",
      };
    }

    const detailText = [
      data.detail?.trim(),
      data.locationName?.trim() ? `Ubicación: ${data.locationName.trim()}` : null,
    ]
      .filter(Boolean)
      .join(" — ");

    await db
      .update(items)
      .set({
        category: data.category.trim(),
        product: data.title.trim(),
        detail: detailText || null,
      })
      .where(eq(items.id, offerId));

    await db
      .update(donorOffers)
      .set({
        category: data.category.trim(),
        title: data.title.trim(),
        detail: data.detail?.trim() || null,
        locationName: data.locationName?.trim() || null,
      })
      .where(eq(donorOffers.id, offerId));

    revalidatePath("/");
    revalidatePath("/mapa");
    revalidatePath("/mis-donaciones");

    return { ok: true };
  } catch (error) {
    console.error("Error updating donor offer:", error);
    return { ok: false, error: "Error al actualizar la donación." };
  }
}


