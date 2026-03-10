"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCartStore, CartItem as CartItemType } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { releaseReservation } from "@/lib/actions";

interface CartItemProps {
  item: CartItemType;
}

function getSessionId(): string {
  let sessionId = localStorage.getItem("cart-session-id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("cart-session-id", sessionId);
  }
  return sessionId;
}

export function CartItem({ item }: CartItemProps) {
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    const updateTime = () => {
      setRemainingTime(Math.max(0, Math.floor((item.expiresAt - Date.now()) / 60000)));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, [item.expiresAt]);

  const handleIncrement = () => {
    if (item.quantity < item.maxStock) {
      updateQuantity(item.id, item.quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  const handleRemove = async () => {
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
            Stock disponible: {item.maxStock}
          </p>
          <p className="font-semibold">
            {formatCurrency(item.price * item.quantity)}
          </p>
        </div>
      </div>
    </div>
  );
}