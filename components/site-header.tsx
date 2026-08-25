"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  HeartHandshake,
  MapPinned,
  PlusCircle,
  LogIn,
  UserPlus,
  LogOut,
  UserCheck,
  ChevronDown,
  Gift,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth-modal";
import { DonorOfferModal } from "@/components/donor-offer-modal";
import { cn } from "@/lib/utils";

export function SiteHeader({ active }: { active?: "solicitar" | "mapa" }) {
  const { data: session, status } = useSession();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">(
    "login",
  );
  const [donorOfferModalOpen, setDonorOfferModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const openAuthModal = (mode: "login" | "register") => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    signOut();
  };

  return (
    <>
      <header className="sticky top-0 z-[1100] border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="relative flex size-9 flex-col rounded-lg text-primary-foreground overflow-hidden">
              <div className="grow-[2] bg-[#FCD116]"></div>
              <div className="flex-1 bg-primary"></div>
              <div className="flex-1 bg-[#CE1126]"></div>
              <HeartHandshake
                className="size-8 absolute inset-0 m-auto"
                aria-hidden
              />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-base font-bold tracking-tight">
                Levantandonos
              </span>
              <span className="text-xs text-muted-foreground">Colombia</span>
            </span>
          </Link>

          <nav className="flex items-center gap-2">
            {status === "loading" ? (
              <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
            ) : session?.user ? (
              <>
                <Button
                  variant={session?.user ? "default" : "tertiary"}
                  size="sm"
                  render={<Link href="/mapa" />}
                  className="py-4 max-lg:hidden">
                  <MapPinned className="size-4" aria-hidden />
                  <span>Ver mapa</span>
                </Button>

                {!session?.user && (
                  <Button
                    size="sm"
                    render={<Link href="/solicitar" />}
                    className="py-4 max-lg:hidden">
                    <PlusCircle className="size-4" aria-hidden />
                    Solicitar ayuda
                  </Button>
                )}

                <div className="relative">
                  <Button
                    variant="outline"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}>
                    <UserCheck className="size-4" />
                    <span className="max-w-[120px] truncate">
                      {session.user.name}
                    </span>
                    <ChevronDown className="size-3 text-muted-foreground" />
                  </Button>

                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 z-20 w-52 rounded-xl border border-border bg-background p-1.5 shadow-xl">
                        <div className="px-3 py-2 border-b border-border mb-1">
                          <p className="text-xs font-bold text-foreground truncate">
                            {session.user.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {session.user.email}
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          render={<Link href="/mapa" />}
                          className="flex w-full items-center justify-start gap-2 px-2.5 py-2 text-xs transition font-medium lg:hidden rounded-sm">
                          <MapPinned className="size-4" aria-hidden />
                          Ver mapa
                        </Button>

                        <Button
                          variant="ghost"
                          render={<Link href="/solicitar" />}
                          className="flex w-full items-center justify-start gap-2 px-2.5 py-2 text-xs transition font-medium lg:hidden rounded-sm">
                          <PlusCircle className="size-4" aria-hidden />
                          Solicitar ayuda
                        </Button>

                        <Button
                          variant="ghost"
                          onClick={() => {
                            setUserMenuOpen(false);
                            setDonorOfferModalOpen(true);
                          }}
                          className="flex w-full items-center justify-start gap-2 px-2.5 py-2 text-xs transition font-medium lg:hidden rounded-sm">
                          <Gift className="size-4" />
                          Ofrecer donación
                        </Button>

                        <Button
                          variant="ghost"
                          render={<Link href="/mis-donaciones" />}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex w-full items-center justify-start gap-2 px-2.5 py-2 text-xs transition font-medium rounded-sm">
                          <Gift className="size-4 text-primary" aria-hidden />
                          Mis donaciones
                        </Button>

                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-xs text-destructive hover:bg-destructive/10 transition font-medium">
                          <LogOut className="size-4" />
                          Cerrar sesión
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Desktop controls for logged out user */}
                <div className="hidden lg:flex items-center gap-2">
                  <Button
                    variant="tertiary"
                    size="sm"
                    render={<Link href="/mapa" />}
                    className="py-4">
                    <MapPinned className="size-4" aria-hidden />
                    <span>Ver mapa</span>
                  </Button>

                  {!session?.user && (
                    <Button
                      size="sm"
                      render={<Link href="/solicitar" />}
                      className="py-4">
                      <PlusCircle className="size-4" aria-hidden />
                      Solicitar ayuda
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAuthModal("login")}
                    className="py-4">
                    <UserPlus className="size-4" aria-hidden />
                    Soy Donante
                  </Button>
                </div>

                {/* Mobile hamburger toggle for logged out user */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Abrir menú"
                  className="lg:hidden p-2.5">
                  {mobileMenuOpen ? (
                    <X className="size-5" />
                  ) : (
                    <Menu className="size-5" />
                  )}
                </Button>
              </>
            )}
          </nav>
        </div>

        {/* Mobile dropdown menu for logged out user */}
        {mobileMenuOpen && !session?.user && (
          <div className="border-t border-border bg-background/95 backdrop-blur-md px-4 py-3 shadow-lg lg:hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                render={<Link href="/mapa" />}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full justify-center gap-2.5 py-3 text-sm font-medium">
                <MapPinned className="size-4 text-primary" aria-hidden />
                <span>Ver mapa</span>
              </Button>

              <Button
                variant="ghost"
                render={<Link href="/solicitar" />}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full justify-center gap-2.5 py-3 text-sm font-medium">
                <PlusCircle className="size-4" aria-hidden />
                <span>Solicitar ayuda</span>
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal("login");
                }}
                className="w-full justify-center gap-2 py-3 mt-1 font-semibold">
                <UserPlus className="size-4" aria-hidden />
                <span>Soy Donante</span>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authModalMode}
      />

      {/* Donor Offer Modal */}
      <DonorOfferModal
        isOpen={donorOfferModalOpen}
        onClose={() => setDonorOfferModalOpen(false)}
      />
    </>
  );
}
