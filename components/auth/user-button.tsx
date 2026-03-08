import { auth } from "@/lib/auth";
import { logout } from "@/lib/actions";
import Link from "next/link";
import { User } from "lucide-react";
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
      <form action={logout}>
        <Button variant="ghost" size="sm" type="submit">
          Salir
        </Button>
      </form>
    </div>
  );
}