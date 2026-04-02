"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "react-hot-toast";

export function ProductFormModal({ isOpen, onClose, product, categories, onSuccess }: {
  isOpen: boolean;
  onClose: () => void;
  product: Record<string, unknown> | null;
  categories: { id: string, name: string }[];
  onSuccess: () => void;
}) {
  const isEditing = !!product;
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    categoryId: "",
    image: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setFormData({
          name: String(product.name || ""),
          description: String(product.description || ""),
          price: String(product.price || "0"),
          stock: String(product.stock || "0"),
          categoryId: String(product.categoryId || ""),
          image: String(product.image || "")
        });
      } else {
        setFormData({
          name: "",
          description: "",
          price: "",
          stock: "",
          categoryId: categories[0]?.id || "",
          image: ""
        });
      }
    }
  }, [isOpen, product, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
      };

      const url = isEditing ? `/api/productos/${product.id}` : "/api/productos";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Error al guardar el producto");
      }

      toast.success(isEditing ? "Producto actualizado correctamente" : "Producto creado correctamente");
      onSuccess();
    } catch (error: unknown) {
      toast.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 className="text-lg font-semibold leading-none tracking-tight">{isEditing ? "Editar Producto" : "Nuevo Producto"}</h2>
          <p className="text-sm text-muted-foreground">
             {isEditing ? "Modifica los detalles del producto seleccionado." : "Ingresa los detalles para crear un nuevo producto en el inventario."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre *</label>
            <Input 
              required 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              placeholder="Ej. Teclado Mecánico"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descripción *</label>
            <textarea 
              required 
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.description} 
              onChange={e => setFormData({ ...formData, description: e.target.value })} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Precio *</label>
              <Input 
                required 
                type="number" 
                step="0.01" 
                min="0.01"
                value={formData.price} 
                onChange={e => setFormData({ ...formData, price: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Stock *</label>
              <Input 
                required 
                type="number" 
                step="1"
                min="0"
                value={formData.stock} 
                onChange={e => setFormData({ ...formData, stock: e.target.value })} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Categoría *</label>
            <select 
              required
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.categoryId} 
              onChange={e => setFormData({ ...formData, categoryId: e.target.value })} 
            >
              <option value="" disabled>Selecciona una categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">URL de Imagen</label>
            <Input 
              value={formData.image} 
              onChange={e => setFormData({ ...formData, image: e.target.value })} 
              placeholder="https://..."
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar Producto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
