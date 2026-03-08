import { register } from "@/lib/actions";
import Link from "next/link";

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center">Crear Cuenta</h1>

        {searchParams.error === "exists" && (
          <p className="text-red-500 text-sm text-center">
            El email ya está registrado
          </p>
        )}

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
          <button className="w-full bg-black text-white rounded-lg py-2">
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