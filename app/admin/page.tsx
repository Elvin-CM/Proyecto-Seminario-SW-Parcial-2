import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const [totalOrders, totalUsers, totalRevenue, pendingOrders] = await prisma.$transaction([
    prisma.order.count(),
    prisma.user.count(),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
    }),
    prisma.order.count({ where: { deliveryStatus: "PENDING" } }),
  ]);

  const revenueValue = Number(totalRevenue._sum.totalAmount ?? 0);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
            <Users className="h-4 w-4" />
            Administración Global
          </div>
          <h1 className="text-3xl font-bold">Panel Admin</h1>
          <p className="text-muted-foreground">Vista segura para usuarios con rol ADMIN.</p>
        </div>

        <Link href="/admin/orders" className="inline-flex items-center gap-2 rounded-md border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100">
          Ver pedidos
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pedidos totales</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{totalOrders}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Usuarios registrados</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{totalUsers}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ventas totales</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">${revenueValue.toFixed(2)}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pedidos pendiente envío</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{pendingOrders}</CardContent>
        </Card>
      </div>

      <section className="mt-8">
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold">Acciones especializadas</h2>
            <div className="mt-4 space-y-2">
              <Badge>Solo visible para ADMIN</Badge>
              <p className="text-sm text-muted-foreground">Actualiza entregas y monitorea el estado de órdenes desde el módulo de pedidos.</p>
              <Badge variant="outline">Seguridad habilitada</Badge>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
