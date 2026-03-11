import { register, registerWithGoogle } from "@/lib/actions";
import Link from "next/link";
import { RegisterToasts } from "@/components/auth/auth-toasts";
import { XCircle } from "lucide-react";

type RegisterPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
  }>;
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const params = searchParams ? await searchParams : undefined;

  const error =
    typeof params?.error === "string"
      ? params.error
      : Array.isArray(params?.error)
        ? params.error[0]
        : undefined;

  const errorMessage =
    error === "exists"
      ? "El email ya está registrado"
      : error === "missing"
        ? "Completa todos los campos"
        : error === "email"
          ? "Ingresa un email válido"
          : error === "password"
            ? "Contraseña muy corta"
            : error === "google_not_configured"
              ? "Google no está configurado"
              : error
                ? "No se pudo crear la cuenta"
                : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center">Crear Cuenta</h1>

        <RegisterToasts error={error} />

        {errorMessage && (
          <div className="w-full bg-white border rounded-lg shadow-sm px-4 py-3 flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm text-gray-900">{errorMessage}</p>
          </div>
        )}

        <form action={registerWithGoogle}>
          <button
            type="submit"
            className="w-full border rounded-lg py-2 hover:bg-gray-50"
          >
            Registrarse con Google
          </button>
        </form>

        <div className="text-center text-gray-400 text-sm">o</div>

        <form action={register} className="space-y-4">
          <input
            name="name"
            type="text"
            placeholder="Nombre"
            required
            className="w-full border rounded-lg px-3 py-2"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="w-full border rounded-lg px-3 py-2"
          />
          <input
            name="password"
            type="password"
            placeholder="Contraseña"
            required
            minLength={6}
            className="w-full border rounded-lg px-3 py-2"
          />
          <button
            type="submit"
            className="w-full bg-black text-white rounded-lg py-2"
          >
            Registrarse
          </button>
        </form>

        <p className="text-center text-sm">
          ¿Ya tienes cuenta?{" "}
          <Link href="/auth/login" className="underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}