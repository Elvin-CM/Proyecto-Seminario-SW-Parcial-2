import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { getDeliveryStatusLabel, getPaymentStatusLabel } from "@/lib/order-display";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Package } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
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

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 flex items-center gap-3">
        <Package className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Mis pedidos</h1>
          <p className="text-muted-foreground">
            Revisa tu historial de compras y el estado de entrega.
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg font-medium">Aún no tienes pedidos registrados.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Cuando completes una compra, aparecerá aquí.
            </p>
            <Button asChild className="mt-6">
              <Link href="/catalog">Ir al catálogo</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-xl">Pedido {order.id}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("es-HN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={order.status === "PAID" ? "default" : "secondary"}>
                    {getPaymentStatusLabel(order.status)}
                  </Badge>
                  <Badge variant={order.deliveryStatus === "RECEIVED" ? "default" : "outline"}>
                    {getDeliveryStatusLabel(order.deliveryStatus)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span>
                        {item.product.name} x{item.quantity}
                      </span>
                      <span>{formatCurrency(Number(item.price) * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Correo del cliente</p>
                    <p className="font-medium">{order.customerEmail}</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-xl font-bold">{formatCurrency(Number(order.totalAmount))}</p>
                  </div>
                </div>

                <Button asChild variant="outline">
                  <Link href={`/track/${order.id}`}>
                    Ver seguimiento
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
