"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, Search, Filter } from "lucide-react";
import toast from "react-hot-toast";

import { ProductFormModal } from "./product-form-modal";
import { DeleteDialog } from "./delete-dialog";

export function InventoryManager({ categories }: { categories: { id: string; name: string }[] }) {
  const [products, setProducts] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("ALL");
  const [isLoading, setIsLoading] = useState(false);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Record<string, unknown> | null>(null);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Record<string, unknown> | null>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const url = new URL("/api/productos", window.location.origin);
      url.searchParams.set("page", page.toString());
      if (search) url.searchParams.set("search", search);
      if (categoryId && categoryId !== "ALL") url.searchParams.set("categoryId", categoryId);
      
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Error fetching");
      const data = await res.json();
      setProducts(data.products || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      toast.error("Error al cargar los productos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchProducts();
    }, 300); // debounce search
    
    return () => clearTimeout(handler);
  }, [page, search, categoryId]);

  const handleCreate = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleEdit = (product: Record<string, unknown>) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDelete = (product: Record<string, unknown>) => {
    setDeletingProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchProducts();
    setEditingProduct(null);
  };

  const handleDeleteSuccess = () => {
    setIsDeleteDialogOpen(false);
    fetchProducts();
    setDeletingProduct(null);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-1 gap-2 w-full sm:w-auto items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar producto..." 
              value={search}
              onChange={(e) => {
                 setSearch(e.target.value);
                 setPage(1);
              }}
              className="pl-8"
            />
          </div>
          <div className="relative flex-1 sm:max-w-[200px]">
            <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <select 
              value={categoryId} 
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="ALL">Todas las categorías</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Agregar Producto
        </Button>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Producto</th>
                <th className="px-6 py-4 font-medium">Precio</th>
                <th className="px-6 py-4 font-medium">Stock</th>
                <th className="px-6 py-4 font-medium">Categoría</th>
                <th className="px-6 py-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Cargando productos...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No se encontraron productos.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={String(p.id)} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{String(p.name)}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">{String(p.description)}</div>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {formatCurrency(Number(p.price))}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={Number(p.stock) > 10 ? "default" : Number(p.stock) > 0 ? "secondary" : "destructive"}>
                        {String(p.stock)} unidades
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {(p.category as { name?: string })?.name || "Sin Categoría"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(p)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(p)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center gap-4 py-4 px-2">
          <p className="text-sm text-muted-foreground">Mostrando {products.length} de {total} resultados</p>
          <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <span className="text-sm font-medium">
                Página {page} de {totalPages}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Siguiente
              </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ProductFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        product={editingProduct} 
        categories={categories}
        onSuccess={handleFormSuccess}
      />

      <DeleteDialog 
        isOpen={isDeleteDialogOpen} 
        onClose={() => setIsDeleteDialogOpen(false)} 
        product={deletingProduct} 
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
