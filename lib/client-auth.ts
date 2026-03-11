"use client";

import { getMyCart } from "@/lib/actions";

let cachedUserId: string | null | undefined = undefined;
let pending: Promise<string | null> | null = null;

export function setCachedUserId(userId: string | null) {
  cachedUserId = userId;
}

export async function getCachedUserId(): Promise<string | null> {
  if (cachedUserId !== undefined) return cachedUserId;
  if (pending) return pending;

  pending = (async () => {
    const cart = await getMyCart();
    cachedUserId = cart.authenticated ? cart.userId : null;
    return cachedUserId;
  })().finally(() => {
    pending = null;
  });

  return pending;
}

