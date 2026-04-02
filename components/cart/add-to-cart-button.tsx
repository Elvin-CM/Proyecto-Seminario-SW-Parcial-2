"use client";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store";
import { ShoppingCart, Plus, Minus } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { reserveStock, releaseReservation, getAvailableStockFromDB, addToMyCart, removeFromMyCart } from "@/lib/actions";
import { toast } from "react-hot-toast";
import { getCachedUserId, getSessionId } from "@/lib/client-auth";
import { PRODUCT_STOCK_POLLING_MS } from "@/lib/config";

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    stock: number;
  };
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateItemMaxStock = useCartStore((state) => state.updateItemMaxStock); // NUEVO
  const setItems = useCartStore((state) => state.setItems);
  const items = useCartStore((state) => state.items);

  const [quantity, setQuantity] = useState(1);
  const [realStock, setRealStock] = useState(product.stock);
  const [isAdding, setIsAdding] = useState(false);
  const sessionId = useRef<string>("");

  useEffect(() => {
    sessionId.current = getSessionId();
  }, []);

  // Polling cada 10 segundos para sincronizar stock con BD
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const fetchStock = async () => {
      const data = await getAvailableStockFromDB(product.id);
      setRealStock(data.stock);

      // NUEVO: si el item ya está en el carrito, sincronizar su maxStock con el real de BD
      const itemInStore = items.find((i) => i.id === product.id);
      if (itemInStore) {
        updateItemMaxStock(product.id, data.stock + itemInStore.quantity);
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (interval) clearInterval(interval);
        interval = null;
        return;
      }
      if (!interval) interval = setInterval(fetchStock, PRODUCT_STOCK_POLLING_MS);
      fetchStock();
    };

    document.addEventListener("visibilitychange", onVisibility);
    onVisibility();

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (interval) clearInterval(interval);
    };
  }, [product.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const itemInCart = items.find((i) => i.id === product.id);
  const inMyCart = itemInCart ? itemInCart.quantity : 0;
  // getAvailableStockFromDB() already accounts for the current session reservation.
  // So "available to add" is just the returned stock.
  const availableStock = realStock;
  const isOutOfStock = availableStock <= 0 && inMyCart === 0;

  const decrease = () => setQuantity((q) => Math.max(1, q - 1));
  const increase = () => setQuantity((q) => Math.min(availableStock, q + 1));

  const handleAdd = async () => {
    if (quantity > availableStock) return;
    if (isAdding) return;

    setIsAdding(true);
    const prevItems = items;
    const prevStock = realStock;

    try {
      const userId = await getCachedUserId();

      if (userId) {
        // Optimistic UI update.
        addItem({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity,
          maxStock: realStock + inMyCart,
        });
        setRealStock((s) => Math.max(0, s - quantity));

        const userResult = await addToMyCart(product.id, quantity);
        if (!userResult.success) {
          setItems(prevItems);
          setRealStock(prevStock);
          toast.error(userResult.error || "Stock insuficiente");
          return;
        }
        setItems(userResult.items);
        return;
      }

      const result = await reserveStock(product.id, quantity + inMyCart, sessionId.current);
      if (!result.success) {
        toast.error("Stock insuficiente");
        return;
      }

      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity,
        maxStock: realStock + inMyCart,
      });

      setRealStock((s) => Math.max(0, s - quantity));
    } finally {
      setIsAdding(false);
    }

    setQuantity(1);
  };

  const handleRemove = async () => {
    const userId = await getCachedUserId();

    if (userId) {
      const prevItems = items;
      setItems(items.filter((i) => i.id !== product.id));

      const userResult = await removeFromMyCart(product.id);
      if (!userResult.success) {
        setItems(prevItems);
        toast.error(userResult.error || "No se pudo eliminar");
        return;
      }
      setItems(userResult.items);
      return;
    }

    try {
      await releaseReservation(product.id, sessionId.current);
      removeItem(product.id);
      // Let polling reconcile exact stock; keep UI responsive.
    } catch {
      // no-op
    }
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
          {realStock}
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
        <Button size="lg" className="w-full md:w-auto text-lg px-8" onClick={handleAdd} disabled={isAdding}>
          <ShoppingCart className="mr-2 h-5 w-5" />
          {isAdding ? "Agregando..." : inMyCart > 0 ? "Agregar más" : "Agregar al Carrito"}
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
