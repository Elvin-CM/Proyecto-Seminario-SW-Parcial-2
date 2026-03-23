import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { confirmOrderReceived } from "@/lib/actions";
import { getDeliveryStatusDescription, getDeliveryStatusLabel, getPaymentStatusLabel } from "@/lib/order-display";
import { formatCurrency } from "@/lib/utils";
import { DeliveryStatus, Prisma } from "@prisma/client";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Package,
  Calendar,
  CreditCard,
  ArrowLeft,
  ArrowRight,
  Truck,
  ClipboardList,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

interface OrderPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
}

const deliveryStepOrder: Record<DeliveryStatus, number> = {
  PENDING: 0,
  PACKAGING: 1,
  SHIPPED: 2,
  RECEIVED: 3,
};

async function getOrder(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  return order;
}

export default async function OrderPage({
  params,
  searchParams,
}: OrderPageProps) {
  const { id } = await params;
  const { success } = await searchParams;
  const order = await getOrder(id);
  const session = await auth();

  const isAdmin = session?.user?.role === "ADMIN";
  const isOwner = Boolean(session?.user?.id && order.userId === session.user.id);

  if (order.userId && !isOwner && !isAdmin) {
    notFound();
  }

  const canConfirmReceipt = isOwner && order.deliveryStatus === "SHIPPED";

  let userOrders: {
    id: string;
    createdAt: Date;
    totalAmount: Prisma.Decimal;
    deliveryStatus: DeliveryStatus;
  }[] = [];

  if (isOwner) {
    userOrders = await prisma.order.findMany({
      where: {
        userId: session!.user.id,
        id: { not: order.id },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        createdAt: true,
        totalAmount: true,
        deliveryStatus: true,
      },
    });
  }

  const date = new Date(order.createdAt).toLocaleDateString("es-HN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const deliverySteps = [
    {
      key: "PENDING" as const,
      label: "Pedido recibido",
      description: "La compra fue registrada correctamente.",
      icon: ClipboardList,
      date: order.createdAt,
    },
    {
      key: "PACKAGING" as const,
      label: "Empaquetado",
      description: "El equipo está preparando tu pedido.",
      icon: Package,
      date: order.packagedAt,
    },
    {
      key: "SHIPPED" as const,
      label: "Envío manual",
      description: "El pedido ya fue despachado.",
      icon: Truck,
      date: order.shippedAt,
    },
    {
      key: "RECEIVED" as const,
      label: "Recibido",
      description: "El cliente confirmó la entrega.",
      icon: UserCheck,
      date: order.receivedAt,
    },
  ];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      {success === "true" && (
        <div className="mb-8 flex items-start gap-4 rounded-lg border border-green-200 bg-green-50 p-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-green-600" />
          <div>
            <h2 className="text-lg font-semibold text-green-800">Pago exitoso</h2>
            <p className="text-green-700">
              Gracias por tu compra. Usaremos <strong>{order.customerEmail}</strong> para
              enviarte actualizaciones del pedido.
            </p>
          </div>
        </div>
      )}

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Seguimiento del pedido</h1>
          <p className="mt-1 flex items-center gap-2 text-muted-foreground">
            ID:
            <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs">{order.id}</span>
          </p>
          {isAdmin && (
            <p className="mt-2 text-sm text-emerald-700">
              Estás viendo este pedido como administrador.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={order.status === "PAID" ? "default" : "secondary"} className="px-4 py-1 text-sm">
            {getPaymentStatusLabel(order.status)}
          </Badge>
          <Badge variant={order.deliveryStatus === "RECEIVED" ? "default" : "outline"} className="px-4 py-1 text-sm">
            {getDeliveryStatusLabel(order.deliveryStatus)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Artículos ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-gray-100">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.product.name}</h3>
                    <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(Number(item.price))}</p>
                    <p className="text-xs text-muted-foreground">unitario</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Línea de entrega</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {getDeliveryStatusDescription(order.deliveryStatus)}
              </p>
              <div className="space-y-3">
                {deliverySteps.map((step) => {
                  const reached = deliveryStepOrder[order.deliveryStatus] >= deliveryStepOrder[step.key];
                  const Icon = step.icon;

                  return (
                    <div
                      key={step.key}
                      className={`rounded-xl border p-4 ${
                        reached ? "border-primary/30 bg-primary/5" : "border-dashed bg-muted/20"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`rounded-full p-2 ${
                            reached ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                            <p className="font-medium">{step.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {step.date
                                ? new Date(step.date).toLocaleDateString("es-HN", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Pendiente"}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" /> Fecha
                </span>
                <span className="text-right text-sm">{date}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <CreditCard className="h-4 w-4" /> Método
                </span>
                <span className="text-sm">PayPal</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Correo del cliente</span>
                <span className="text-right text-sm">{order.customerEmail}</span>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-xl font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(Number(order.totalAmount))}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {canConfirmReceipt && (
            <Card>
              <CardHeader>
                <CardTitle>Confirmar entrega</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Si ya tienes el pedido contigo, confírmalo para cerrar la entrega.
                </p>
                <form action={confirmOrderReceived}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <Button type="submit" className="w-full">
                    <UserCheck className="mr-2 h-4 w-4" />
                    Confirmar recibido
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {userOrders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mis otros pedidos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {userOrders.map((relatedOrder) => (
                  <Link
                    key={relatedOrder.id}
                    href={`/track/${relatedOrder.id}`}
                    className="group flex items-center justify-between rounded-md p-2 transition-colors hover:bg-gray-50"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {formatCurrency(Number(relatedOrder.totalAmount))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getDeliveryStatusLabel(relatedOrder.deliveryStatus)}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-black" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          <Button asChild variant="outline" className="w-full">
            <Link href={isAdmin ? "/admin/orders" : "/"}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {isAdmin ? "Volver al panel" : "Volver a la tienda"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
