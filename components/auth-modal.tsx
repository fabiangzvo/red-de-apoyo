"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { registerDonor } from "@/app/actions/auth";
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  Loader2,
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  LogIn,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "login" | "register";
}

export function AuthModal({
  isOpen,
  onClose,
  defaultMode = "login",
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">(defaultMode);

  // Form states - Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Form states - Register
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setError(null);
    setSuccessMsg(null);
    setLoginEmail("");
    setLoginPassword("");
    setRegName("");
    setRegEmail("");
    setRegPhone("");
    setRegPassword("");
    setRegConfirmPassword("");
  };

  const handleSwitchMode = (newMode: "login" | "register") => {
    setError(null);
    setSuccessMsg(null);
    setMode(newMode);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!loginEmail.trim() || !loginPassword) {
      setError("Por favor ingresa tu correo y contraseña.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: loginEmail.trim(),
        password: loginPassword,
        redirect: false,
      });

      if (result?.error) {
        setError(
          result.error === "CredentialsSignin"
            ? "Correo o contraseña incorrectos."
            : result.error,
        );
      } else {
        setSuccessMsg("¡Sesión iniciada con éxito!");
        setTimeout(() => {
          resetForm();
          onClose();
        }, 800);
      }
    } catch (err: any) {
      setError("Error al iniciar sesión. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setError("Todos los campos obligatorios (*) deben diligenciarse.");
      return;
    }

    if (regPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await registerDonor({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        phone: regPhone.trim() || undefined,
      });

      if (!res.success) {
        setError(res.error || "Error en el registro.");
        setIsLoading(false);
        return;
      }

      setSuccessMsg("¡Registro exitoso! Iniciando sesión...");

      // Automatically sign in the registered donor
      const loginRes = await signIn("credentials", {
        email: regEmail.trim(),
        password: regPassword,
        redirect: false,
      });

      if (loginRes?.error) {
        setError(
          "Registro completado, pero ocurrió un error al iniciar sesión automáticamente. Por favor inicia sesión.",
        );
        setMode("login");
      } else {
        setTimeout(() => {
          resetForm();
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      setError("Error inesperado en el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => {
          resetForm();
          onClose();
        }}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-background shadow-2xl transition-all z-10 my-auto">
        {/* Close Button */}
        <button
          onClick={() => {
            resetForm();
            onClose();
          }}
          className="absolute right-4 top-4 z-20 flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary transition hover:bg-primary/30 hover:text-primary"
          aria-label="Cerrar modal">
          <X className="size-4" />
        </button>

        {/* Modal Header */}
        <div className="relative bg-gradient-to-b from-primary/10 via-primary/5 to-transparent px-6 pt-6 pb-4 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
            <HeartHandshake className="size-6" />
          </div>
          <h2 className="text-xl font-bold font-display tracking-tight text-foreground">
            {mode === "login" ? "Acceso Donantes" : "Registro de Donantes"}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {mode === "login"
              ? "Ingresa a tu cuenta para coordinar donaciones y apoyar familias."
              : "Regístrate para ofrecer ayuda humanitaria de forma rápida y segura."}
          </p>
        </div>

        {/* Modal Content / Forms */}
        <div className="px-6 pb-6">
          {/* Notification Alerts */}
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="mb-5 flex rounded-xl bg-primary/20 p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => handleSwitchMode("login")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 transition ${
                mode === "login"
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-primary hover:text-primary/80 font-bold cursor-pointer"
              }`}>
              <LogIn className="size-3.5" />
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode("register")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 transition ${
                mode === "register"
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-primary hover:text-primary/80 font-bold cursor-pointer"
              }`}>
              <UserPlus className="size-3.5" />
              Crear Cuenta
            </button>
          </div>

          {/* LOGIN FORM */}
          {mode === "login" ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="donante@ejemplo.org"
                    className="w-full rounded-xl border border-input bg-background/50 pl-9 pr-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-input bg-background/50 pl-9 pr-10 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showLoginPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 font-semibold text-sm shadow-md mb-4">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Nombre Completo <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ej. María Fernanda Gómez"
                    className="w-full rounded-xl border border-input bg-background/50 pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Correo Electrónico <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="donante@ejemplo.org"
                    className="w-full rounded-xl border border-input bg-background/50 pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Teléfono / WhatsApp{" "}
                  <span className="text-muted-foreground">(Opcional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) =>
                      setRegPhone(e.target.value.replace(/[^\d+]/g, ""))
                    }
                    placeholder="3001234567"
                    className="w-full rounded-xl border border-input bg-background/50 pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Contraseña <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showRegPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full rounded-xl border border-input bg-background/50 pl-9 pr-10 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showRegPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Confirmar Contraseña{" "}
                  <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showRegPassword ? "text" : "password"}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    className="w-full rounded-xl border border-input bg-background/50 pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 font-semibold text-sm shadow-md mt-1 mb-4">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Creando Cuenta...
                  </>
                ) : (
                  "Registrarme como Donante"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
