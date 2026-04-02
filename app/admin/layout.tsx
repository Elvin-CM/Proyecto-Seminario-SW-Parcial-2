import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Package, ShoppingCart } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="mx-auto min-h-screen bg-gray-50/30">
      <div className="bg-white border-b sticky top-[64px] z-40">
        <div className="container mx-auto px-4 max-w-7xl">
           <nav className="flex space-x-1 py-1">
             <Link 
               href="/admin/orders" 
               className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 hover:text-primary hover:bg-gray-50 rounded-md transition-colors"
             >
               <ShoppingCart className="h-4 w-4" />
               Pedidos
             </Link>
             <Link 
               href="/admin/productos" 
               className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 hover:text-primary hover:bg-gray-50 rounded-md transition-colors"
             >
               <Package className="h-4 w-4" />
               Inventario
             </Link>
           </nav>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {children}
      </div>
    </div>
  );
}
