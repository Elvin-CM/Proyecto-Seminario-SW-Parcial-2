import { auth } from "@/lib/auth";
import { logout } from "@/lib/actions";
import Link from "next/link";
import { User, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

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

  // Obtener la última orden del usuario
  const lastOrder = await prisma.order.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm hidden sm:inline">
        {session.user.name || session.user.email}
      </span>
      {lastOrder && (
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/track/${lastOrder.id}`} className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Último Pedido</span>
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