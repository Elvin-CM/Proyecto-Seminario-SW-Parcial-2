import { auth } from "@/lib/auth";
import { logout } from "@/lib/actions";
import Link from "next/link";
import { User, Package, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export async function UserButton() {
  const session = await auth();

  if (!session?.user) {
    return (
      <Button variant="ghost" size="sm" asChild>
        <Link href="/auth/login" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span>Ingresar</span>
        </Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm hidden sm:inline">
        {session.user.name || session.user.email}
      </span>
      <Button variant="ghost" size="sm" asChild>
        <Link href="/orders" className="flex items-center gap-1">
          <Package className="h-4 w-4" />
          <span className="hidden sm:inline">Mis Pedidos</span>
        </Link>
      </Button>
      {session.user.role === "ADMIN" && (
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/orders" className="flex items-center gap-1">
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        </Button>
      )}
      <form action={logout}>
        <Button variant="ghost" size="sm" type="submit">
          Salir
        </Button>
      </form>
    </div>
  );
}
