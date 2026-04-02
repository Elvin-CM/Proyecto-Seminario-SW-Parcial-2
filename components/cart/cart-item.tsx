"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCartStore, CartItem as CartItemType } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { releaseReservation, getAvailableStockFromDB, reserveStock, setMyCartQuantity, removeFromMyCart } from "@/lib/actions";
import { getCachedUserId, getSessionId } from "@/lib/client-auth";

interface CartItemProps {
  item: CartItemType;
}


export function CartItem({ item }: CartItemProps) {
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateItemMaxStock = useCartStore((state) => state.updateItemMaxStock); // NUEVO
  const setItems = useCartStore((state) => state.setItems);

  const [remainingTime, setRemainingTime] = useState(0);
  const [realStock, setRealStock] = useState<number | null>(null); // NUEVO: stock real desde BD

  // NUEVO: cargar stock real al montar y cada 15 segundos
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const fetchStock = async () => {
      const data = await getAvailableStockFromDB(item.id);
      // stock disponible en BD + lo que yo tengo = total que podría tener
      const totalForMe = data.stock + item.quantity;
      setRealStock(data.stock);
      updateItemMaxStock(item.id, totalForMe);
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (interval) clearInterval(interval);
        interval = null;
        return;
      }
      if (!interval) interval = setInterval(fetchStock, 30000);
      fetchStock();
    };

    document.addEventListener("visibilitychange", onVisibility);
    onVisibility();

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (interval) clearInterval(interval);
    };
  }, [item.id, item.quantity, updateItemMaxStock]);

  useEffect(() => {
    const updateTime = () => {
      setRemainingTime(Math.max(0, Math.floor((item.expiresAt - Date.now()) / 60000)));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, [item.expiresAt]);

  const updateCartQuantity = async (newQuantity: number, errorMsg: string) => {
  const userId = await getCachedUserId();

  if (userId) {
    const result = await setMyCartQuantity(item.id, newQuantity);
    if (!result.success) {
      toast.error(result.error || errorMsg);
      return;
    }
    setItems(result.items);
    return;
  }

  const sessionId = getSessionId();
  const reserve = await reserveStock(item.id, newQuantity, sessionId);
  if (!reserve.success) {
    toast.error(reserve.error || errorMsg);
    return;
  }
  updateQuantity(item.id, newQuantity);
};

  const handleIncrement = async () => {
  if (item.quantity >= item.maxStock) return;
  await updateCartQuantity(item.quantity + 1, "Stock insuficiente");
};

  const handleDecrement = async () => {
  if (item.quantity <= 1) return;
  await updateCartQuantity(item.quantity - 1, "Error al actualizar cantidad");
};

  const handleRemove = async () => {
    const userId = await getCachedUserId();
    if (userId) {
      const userResult = await removeFromMyCart(item.id);
      if (!userResult.success) {
        toast.error(userResult.error || "Error al eliminar del carrito");
        return;
      }
      setItems(userResult.items);
      toast.success(`${item.name} eliminado del carrito.`);
      return;
    }

    const sessionId = getSessionId();
    await releaseReservation(item.id, sessionId);
    removeItem(item.id);
    toast.success(`${item.name} eliminado del carrito.`);
  };

  return (
    <div className="flex gap-4 py-4 border-b last:border-0">
      {/* Image */}
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border bg-gray-100">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover"
        />
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-900">{item.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {formatCurrency(item.price)}
            </p>
            <p className="text-xs text-red-500">
              Reserva expira en {remainingTime} minutos
            </p>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center gap-2 sm:justify-end">
            <div className="flex items-center border rounded-md">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-r-none"
                onClick={handleDecrement}
                disabled={item.quantity <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-8 text-center text-sm">{item.quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-l-none"
                onClick={handleIncrement}
                disabled={item.quantity >= item.maxStock}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive/90"
              onClick={handleRemove}
              aria-label="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Subtotal */}
        <div className="flex justify-between items-end mt-2">
          <p className="text-sm text-muted-foreground">
            {/* CORREGIDO: mostrar stock real desde BD, no el maxStock congelado */}
            Stock disponible: {realStock !== null ? realStock : item.maxStock}
          </p>
          <p className="font-semibold">
            {formatCurrency(item.price * item.quantity)}
          </p>
        </div>
      </div>
    </div>
  );
}
