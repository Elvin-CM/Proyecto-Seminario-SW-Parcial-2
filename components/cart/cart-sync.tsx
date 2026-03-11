"use client";

import { useEffect, useRef } from "react";
import { getMyCart } from "@/lib/actions";
import { useCartStore } from "@/lib/store";
import { setCachedUserId } from "@/lib/client-auth";

// Keeps the client cart in sync with the authenticated user's DB cart.
export function CartSync() {
  const setItems = useCartStore((s) => s.setItems);
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    (async () => {
      const res = await getMyCart();
      setCachedUserId(res.authenticated ? res.userId : null);
      if (res.authenticated) {
        setItems(res.items);
      }
    })();
  }, [setItems]);

  return null;
}
