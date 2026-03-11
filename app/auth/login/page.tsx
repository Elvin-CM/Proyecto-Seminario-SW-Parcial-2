import { login, loginWithGoogle } from "@/lib/actions";
import Link from "next/link";
import { LoginToasts } from "@/components/auth/auth-toasts";
import { XCircle, CheckCircle2 } from "lucide-react";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
    success?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined;

  const error =
    typeof params?.error === "string"
      ? params.error
      : Array.isArray(params?.error)
        ? params.error[0]
        : undefined;

  const success =
    typeof params?.success === "string"
      ? params.success
      : Array.isArray(params?.success)
        ? params.success[0]
        : undefined;

  const errorMessage =
    error === "missing"
      ? "Completa tu email y contraseña"
      : error === "google_not_configured"
        ? "Google no está configurado"
        : error === "invalid"
          ? "Correo o contraseña incorrectos"
          : error === "exists"
            ? "El email ya está registrado"
            : error
              ? "No se pudo iniciar sesión"
              : null;

  const successMessage =
    success === "registered" ? "Cuenta creada" : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center">Iniciar Sesión</h1>

        <LoginToasts error={error} success={success} />

        {errorMessage && (
          <div className="w-full bg-white border rounded-lg shadow-sm px-4 py-3 flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm text-gray-900">{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div className="w-full bg-white border rounded-lg shadow-sm px-4 py-3 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
            <p className="text-sm text-gray-900">{successMessage}</p>
          </div>
        )}

        <form action={loginWithGoogle}>
          <button
            type="submit"
            className="w-full border rounded-lg py-2 hover:bg-gray-50"
          >
            Continuar con Google
          </button>
        </form>

        <div className="text-center text-gray-400 text-sm">o</div>

        <form action={login} className="space-y-4" autoComplete="off">
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            className="w-full border rounded-lg px-3 py-2"
          />
          <input
            name="password"
            type="password"
            placeholder="Contraseña"
            required
            autoComplete="off"
            className="w-full border rounded-lg px-3 py-2"
          />
          <button
            type="submit"
            className="w-full bg-black text-white rounded-lg py-2"
          >
            Entrar
          </button>
        </form>

        <p className="text-center text-sm">
          ¿No tienes cuenta?{" "}
          <Link href="/auth/register" className="underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}