"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartWrapper } from "./cart-wrapper";
export function NavbarActions() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return (
      <Link href="/catalog">
        <Button variant="outline" size="sm" className="gap-2">
          <ShoppingBag className="h-4 w-4" />
          <span className="hidden sm:inline">Ver Catálogo</span>
        </Button>
      </Link>
    );
  }

  return <CartWrapper />;
}
