"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendDeliveryStatusEmail } from "@/lib/order-email";
import { OrderDeliveryStatusSchema } from "@/lib/validations";
import { requireAdminUser } from "@/lib/auth-guards";

type DeliveryStatus = "PENDING" | "PACKAGING" | "SHIPPED" | "RECEIVED";

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

export async function updateOrderDeliveryStatus(formData: FormData) {
  const data = Object.fromEntries(formData);
  const result = OrderDeliveryStatusSchema.safeParse(data);

  if (!result.success) {
    throw new Error("Solicitud inválida");
  }

  const { orderId, deliveryStatus } = result.data;

  await requireAdminUser();

  const currentOrder = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      packagedAt: true,
      shippedAt: true,
    },
  });

  if (!currentOrder) {
    throw new Error("Pedido no encontrado");
  }

  const nextStatus = deliveryStatus as DeliveryStatus;
  const now = new Date();
  const updateData: {
    deliveryStatus: DeliveryStatus;
    packagedAt?: Date;
    shippedAt?: Date;
  } = {
    deliveryStatus: nextStatus,
  };

  if (nextStatus === "PACKAGING") {
    updateData.packagedAt = currentOrder.packagedAt ?? now;
  }

  if (nextStatus === "SHIPPED") {
    updateData.packagedAt = currentOrder.packagedAt ?? now;
    updateData.shippedAt = currentOrder.shippedAt ?? now;
  }

  await prisma.order.update({
    where: { id: orderId },
    data: updateData,
  });

  const orderForEmail = await getOrderEmailPayload(orderId);
  if (orderForEmail) {
    try {
      await sendDeliveryStatusEmail(orderForEmail);
    } catch (emailError) {
      console.error("Delivery status email failed:", emailError);
    }
  }

  revalidateOrderPaths(orderId);
}
