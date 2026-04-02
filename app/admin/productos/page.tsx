import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { InventoryManager } from "./components/inventory-manager";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const categories = await prisma.category.findMany();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
        <p className="text-muted-foreground">
          Crea, edita y administra los productos disponibles en la tienda.
        </p>
      </div>

      {/* Convert categories to plain objects for the client component */}
      <InventoryManager 
         categories={categories.map(c => ({ id: c.id, name: c.name }))} 
      />
    </div>
  );
}
