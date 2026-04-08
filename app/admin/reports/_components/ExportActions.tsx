"use client";

import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportActionsProps {
  salesData: any[];
  inventoryData: any[];
  customerData: any[];
  reportTitle: string;
}

export function ExportActions({ 
  salesData, 
  inventoryData, 
  customerData, 
  reportTitle 
}: ExportActionsProps) {
  
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Sales Sheet
    const wsSales = XLSX.utils.json_to_sheet(salesData);
    XLSX.utils.book_append_sheet(wb, wsSales, "Ventas");
    
    // Inventory Sheet
    const wsInv = XLSX.utils.json_to_sheet(inventoryData);
    XLSX.utils.book_append_sheet(wb, wsInv, "Inventario");
    
    // Customers Sheet
    const wsCust = XLSX.utils.json_to_sheet(customerData);
    XLSX.utils.book_append_sheet(wb, wsCust, "Clientes");
    
    XLSX.writeFile(wb, `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(reportTitle, 14, 15);
    doc.setFontSize(10);
    doc.text(`Fecha de generación: ${new Date().toLocaleString()}`, 14, 22);
    
    doc.text("Resumen de Ventas", 14, 32);
    autoTable(doc, {
      startY: 35,
      head: [['Fecha', 'Ingresos']],
      body: salesData.map(d => [d.name, `$${d.value}`]),
    });
    
    doc.addPage();
    doc.text("Estado de Inventario (Alertas)", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [['Producto', 'Categoría', 'Stock']],
      body: inventoryData.map(d => [d.name, d.category, d.stock]),
    });
    
    doc.save(`${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={exportToExcel} className="flex items-center gap-2">
        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
        Excel
      </Button>
      <Button variant="outline" size="sm" onClick={exportToPDF} className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-red-600" />
        PDF
      </Button>
    </div>
  );
}
