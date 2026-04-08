"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, XCircle } from "lucide-react";

interface InventoryOverviewProps {
  summary: {
    totalProducts: number;
    totalStock: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  lowStockItems: {
    id: string;
    name: string;
    stock: number;
    category: string;
  }[];
}

export function InventoryOverview({ summary, lowStockItems }: InventoryOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-blue-50/50 border-blue-100 shadow-none">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-blue-600">
              <Package className="h-4 w-4" />
              <CardTitle className="text-sm font-medium uppercase">Total Unidades</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalStock}</div>
            <p className="text-xs text-blue-600/70 mt-1">En {summary.totalProducts} productos</p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/50 border-amber-100 shadow-none">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              <CardTitle className="text-sm font-medium uppercase">Bajo Stock</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.lowStockCount}</div>
            <p className="text-xs text-amber-600/70 mt-1">Requieren atención</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50/50 border-red-100 shadow-none">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-4 w-4" />
              <CardTitle className="text-sm font-medium uppercase">Sin Stock</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.outOfStockCount}</div>
            <p className="text-xs text-red-600/70 mt-1">Agotados</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-none ring-1 ring-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Alertas de Inventario</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.category}</p>
                  </div>
                  <Badge variant="destructive" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-3">
                    {item.stock} unidades
                  </Badge>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-gray-400">
                No hay alertas de stock bajo actualmente.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
