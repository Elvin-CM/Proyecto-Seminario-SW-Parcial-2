"use server";
import { prisma } from "@/lib/prisma";
import { CartItem } from "@/lib/store";
import { auth } from "@/lib/auth";
import { CART_EXPIRATION_MS } from "@/lib/config";
import { reserveStock } from "./stock";
import { Prisma } from "@prisma/client";

function hasCartTablesInClient() {
  const p = prisma as unknown as {
    cart?: { findUnique?: unknown; upsert?: unknown };
    cartEntry?: { upsert?: unknown };
  };
  return (
    typeof p.cart?.findUnique === "function" &&
    typeof p.cart?.upsert === "function" &&
    typeof p.cartEntry?.upsert === "function"
  );
}

function mapDbCartItemToStoreItem(dbItem: {
  quantity: number;
  expiresAt: Date;
  createdAt: Date;
  product: { id: string; name: string; price: Prisma.Decimal; image: string; stock: number };
}): CartItem {
  return {
    id: dbItem.product.id,
    name: dbItem.product.name,
    price: Number(dbItem.product.price),
    image: dbItem.product.image,
    quantity: dbItem.quantity,
    maxStock: dbItem.product.stock,
    addedAt: dbItem.createdAt.getTime(),
    expiresAt: dbItem.expiresAt.getTime(),
  };
}

export async function getCurrentUserId() {
  const session = await auth();
  return { userId: session?.user?.id ?? null };
}

export async function getMyCart() {
  type MyCartResult =
    | { authenticated: false; userId: null; items: CartItem[] }
    | { authenticated: true; userId: string; items: CartItem[] };

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { authenticated: false, userId: null, items: [] } as MyCartResult;
  }

  if (!hasCartTablesInClient()) {
    const now = new Date();
    await prisma.stockReservation.deleteMany({
      where: { sessionId: userId, expiresAt: { lt: now } },
    });

    const reservations = await prisma.stockReservation.findMany({
      where: { sessionId: userId, expiresAt: { gt: now } },
      orderBy: { createdAt: "asc" },
      include: {
        product: { select: { id: true, name: true, price: true, image: true, stock: true } },
      },
    });

    const items = reservations.map((r) => ({
      id: r.product.id,
      name: r.product.name,
      price: Number(r.product.price),
      image: r.product.image,
      quantity: r.quantity,
      maxStock: r.product.stock,
      addedAt: r.createdAt.getTime(),
      expiresAt: r.expiresAt.getTime(),
    }));

    return { authenticated: true, userId, items } as MyCartResult;
  }

  const now = new Date();
  const cart = await prisma.cart.findUnique({ where: { userId }, select: { id: true } });
  
  if (!cart) {
    return { authenticated: true, userId, items: [] } as MyCartResult;
  }

  await prisma.cartEntry.deleteMany({ where: { cartId: cart.id, expiresAt: { lt: now } } });

  const cartWithItems = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          product: { select: { id: true, name: true, price: true, image: true, stock: true } },
        },
      },
    },
  });

  const items = (cartWithItems?.items ?? []).map(mapDbCartItemToStoreItem);
  return { authenticated: true, userId, items } as MyCartResult;
}

