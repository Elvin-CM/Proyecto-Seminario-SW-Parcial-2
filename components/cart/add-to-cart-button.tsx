"use client";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store";
import { ShoppingCart, Plus, Minus } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { reserveStock, releaseReservation, getAvailableStockFromDB } from "@/lib/actions";

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    stock: number;
  };
}

// Genera o recupera un sessionId único por navegador
function getSessionId(): string {
  let sessionId = localStorage.getItem("cart-session-id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("cart-session-id", sessionId);
  }
  return sessionId;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateItemMaxStock = useCartStore((state) => state.updateItemMaxStock); // NUEVO
  const items = useCartStore((state) => state.items);

  const [quantity, setQuantity] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [realStock, setRealStock] = useState(product.stock);
  const sessionId = useRef<string>("");

  useEffect(() => {
    setMounted(true);
    sessionId.current = getSessionId();
  }, []);

  // Polling cada 10 segundos para sincronizar stock con BD
  useEffect(() => {
    const fetchStock = async () => {
      const data = await getAvailableStockFromDB(product.id);
      setRealStock(data.stock);

      // NUEVO: si el item ya está en el carrito, sincronizar su maxStock con el real de BD
      const itemInStore = items.find((i) => i.id === product.id);
      if (itemInStore) {
        updateItemMaxStock(product.id, data.stock + itemInStore.quantity);
      }
    };

    fetchStock();
    const interval = setInterval(fetchStock, 10000);
    return () => clearInterval(interval);
  }, [product.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stock disponible = stock BD - reservas activas de otros - lo que yo tengo en carrito
  const itemInCart = items.find((i) => i.id === product.id);
  const inMyCart = itemInCart ? itemInCart.quantity : 0;
  const availableStock = realStock - inMyCart;
  const isOutOfStock = mounted && availableStock <= 0 && inMyCart === 0;

  const decrease = () => setQuantity((q) => Math.max(1, q - 1));
  const increase = () => setQuantity((q) => Math.min(availableStock, q + 1));

  const handleAdd = async () => {
    if (quantity > availableStock) return;

    // Reservar en BD
    const result = await reserveStock(product.id, quantity + inMyCart, sessionId.current);
    if (!result.success) {
      alert("No hay suficiente stock disponible");
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity,
      maxStock: realStock + inMyCart, // CORREGIDO: stock real, no el estático de la página
    });

    setQuantity(1);

    // Actualizar stock mostrado
    const data = await getAvailableStockFromDB(product.id);
    setRealStock(data.stock);
  };

  const handleRemove = async () => {
    await releaseReservation(product.id, sessionId.current);
    removeItem(product.id);

    const data = await getAvailableStockFromDB(product.id);
    setRealStock(data.stock);
  };

  if (isOutOfStock) {
    return (
      <p className="text-destructive font-semibold text-lg">
        Sin stock disponible
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Stock disponible:{" "}
        <span className="font-semibold text-foreground">
          {mounted ? realStock : product.stock}
        </span>
      </p>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={decrease} disabled={quantity <= 1}>
          <Minus className="h-4 w-4" />
        </Button>
        <span className="text-xl font-bold w-8 text-center">{quantity}</span>
        <Button variant="outline" size="icon" onClick={increase} disabled={quantity >= availableStock}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-2">
        <Button size="lg" className="w-full md:w-auto text-lg px-8" onClick={handleAdd}>
          <ShoppingCart className="mr-2 h-5 w-5" />
          {inMyCart > 0 ? "Agregar más" : "Agregar al Carrito"}
        </Button>
        {inMyCart > 0 && (
          <Button size="lg" variant="outline" onClick={handleRemove}>
            Quitar del carrito ({inMyCart})
          </Button>
        )}
      </div>
    </div>
  );
}