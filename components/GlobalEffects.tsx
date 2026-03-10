"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/store";

export function GlobalEffects() {
  useEffect(() => {
    const interval = setInterval(() => {
      useCartStore.getState().removeExpiredItems();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return null; // No renderiza nada
}