"use client";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store";
import { ShoppingCart, Plus, Minus } from "lucide-react";
import { useState } from "react";

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
  const getAvailableStock = useCartStore((state) => state.getAvailableStock);

  const [quantity, setQuantity] = useState(1);

  const availableStock = getAvailableStock(product.id, product.stock);
  const isOutOfStock = availableStock === 0;

  const decrease = () => setQuantity((q) => Math.max(1, q - 1));
  const increase = () => setQuantity((q) => Math.min(availableStock, q + 1));

  const handleAdd = () => {
    if (quantity > availableStock) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity,
      maxStock: product.stock,
    });
    setQuantity(1);
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
        Stock disponible: <span className="font-semibold text-foreground">{availableStock}</span>
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

      <Button size="lg" className="w-full md:w-auto text-lg px-8" onClick={handleAdd}>
        <ShoppingCart className="mr-2 h-5 w-5" />
        Agregar al Carrito
      </Button>
    </div>
  );
}