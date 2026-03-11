import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

import { Toaster } from "@/components/ui/toaster";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, ShoppingBag } from "lucide-react";

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

            <div className="flex items-center gap-4">
              <UserButton />
              <CartWrapper />
            </div>
          </div>
        </header>

        <main className="min-h-screen bg-background">
          {children}
        </main>

        <footer className="bg-gray-900 text-gray-300">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white">
                  <ShoppingBag className="h-6 w-6" />
                  <span className="text-xl font-bold">PrototypeStore</span>
                </div>
                <p className="text-sm">
                  Tu tienda de confianza para encontrar los mejores productos con la mejor calidad y precio del mercado.
                </p>
                <div className="flex gap-4">
                  <a href="#" className="hover:text-white transition-colors">
                    <Facebook className="h-5 w-5" />
                  </a>
                  <a href="#" className="hover:text-white transition-colors">
                    <Instagram className="h-5 w-5" />
                  </a>
                  <a href="#" className="hover:text-white transition-colors">
                    <Twitter className="h-5 w-5" />
                  </a>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-white font-semibold">Enlaces Rápidos</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/catalog" className="hover:text-white transition-colors">Catálogo</Link></li>
                  <li><Link href="/orders" className="hover:text-white transition-colors">Mis Pedidos</Link></li>
                  <li><Link href="/cart" className="hover:text-white transition-colors">Carrito</Link></li>
                  <li><Link href="/checkout" className="hover:text-white transition-colors">Checkout</Link></li>
                  <li><Link href="/track" className="hover:text-white transition-colors">Rastrear Pedido</Link></li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-white font-semibold">Categorías</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/catalog?cat=Electrónica" className="hover:text-white transition-colors">Electrónica</Link></li>
                  <li><Link href="/catalog?cat=Ropa" className="hover:text-white transition-colors">Ropa</Link></li>
                  <li><Link href="/catalog?cat=Hogar" className="hover:text-white transition-colors">Hogar</Link></li>
                  <li><Link href="/catalog?cat=Deportes" className="hover:text-white transition-colors">Deportes</Link></li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-white font-semibold">Contacto</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span>Tegucigalpa, Honduras</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span>+504 1234-5678</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span>contacto@prototypestore.com</span>
                  </li>
                </ul>
              </div>

            </div>

            <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm">
              <p>&copy; {new Date().getFullYear()} PrototypeStore. Todos los derechos reservados.</p>
            </div>
          </div>
        </footer>

        <Toaster />
      </body>
    </html>
  );
}