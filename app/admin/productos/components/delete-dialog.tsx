"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "react-hot-toast";

export function DeleteDialog({ isOpen, onClose, product, onSuccess }: {
  isOpen: boolean;
  onClose: () => void;
  product: Record<string, unknown> | null;
  onSuccess: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!product) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/productos/${product.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Error al eliminar el producto");
      }

      toast.success("Producto eliminado exitosamente");
      onSuccess();
    } catch (error: unknown) {
      toast.error((error as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 className="text-lg font-semibold leading-none tracking-tight">Eliminar Producto</h2>
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro de que deseas eliminar permanentemente el producto <strong>{String(product.name)}</strong>? Esta acción no se puede deshacer.
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>Cancelar</Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Eliminando..." : "Sí, eliminar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
