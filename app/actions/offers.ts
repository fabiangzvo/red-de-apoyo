"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { donorOffers, type DonorOffer } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

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

    const contact = session.user.phone || session.user.email || "No especificado";

    const [newOffer] = await db
      .insert(donorOffers)
      .values({
        userId: session.user.id ? parseInt(session.user.id, 10) : null,
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

    return { ok: true, offer: newOffer };
  } catch (error: any) {
    console.error("Error creating donor offer:", error);
    return { ok: false, error: "Error al registrar la oferta de donación." };
  }
}

export async function getDonorOffers() {
  try {
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
    const offers = await db
      .select()
      .from(donorOffers)
      .where(eq(donorOffers.userId, userId))
      .orderBy(desc(donorOffers.createdAt));

    return offers;
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

    const userId = parseInt(session.user.id, 10);
    await db
      .delete(donorOffers)
      .where(eq(donorOffers.id, offerId));

    return { ok: true };
  } catch (error) {
    return { ok: false, error: "Error al eliminar la oferta" };
  }
}
