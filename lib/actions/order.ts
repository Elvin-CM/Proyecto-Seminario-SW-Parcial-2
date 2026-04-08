"use server";
import { prisma } from "@/lib/prisma";
import { CartItem } from "@/lib/store";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendOrderConfirmationEmail, sendDeliveryStatusEmail } from "@/lib/order-email";
import { OrderReceivedSchema } from "@/lib/validations";
import { redirect } from "next/navigation";

async function getOrderEmailPayload(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          name: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
}

function revalidateOrderPaths(orderId: string) {
  revalidatePath(`/track/${orderId}`);
  revalidatePath("/orders");
  revalidatePath("/admin/orders");
}

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
          customerEmail: session?.user?.email ?? customerEmail,
          totalAmount: new Prisma.Decimal(calculatedTotal),
          status: "PAID",
          deliveryStatus: "PENDING",
          userId,
          items: {
            create: orderItemsData,
          },
        },
      });

      return newOrder;
    });

    const orderForEmail = await getOrderEmailPayload(order.id);
    if (orderForEmail) {
      try {
        await sendOrderConfirmationEmail(orderForEmail);
      } catch (emailError) {
        console.error("Order email failed:", emailError);
      }
    }

    revalidateOrderPaths(order.id);

    return { success: true, orderId: order.id };
  } catch (error) {
    console.error("Transaction Failed:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { success: false, error: message };
  }
}

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

export async function confirmOrderReceived(formData: FormData) {
  const result = OrderReceivedSchema.safeParse({ orderId: formData.get("orderId") });

  if (!result.success) {
    throw new Error("Solicitud inválida");
  }

  const { orderId } = result.data;

  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryStatus: "RECEIVED",
        receivedAt: new Date(),
      },
    });

    // Enviar correo de confirmación de recepción
    const orderForEmail = await getOrderEmailPayload(orderId);
    if (orderForEmail) {
      try {
        await sendDeliveryStatusEmail(orderForEmail);
      } catch (emailError) {
        console.error("Received confirmation email failed:", emailError);
      }
    }

    revalidateOrderPaths(orderId);
  } catch (error) {
    console.error("Confirm received error:", error);
    throw new Error("Error al confirmar recepción");
  }
}
