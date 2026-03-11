import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/catalog/product-card";
import { SearchFilters } from "@/components/catalog/search-filters";
import { PackageOpen } from "lucide-react";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  cat?: string;
  inStock?: string;
}

async function getCategories() {
  return await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
}

async function getProducts(params: SearchParams) {
  const { q, cat, inStock } = params;

  const where: Prisma.ProductWhereInput = {};

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  if (cat) {
    where.category = {
      name: cat,
    };
  }

  // Filter by stock availability
  if (inStock === "true") {
    where.stock = {
      gt: 0,
    };
  }

  return await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
    },
  });
}

async function getReservationsMap(productIds: string[]) {
  const now = new Date();

  await prisma.stockReservation.deleteMany({
    where: { expiresAt: { lt: now } },
  });

  if (productIds.length === 0) return new Map<string, number>();

  const reservations = await prisma.stockReservation.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds }, expiresAt: { gt: now } },
    _sum: { quantity: true },
  });

  const map = new Map<string, number>();
  for (const r of reservations) {
    map.set(r.productId, r._sum.quantity ?? 0);
  }
  return map;
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  
  const [products, categories] = await Promise.all([getProducts(params), getCategories()]);
  const reservationMap = await getReservationsMap(products.map((p) => p.id));

  // Stock disponible real = stock - reservas activas
  const productsWithAvailableStock = products.map((product) => {
    const reserved = reservationMap.get(product.id) ?? 0;
    return { ...product, stock: Math.max(0, product.stock - reserved) };
  });

  // Filter products with stock on client side if needed (for real-time stock)
  const showInStock = params.inStock === "true";
  const filteredProducts = showInStock
    ? productsWithAvailableStock.filter((p) => p.stock > 0)
    : productsWithAvailableStock;

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Catálogo</h1>
        <p className="text-muted-foreground mb-6">
          Explora nuestra colección
        </p>
      </section>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar with Filters - Left side on desktop */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <SearchFilters categories={categories} />
        </aside>

        {/* Products Grid - Right side on desktop */}
        <div className="flex-1">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center border rounded-lg bg-gray-50/50 border-dashed">
              <div className="bg-gray-100 p-4 rounded-full mb-4">
                <PackageOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No se encontraron productos</h3>
              <p className="text-muted-foreground max-w-sm mt-2">
                No pudimos encontrar nada que coincida con &quot;{params.q}&quot;
                {params.cat ? ` en ${params.cat}` : ""}
                {params.inStock ? " con stock disponible" : ""}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

