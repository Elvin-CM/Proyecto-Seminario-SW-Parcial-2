import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { getDeliveryStatusDescription, getDeliveryStatusLabel, getPaymentStatusLabel } from "@/lib/order-display";
import { updateOrderDeliveryStatus } from "@/lib/actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Truck, PackageCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
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
          product: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  const totalOrders = orders.length;
  const shippedOrders = orders.filter((order) => order.deliveryStatus === "SHIPPED").length;
  const receivedOrders = orders.filter((order) => order.deliveryStatus === "RECEIVED").length;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            Panel administrativo
          </div>
          <h1 className="text-3xl font-bold">Compras de usuarios</h1>
          <p className="text-muted-foreground">
            Consulta pedidos, compradores y avanza manualmente las entregas.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground">Pedidos</p>
              <p className="text-2xl font-bold">{totalOrders}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground">Enviados</p>
              <p className="text-2xl font-bold">{shippedOrders}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground">Recibidos</p>
              <p className="text-2xl font-bold">{receivedOrders}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-6">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <CardTitle className="text-xl">Pedido {order.id}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString("es-HN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={order.status === "PAID" ? "default" : "secondary"}>
                    {getPaymentStatusLabel(order.status)}
                  </Badge>
                  <Badge variant={order.deliveryStatus === "RECEIVED" ? "default" : "outline"}>
                    {getDeliveryStatusLabel(order.deliveryStatus)}
                  </Badge>
                </div>
              </div>

              <div className="rounded-xl border bg-muted/30 p-4 text-sm">
                <p className="font-medium">Cliente</p>
                <p>{order.user?.name || "Cliente sin nombre"}</p>
                <p className="text-muted-foreground">{order.customerEmail}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Cuenta: {order.user?.email || "Compra sin cuenta"}
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-[1.4fr,0.8fr]">
                <div>
                  <p className="mb-3 text-sm font-medium text-muted-foreground">Detalle de compra</p>
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-muted-foreground">Cantidad: {item.quantity}</p>
                        </div>
                        <p className="font-semibold">
                          {formatCurrency(Number(item.price) * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Estado de entrega</p>
                    <p className="mt-1 text-lg font-semibold">
                      {getDeliveryStatusLabel(order.deliveryStatus)}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {getDeliveryStatusDescription(order.deliveryStatus)}
                    </p>
                  </div>

                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Total pagado</p>
                    <p className="mt-1 text-2xl font-bold">
                      {formatCurrency(Number(order.totalAmount))}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    {order.deliveryStatus === "PENDING" && (
                      <form action={updateOrderDeliveryStatus}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="deliveryStatus" value="PACKAGING" />
                        <Button type="submit" className="w-full">
                          <PackageCheck className="mr-2 h-4 w-4" />
                          Marcar empaquetado
                        </Button>
                      </form>
                    )}

                    {(order.deliveryStatus === "PENDING" || order.deliveryStatus === "PACKAGING") && (
                      <form action={updateOrderDeliveryStatus}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="deliveryStatus" value="SHIPPED" />
                        <Button type="submit" variant="outline" className="w-full">
                          <Truck className="mr-2 h-4 w-4" />
                          Marcar enviado manualmente
                        </Button>
                      </form>
                    )}

                    {order.deliveryStatus === "SHIPPED" && (
                      <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                        Esperando confirmación del cliente.
                      </p>
                    )}

                    {order.deliveryStatus === "RECEIVED" && (
                      <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        El cliente ya confirmó la recepción.
                      </p>
                    )}

                    <Button asChild variant="ghost" className="w-full">
                      <Link href={`/track/${order.id}`}>Abrir seguimiento</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
