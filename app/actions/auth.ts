"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export async function registerDonor(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  try {
    const { name, email, password, phone } = data;

    if (!name?.trim() || !email?.trim() || !password) {
      return {
        success: false,
        error: "Por favor diligencie todos los campos obligatorios.",
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        error: "La contraseña debe tener al menos 6 caracteres.",
      };
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      return {
        success: false,
        error: "Ya existe un donante registrado con este correo electrónico.",
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        phone: phone?.trim() || null,
        role: "donor",
      })
      .returning();

    return {
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
      },
    };
  } catch (error: any) {
    console.error("Error in registerDonor:", error);
    return {
      success: false,
      error: "Ocurrió un error al procesar el registro. Inténtalo nuevamente.",
    };
  }
}
