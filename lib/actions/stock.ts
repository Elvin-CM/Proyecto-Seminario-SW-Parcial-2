"use server";
import { prisma } from "@/lib/prisma";
import { CART_EXPIRATION_MS } from "@/lib/config";
import { CartItem } from "@/lib/store";

type CartItemPayload = Pick<CartItem, "id" | "quantity">;

export async function validateCartItemsStock(items: CartItemPayload[]) {
  try {
    const unique = new Map<string, number>();
    for (const it of items) {
      unique.set(it.id, (unique.get(it.id) ?? 0) + Math.max(0, Math.floor(it.quantity)));
    }

    const productIds = [...unique.keys()];
    if (productIds.length === 0) return { ok: true as const, issues: [] };

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, stock: true },
    });

    const byId = new Map(products.map((p) => [p.id, p]));
    const issues: { productId: string; message: string }[] = [];

    for (const [productId, qty] of unique.entries()) {
      const p = byId.get(productId);
      if (!p) {
        issues.push({ productId, message: "Producto no encontrado" });
        continue;
      }
      if (p.stock < qty) {
        issues.push({ productId, message: `Stock insuficiente para ${p.name}` });
      }
    }

    return { ok: issues.length === 0, issues };
  } catch {
    return { ok: false as const, issues: [{ productId: "unknown", message: "Error al validar stock" }] };
  }
}

export async function reserveStock(
  productId: string,
  quantity: number,
  sessionId: string
) {
  try {
    const expiresAt = new Date(Date.now() + CART_EXPIRATION_MS);

    await prisma.$transaction(async (tx) => {
      await tx.stockReservation.deleteMany({
        where: { productId, expiresAt: { lt: new Date() } },
      });

      const existing = await tx.stockReservation.findFirst({
        where: { productId, sessionId },
      });

      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { stock: true },
      });

      if (!product) throw new Error("Producto no encontrado");

      const reservations = await tx.stockReservation.aggregate({
        where: { productId, expiresAt: { gt: new Date() } },
        _sum: { quantity: true },
      });

      const totalReserved = reservations._sum.quantity ?? 0;
      const reservedByMe = existing?.quantity ?? 0;
      const totalReservedExcludingMe = Math.max(0, totalReserved - reservedByMe);
      const availableForMe = product.stock - totalReservedExcludingMe;

      if (availableForMe < quantity) {
        throw new Error("Stock insuficiente");
      }

      if (existing) {
        await tx.stockReservation.update({
          where: { id: existing.id },
          data: { quantity, expiresAt },
        });
      } else {
        await tx.stockReservation.create({
          data: { productId, quantity, sessionId, expiresAt },
        });
      }
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { success: false, error: message };
  }
}

export async function releaseReservation(
  productId: string,
  sessionId: string
) {
  try {
    await prisma.stockReservation.deleteMany({
      where: { productId, sessionId },
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function getAvailableStockFromDB(productId: string) {
  try {
    await prisma.stockReservation.deleteMany({
      where: { productId, expiresAt: { lt: new Date() } },
    });

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true },
    });

    if (!product) return { stock: 0 };

    const reservations = await prisma.stockReservation.aggregate({
      where: { productId, expiresAt: { gt: new Date() } },
      _sum: { quantity: true },
    });

    const totalReserved = reservations._sum.quantity ?? 0;
    return { stock: product.stock - totalReserved };
  } catch {
    return { stock: 0 };
  }
}
