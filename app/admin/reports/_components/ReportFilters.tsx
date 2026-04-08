"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, FilterX } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

export function ReportFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  const updateFilters = (newFrom: string, newTo: string) => {
    const params = new URLSearchParams(searchParams);
    if (newFrom) params.set("from", newFrom); else params.delete("from");
    if (newTo) params.set("to", newTo); else params.delete("to");
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  const setPreset = (days: number) => {
    const end = new Date();
    const start = subDays(end, days);
    updateFilters(format(start, "yyyy-MM-dd"), format(end, "yyyy-MM-dd"));
  };

  const setThisMonth = () => {
    const now = new Date();
    updateFilters(format(startOfMonth(now), "yyyy-MM-dd"), format(endOfMonth(now), "yyyy-MM-dd"));
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Filtros de Período</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreset(7)}>Últimos 7 días</Button>
          <Button variant="outline" size="sm" onClick={() => setPreset(30)}>Últimos 30 días</Button>
          <Button variant="outline" size="sm" onClick={setThisMonth}>Este mes</Button>
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-600 hover:text-red-700 hover:bg-red-50">
            <FilterX className="mr-2 h-4 w-4" />
            Limpiar
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 uppercase">Fecha Inicio</label>
          <Input 
            type="date" 
            value={from} 
            onChange={(e) => updateFilters(e.target.value, to)}
            className="focus:ring-emerald-500"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 uppercase">Fecha Fin</label>
          <Input 
            type="date" 
            value={to} 
            onChange={(e) => updateFilters(from, e.target.value)}
            className="focus:ring-emerald-500"
          />
        </div>
      </div>
    </div>
  );
}
