import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Red de Apoyo Colombia — Ayuda humanitaria directa",
  description:
    "Conectamos ayuda humanitaria directa con las familias afectadas por el sismo. Publica tu lista de necesidades ítem por ítem o encuentra a quién ayudar en el mapa.",
  generator: "v0.app",
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#c15a2e" },
    { media: "(prefers-color-scheme: dark)", color: "#332621" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`bg-background ${inter.variable} ${sora.variable}`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
