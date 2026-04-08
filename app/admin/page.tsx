import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, Package, TrendingUp, AlertTriangle, ShoppingCart, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  // Fetch Summary Stats
  const [totalOrders, totalUsers, totalRevenue, pendingOrders, lowStockCount] = await prisma.$transaction([
    prisma.order.count(),
    prisma.user.count(),
    prisma.order.aggregate({
      where: { status: "PAID" },
      _sum: { totalAmount: true },
    }),
    prisma.order.count({ where: { deliveryStatus: "PENDING" } }),
    prisma.product.count({ where: { stock: { lt: 10 } } }),
  ]);

  // Fetch Low Stock Products
  const lowStockProducts = await prisma.product.findMany({
    where: { stock: { lt: 10 } },
    take: 4,
    include: { category: true },
    orderBy: { stock: "asc" }
  });

  // Fetch Top Selling Products (Aggregation)
  const topSellersRaw = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 4,
  });

  const topSellers = await Promise.all(
    topSellersRaw.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { name: true, price: true, image: true }
      });
      return { ...product, totalSold: item._sum.quantity };
    })
  );

  // Fetch Recent Orders
  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } }
  });

  // Category Sales Analysis
  const paidOrderItems = await prisma.orderItem.findMany({
    where: { order: { status: "PAID" } },
    include: { product: { include: { category: true } } }
  });

  const salesByCategoryMap: Record<string, number> = {};
  paidOrderItems.forEach(item => {
    const catName = item.product.category.name;
    const itemTotal = Number(item.price) * item.quantity;
    salesByCategoryMap[catName] = (salesByCategoryMap[catName] || 0) + itemTotal;
  });

  const categorySales = Object.entries(salesByCategoryMap)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  const maxCategorySales = Math.max(...categorySales.map(c => c.total), 1);

  const revenueValue = Number(totalRevenue._sum.totalAmount ?? 0);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      {/* Header */}
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            <TrendingUp className="h-3 w-3" />
            Control de Negocio en Tiempo Real
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-lg text-gray-500">Bienvenido de nuevo, {session.user.name}. Aquí tienes un resumen de hoy.</p>
        </div>

        <div className="flex gap-3">
          <Link href="/admin/productos" className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800">
            <Package className="h-4 w-4" />
            Gestionar Productos
          </Link>
          <Link href="/admin/orders" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
            Ver Pedidos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* ... (Keep existing summary cards) */}
        <Card className="border-none shadow-md ring-1 ring-gray-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Ventas Totales</CardTitle>
            <div className="rounded-full bg-emerald-50 p-2 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${revenueValue.toLocaleString()}</div>
            <p className="text-xs text-emerald-600 mt-1">Solo órdenes pagadas</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md ring-1 ring-gray-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Pedidos Totales</CardTitle>
            <div className="rounded-full bg-blue-50 p-2 text-blue-600">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalOrders}</div>
            <p className="text-xs text-gray-400 mt-1">Histórico completo</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md ring-1 ring-gray-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Por Enviar</CardTitle>
            <div className="rounded-full bg-orange-50 p-2 text-orange-600">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-orange-600 mt-1">Requieren atención</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md ring-1 ring-gray-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-red-500 uppercase tracking-wider">Bajo Stock</CardTitle>
            <div className="rounded-full bg-red-50 p-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{lowStockCount}</div>
            <p className="text-xs text-red-600 mt-1">Menos de 10 unidades</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent Orders */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <Card className="border-none shadow-md ring-1 ring-gray-100">
            <CardHeader className="border-b border-gray-50">
              <CardTitle className="text-lg font-bold">Pedidos Recientes</CardTitle>
              <CardDescription>Resumen de las últimas transacciones</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Cliente</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4">Total</th>
                      <th className="px-6 py-4 text-right">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{order.user?.name || "Invitado"}</div>
                          <div className="text-xs text-gray-400">{order.customerEmail}</div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={order.status === "PAID" ? "default" : "secondary"} className={order.status === "PAID" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}>
                            {order.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          ${Number(order.totalAmount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-gray-50 p-4">
                <Link href="/admin/orders" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors">
                  Ver todos los pedidos
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* New: Sales by Category */}
          <Card className="border-none shadow-md ring-1 ring-gray-100">
            <CardHeader className="border-b border-gray-50">
              <CardTitle className="text-lg font-bold">Ventas por Categoría</CardTitle>
              <CardDescription>Distribución de ingresos por tipo de producto</CardDescription>
            </CardHeader>
            <CardContent className="py-6">
              <div className="space-y-6">
                {categorySales.map((cat, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">{cat.name}</span>
                      <span className="font-bold text-gray-900">${cat.total.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-500" 
                        style={{ width: `${(cat.total / maxCategorySales) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                {categorySales.length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-4">Sin datos de ventas procesados</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Sellers & Alerts */}
        <div className="flex flex-col gap-8">
          {/* Top Sellers */}
          <Card className="border-none shadow-md ring-1 ring-gray-100">
            <CardHeader className="border-b border-gray-50">
              <CardTitle className="text-lg font-bold">Más Vendidos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-50">
                {topSellers.map((product, idx) => (
                  <div key={idx} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-emerald-600 font-medium">{product.totalSold} vendidos</p>
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      ${Number(product.price).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Card className="border-none shadow-md ring-1 ring-red-100 bg-red-50/10">
            <CardHeader className="border-b border-red-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <CardTitle className="text-lg font-bold text-red-600">Reposición Urgente</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-red-50">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between px-6 py-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-400">{product.category.name}</p>
                    </div>
                    <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-none px-3">
                      {product.stock} left
                    </Badge>
                  </div>
                ))}
                {lowStockProducts.length === 0 && (
                  <div className="p-8 text-center text-sm text-gray-400">
                    Stock saludable en todo el catálogo
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
