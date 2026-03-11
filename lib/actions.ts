"use server";

import { prisma } from "@/lib/prisma";
import { CartItem } from "@/lib/store";
import { Prisma } from "@prisma/client";
import { signIn, signOut, auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

// ========== ORDER ACTIONS ==========
export async function createOrder(
  cartItems: CartItem[],
  paypalOrderId: string,
  customerEmail: string
) {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;

    const order = await prisma.$transaction(async (tx) => {
      let calculatedTotal = 0;
      const orderItemsData = [];

      for (const item of cartItems) {
        const product = await tx.product.findUnique({
          where: { id: item.id },
        });

        if (!product) {
          throw new Error(`Producto no encontrado: ${item.name}`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Stock insuficiente para: ${product.name}`);
        }

        const itemTotal = Number(product.price) * item.quantity;
        calculatedTotal += itemTotal;

        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price,
        });

        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.quantity } },
        });
      }

      const newOrder = await tx.order.create({
        data: {
          paypalOrderId,
          customerEmail,
          totalAmount: new Prisma.Decimal(calculatedTotal),
          status: "PAID",
          userId,
          items: {
            create: orderItemsData,
          },
        },
      });

      return newOrder;
    });

    return { success: true, orderId: order.id };
  } catch (error) {
    console.error("Transaction Failed:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { success: false, error: message };
  }
}

// ========== USER ORDERS ==========
export async function getUserOrders() {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "No autenticado", orders: [] };
  }

  try {
    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, image: true, slug: true },
            },
          },
        },
      },
    });

    return { success: true, orders };
  } catch {
    return { success: false, error: "Error al obtener pedidos", orders: [] };
  }
}

// ========== AUTH ACTIONS ==========
export async function login(formData: FormData): Promise<void> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/auth/login?error=invalid");
    }
    throw error;
  }
  redirect("/");
}

export async function register(formData: FormData): Promise<void> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  const exists = await prisma.user.findUnique({ where: { email } });

  if (exists) {
    redirect("/auth/register?error=exists");
  }

  await prisma.user.create({
    data: {
      email,
      name,
      password: await bcrypt.hash(password, 10),
    },
  });

  redirect("/auth/login?success=registered");
}

export async function loginWithGoogle(): Promise<void> {
  await signIn("google", { redirectTo: "/" });
}

export async function logout(): Promise<void> {
  await signOut({ redirectTo: "/" });
}

// ========== STOCK RESERVATION ACTIONS ==========
export async function reserveStock(
  productId: string,
  quantity: number,
  sessionId: string
) {
  try {
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      await tx.stockReservation.deleteMany({
        where: { productId, expiresAt: { lt: new Date() } },
      });

      const reservations = await tx.stockReservation.aggregate({
        where: { productId, expiresAt: { gt: new Date() } },
        _sum: { quantity: true },
      });

      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { stock: true },
      });

      if (!product) throw new Error("Producto no encontrado");

      const totalReserved = reservations._sum.quantity ?? 0;
      const availableStock = product.stock - totalReserved;

      if (availableStock < quantity) {
        throw new Error("Stock insuficiente");
      }

      const existing = await tx.stockReservation.findFirst({
        where: { productId, sessionId },
      });

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