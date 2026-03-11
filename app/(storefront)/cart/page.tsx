"use client";

import { useCartStore } from "@/lib/store";
import { CartItem } from "@/components/cart/cart-item";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import dynamic from "next/dynamic"; 
import { useEffect, useMemo, useRef, useState } from "react";
import { validateCartItemsStock } from "@/lib/actions";
import { toast } from "react-hot-toast";


function CartPage() {
  const items = useCartStore((state) => state.items);
  const [stockOk, setStockOk] = useState(true);
  const stockToastShown = useRef(false);

  const stockPayload = useMemo(
    () => items.map((i) => ({ id: i.id, quantity: i.quantity })),
    [items]
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await validateCartItemsStock(stockPayload);
      if (cancelled) return;
      setStockOk(result.ok);
      if (!result.ok && !stockToastShown.current) {
        toast.error("Stock insuficiente");
        stockToastShown.current = true;
      }
      if (result.ok) stockToastShown.current = false;
    })();

    return () => {
      cancelled = true;
    };
  }, [stockPayload]);

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = subtotal * 0.15; 
  const total = subtotal + tax;

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center min-h-[60vh]">
        <div className="relative mb-8">
          <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center">
            <ShoppingBag className="h-16 w-16 text-gray-400" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-black rounded-full flex items-center justify-center">
            <span className="text-white text-lg">0</span>
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-3 text-black">Tu carrito está vacío</h1>
        <p className="text-gray-500 mb-8 max-w-md text-lg">
          Explora nuestro catálogo y descubre productos increíbles que tenemos para ti.
        </p>
        <Link href="/catalog">
          <Button size="lg" className="bg-black hover:bg-gray-800 text-white px-8 py-6 text-lg">
            <ShoppingBag className="mr-2 h-5 w-5" />
            Explorar Catálogo
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Tu Carrito</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <div className="space-y-0 border rounded-lg overflow-hidden">
            {items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Compra</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Impuestos (15%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </CardContent>
            <CardFooter>
              {stockOk ? (
                <Button className="w-full" size="lg" asChild>
                  <Link href="/checkout">
                    Proceder al Pago
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button className="w-full" size="lg" disabled>
                  Proceder al Pago
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

// 2. Export it dynamically with SSR disabled
export default dynamic(() => Promise.resolve(CartPage), {
  ssr: false,
  loading: () => <div className="container mx-auto px-4 py-12">Cargando carrito...</div>
});
