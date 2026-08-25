import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/solicitar")) {
    const secret =
      process.env.NEXTAUTH_SECRET || "red-de-apoyo-colombia-secret-key-2026";

    const token = await getToken({
      req,
      secret,
      secureCookie: process.env.NODE_ENV === "production",
    });

    if (token) {
      return NextResponse.redirect(new URL("/mapa", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/solicitar", "/solicitar/:path*"],
};
