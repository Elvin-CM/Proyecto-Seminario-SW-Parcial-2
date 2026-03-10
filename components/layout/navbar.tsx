"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  const navLinks = [
    { href: "/landing", label: "Inicio" },
    { href: "/catalog", label: "Catálogo" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
      <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
        <Link href="/landing" className="text-xl md:text-2xl font-bold text-black">
          Prototype<span className="text-gray-600">Store</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className={`text-sm font-medium transition-colors ${
                pathname === link.href ? "text-black" : "text-gray-600 hover:text-black"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        
        {/* Desktop Auth + Cart */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/auth/login">
            <Button variant="ghost" className="text-gray-600 hover:text-black text-sm">
              Iniciar Sesión
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button className="bg-black hover:bg-gray-800 text-white text-sm">
              Regístrate Gratis
            </Button>
          </Link>
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
                >
                  {totalItems}
                </Badge>
              )}
              <span className="sr-only">Ver Carrito</span>
            </Button>
          </Link>
        </div>
        
        {/* Mobile Menu Button + Cart */}
        <div className="flex md:hidden items-center gap-2">
          <Link href="/cart" className="p-2 relative">
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px] rounded-full"
              >
                {totalItems}
              </Badge>
            )}
          </Link>
          <button 
            className="p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="container mx-auto px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className={`block py-2 ${pathname === link.href ? "text-black font-medium" : "text-gray-600"}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-gray-200 flex flex-col gap-2">
              <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full text-gray-600">Iniciar Sesión</Button>
              </Link>
              <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-black hover:bg-gray-800 text-white">
                  Regístrate Gratis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

