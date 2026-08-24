import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Donantes",
      credentials: {
        email: { label: "Correo Electrónico", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Por favor ingresa tu correo y contraseña.");
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();
        const userList = await db
          .select()
          .from(users)
          .where(eq(users.email, normalizedEmail))
          .limit(1);

        const user = userList[0];

        if (!user) {
          throw new Error("Correo o contraseña incorrectos.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Correo o contraseña incorrectos.");
        }

        return {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone || undefined,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.phone = user.phone;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.phone = token.phone as string | undefined;
        session.user.role = token.role as string | undefined;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "red-de-apoyo-colombia-secret-key-2026",
};
