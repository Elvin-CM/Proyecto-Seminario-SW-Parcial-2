import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { CartWrapper } from "@/components/layout/cart-wrapper";
import { UserButton } from "@/components/auth/user-button";
import { GlobalEffects } from "@/components/GlobalEffects";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "E-Commerce Prototype",
  description: "Vertical Slice Engineering Project",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <GlobalEffects />
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
      </body>
    </html>
  );
}