"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CartWrapper } from "@/components/layout/cart-wrapper";
import { UserButton } from "@/components/auth/user-button";
import { useCartStore } from "@/lib/store";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  useEffect(() => {
    const interval = setInterval(() => {
      useCartStore.getState().removeExpiredItems();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="border-b sticky top-0 bg-white z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Prototype<span className="text-primary">Store</span>
          </Link>

          {/* User + Carrito */}
          <div className="flex items-center gap-4">
            <UserButton />
            <CartWrapper />
          </div>
        </div>
      </header>
      <main className="min-h-screen bg-background">
        {children}
      </main>
    </>
  );
}