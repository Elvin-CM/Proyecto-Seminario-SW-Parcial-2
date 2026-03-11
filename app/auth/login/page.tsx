import { login, loginWithGoogle } from "@/lib/actions";
import Link from "next/link";
import { LoginToasts } from "@/components/auth/auth-toasts";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center">Iniciar Sesión</h1>
        <LoginToasts error={searchParams.error} success={searchParams.success} />

        <form action={loginWithGoogle}>
          <button className="w-full border rounded-lg py-2 hover:bg-gray-50">
            Continuar con Google
          </button>
        </form>

        <div className="text-center text-gray-400 text-sm">o</div>

        <form action={login} className="space-y-4">
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
            className="w-full border rounded-lg px-3 py-2"
          />
          <button className="w-full bg-black text-white rounded-lg py-2">
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