async function mutateUserCartItem(params: {
  userId: string;
  productId: string;
  mode: "set" | "add";
  quantity: number;
}) {
  const { userId, productId } = params;
  const requested = Math.max(0, Math.floor(params.quantity));
  const expiresAt = new Date(Date.now() + CART_EXPIRATION_MS);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const cart = await tx.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      select: { id: true },
    });

    await tx.cartEntry.deleteMany({ where: { cartId: cart.id, expiresAt: { lt: now } } });
    await tx.stockReservation.deleteMany({ where: { productId, expiresAt: { lt: now } } });

    const [existingReservation, reservations, product, existingEntry] = await Promise.all([
      tx.stockReservation.findFirst({ where: { productId, sessionId: userId } }),
      tx.stockReservation.aggregate({
        where: { productId, expiresAt: { gt: now } },
        _sum: { quantity: true },
      }),
      tx.product.findUnique({
        where: { id: productId },
        select: { id: true, name: true, price: true, image: true, stock: true },
      }),
      tx.cartEntry.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId } },
        select: { quantity: true },
      }),
    ]);

    if (!product) throw new Error("Producto no encontrado");

    const currentQty = existingEntry?.quantity ?? 0;
    const desiredQty = params.mode === "add" ? currentQty + requested : requested;

    const totalReserved = reservations._sum.quantity ?? 0;
    const reservedByMe = existingReservation?.quantity ?? 0;
    const totalReservedExcludingMe = Math.max(0, totalReserved - reservedByMe);
    const availableForMe = product.stock - totalReservedExcludingMe;

    if (availableForMe < desiredQty) {
      throw new Error("Stock insuficiente");
    }

    if (desiredQty === 0) {
      await Promise.all([
        tx.cartEntry.deleteMany({ where: { cartId: cart.id, productId } }),
        tx.stockReservation.deleteMany({ where: { productId, sessionId: userId } }),
      ]);
    } else {
      await tx.cartEntry.upsert({
        where: { cartId_productId: { cartId: cart.id, productId } },
        create: { cartId: cart.id, productId, quantity: desiredQty, expiresAt },
        update: { quantity: desiredQty, expiresAt },
      });

      if (existingReservation) {
        await tx.stockReservation.update({
          where: { id: existingReservation.id },
          data: { quantity: desiredQty, expiresAt },
        });
      } else {
        await tx.stockReservation.create({
          data: { productId, quantity: desiredQty, sessionId: userId, expiresAt },
        });
      }
    }

    const cartWithItems = await tx.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
          include: {
            product: { select: { id: true, name: true, price: true, image: true, stock: true } },
          },
        },
      },
    });

    return (cartWithItems?.items ?? []).map(mapDbCartItemToStoreItem);
  }, { timeout: 10000 });
}

export async function addToMyCart(productId: string, quantityToAdd: number) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false as const, error: "No autenticado" };

  const qtyToAdd = Math.max(1, Math.floor(quantityToAdd));

  try {
    if (!hasCartTablesInClient()) {
      const now = new Date();
      const existing = await prisma.stockReservation.findFirst({
        where: { productId, sessionId: userId, expiresAt: { gt: now } },
        select: { quantity: true },
      });
      const nextQty = (existing?.quantity ?? 0) + qtyToAdd;
      const reserve = await reserveStock(productId, nextQty, userId);
      if (!reserve.success) {
        return { success: false as const, error: reserve.error || "Stock insuficiente" };
      }
      const fresh = await getMyCart();
      return { success: true as const, items: fresh.items };
    }

    const items = await mutateUserCartItem({
      userId,
      productId,
      mode: "add",
      quantity: qtyToAdd,
    });

    return { success: true as const, items };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { success: false as const, error: message };
  }
}

export async function setMyCartQuantity(productId: string, quantity: number) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false as const, error: "No autenticado" };

  try {
    if (!hasCartTablesInClient()) {
      const qty = Math.max(0, Math.floor(quantity));
      if (qty === 0) {
        await prisma.stockReservation.deleteMany({ where: { productId, sessionId: userId } });
      } else {
        const reserve = await reserveStock(productId, qty, userId);
        if (!reserve.success) {
          return { success: false as const, error: reserve.error || "Stock insuficiente" };
        }
      }
      const fresh = await getMyCart();
      return { success: true as const, items: fresh.items };
    }

    const items = await mutateUserCartItem({
      userId,
      productId,
      mode: "set",
      quantity,
    });

    return { success: true as const, items };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { success: false as const, error: message };
  }
}

export async function removeFromMyCart(productId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false as const, error: "No autenticado" };

  try {
    if (!hasCartTablesInClient()) {
      await prisma.stockReservation.deleteMany({ where: { productId, sessionId: userId } });
      const fresh = await getMyCart();
      return { success: true as const, items: fresh.items };
    }

    const items = await mutateUserCartItem({
      userId,
      productId,
      mode: "set",
      quantity: 0,
    });

    return { success: true as const, items };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { success: false as const, error: message };
  }
}

export async function clearMyCart() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false as const, error: "No autenticado" };

  try {
    if (!hasCartTablesInClient()) {
      await prisma.stockReservation.deleteMany({ where: { sessionId: userId } });
      return { success: true as const };
    }

    const cart = await prisma.cart.findUnique({ where: { userId }, select: { id: true } });
    if (!cart) return { success: true as const };

    await prisma.$transaction(async (tx) => {
      await tx.cartEntry.deleteMany({ where: { cartId: cart.id } });
      await tx.stockReservation.deleteMany({ where: { sessionId: userId } });
    });

    return { success: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { success: false as const, error: message };
  }
}
