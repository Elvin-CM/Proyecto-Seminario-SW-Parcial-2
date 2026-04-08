import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { 
  getSalesReport, 
  getInventoryReport, 
  getShippingReport, 
  getCustomerReport, 
  getTopSellingProducts 
} from "@/lib/actions/reports";
import { ReportFilters } from "./_components/ReportFilters";
import { SalesTrendChart } from "./_components/SalesTrendChart";
import { CategoryDistribution } from "./_components/CategoryDistribution";
import { InventoryOverview } from "./_components/InventoryOverview";
import { ShippingStatusChart } from "./_components/ShippingStatusChart";
import { TopCustomers } from "./_components/TopCustomers";
import { ExportActions } from "./_components/ExportActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Package, Truck, Users, PieChart as PieChartIcon } from "lucide-react";

export const dynamic = "force-dynamic";

interface ReportsPageProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
    tab?: string;
  }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const { from, to, tab = "ventas" } = await searchParams;

  // Fetch all data
  const [sales, inventory, shipping, customers, topProducts] = await Promise.all([
    getSalesReport(from, to),
    getInventoryReport(),
    getShippingReport(from, to),
    getCustomerReport(from, to),
    getTopSellingProducts(from, to),
  ]);

  const activeTab = tab;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            <BarChart3 className="h-3 w-3" />
            Análisis de Negocio Avanzado
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Reportes Generales</h1>
          <p className="text-lg text-gray-500">Visualiza el rendimiento de tu tienda y toma decisiones basadas en datos.</p>
        </div>
        
        <ExportActions 
          salesData={sales.dailyChart}
          inventoryData={inventory.lowStockItems}
          customerData={customers}
          reportTitle="Reporte General de Negocio"
        />
      </div>

      {/* Filters */}
      <div className="mb-10">
        <ReportFilters />
      </div>

      {/* Tabs Layout */}
      <div className="space-y-8">
        {/* Sales Tab Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <SalesTrendChart data={sales.dailyChart} totalRevenue={sales.totalRevenue} />
          <CategoryDistribution data={inventory.categoryChart} title="Stock por Categoría" />
          
          <Card className="shadow-sm border-none ring-1 ring-gray-100">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Top 5 Productos Vendidos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y">
                 {topProducts.slice(0, 5).map((p, idx) => (
                   <div key={idx} className="flex items-center justify-between px-6 py-4">
                     <div className="min-w-0">
                       <p className="text-sm font-semibold truncate">{p.name}</p>
                       <p className="text-xs text-emerald-600 font-medium">{p.quantity} vendidos</p>
                     </div>
                     <span className="font-bold text-gray-900">${p.revenue.toLocaleString()}</span>
                   </div>
                 ))}
               </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            <InventoryOverview summary={inventory.summary} lowStockItems={inventory.lowStockItems} />
          </div>

          <div className="space-y-8">
            <ShippingStatusChart data={shipping.statusChart} total={shipping.total} />
            <TopCustomers customers={customers.slice(0, 5)} />
          </div>
        </div>
      </div>
    </div>
  );
}
