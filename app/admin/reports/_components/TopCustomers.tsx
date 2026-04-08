"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TopCustomersProps {
  customers: {
    name: string;
    email: string;
    orders: number;
    spent: number;
  }[];
}

export function TopCustomers({ customers }: TopCustomersProps) {
  return (
    <Card className="shadow-sm border-none ring-1 ring-gray-100">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Clientes Principales</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4 text-center">Pedidos</th>
                <th className="px-6 py-4 text-right">Total Gastado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.map((customer, idx) => (
                <tr key={customer.email} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{customer.name}</div>
                    <div className="text-xs text-gray-400">{customer.email}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      {customer.orders}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900">
                    ${customer.spent.toLocaleString()}
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                    No se encontraron datos de clientes en este período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
