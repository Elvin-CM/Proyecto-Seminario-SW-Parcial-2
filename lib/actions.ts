"use server";

import { prisma } from "@/lib/prisma";
import { CartItem } from "@/lib/store";
import { Prisma } from "@prisma/client";
import { signIn, signOut } from "@/lib/auth";
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
          paypalOrderId: paypalOrderId,
          customerEmail: customerEmail,
          totalAmount: new Prisma.Decimal(calculatedTotal),
          status: "PAID",
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
      // Por ahora solo redirigimos con error en URL
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