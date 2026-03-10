"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Loader2, Check, Filter } from "lucide-react";
import { useCallback, useState, useEffect, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";

interface Category {
  id: string;
  name: string;
}

interface SearchFiltersProps {
  categories: Category[];
}

export function SearchFilters({ categories }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [showInStock, setShowInStock] = useState(searchParams.get("inStock") === "true");
  const currentCategory = searchParams.get("cat");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const currentQ = searchParams.get("q") || "";
      if (currentQ === query) return;

      const params = new URLSearchParams(searchParams.toString());
      
      if (query) {
        params.set("q", query);
      } else {
        params.delete("q");
      }
      
      startTransition(() => {
        router.push(`/catalog?${params.toString()}`);
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, router, searchParams]);

  const toggleCategory = useCallback((categoryName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentCat = params.get("cat");

    if (currentCat === categoryName) {
      params.delete("cat");
    } else {
      params.set("cat", categoryName);
    }
    
    startTransition(() => {
      router.push(`/catalog?${params.toString()}`);
    });
  }, [searchParams, router]);

  const toggleInStock = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    const newInStock = !showInStock;
    setShowInStock(newInStock);
    
    if (newInStock) {
      params.set("inStock", "true");
    } else {
      params.delete("inStock");
    }
    
    startTransition(() => {
      router.push(`/catalog?${params.toString()}`);
    });
  }, [searchParams, router, showInStock]);

  const clearAll = () => {
    setQuery("");
    setShowInStock(false);
    startTransition(() => {
      router.push("/catalog");
    });
  };

  const hasActiveFilters = query || currentCategory || showInStock;
  const activeFilterCount = (query ? 1 : 0) + (currentCategory ? 1 : 0) + (showInStock ? 1 : 0);

  return (
    <div>
      {/* Sidebar for large screens */}
      <div className="hidden lg:block w-64 space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar productos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Categorías</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={currentCategory === category.name ? "default" : "outline"}
                onClick={() => toggleCategory(category.name)}
                className={cn(
                  "cursor-pointer transition-all hover:scale-105",
                  currentCategory === category.name 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {currentCategory === category.name && <Check className="h-3 w-3 mr-1" />}
                {category.name}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Disponibilidad</h3>
          <Button
            variant={showInStock ? "default" : "outline"}
            onClick={toggleInStock}
            className={cn(
              "w-full justify-start gap-2",
              showInStock && "bg-primary text-primary-foreground"
            )}
          >
            <div className={cn(
              "w-4 h-4 border rounded flex items-center justify-center",
              showInStock ? "bg-white border-white" : "border-muted-foreground"
            )}>
              {showInStock && <Check className="h-3 w-3 text-primary" />}
            </div>
            Ver solo productos con Stock
          </Button>
        </div>

        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            onClick={clearAll} 
            disabled={isPending}
            className="w-full text-muted-foreground hover:text-destructive"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <X className="h-4 w-4 mr-2" />
            )}
            Limpiar filtros
          </Button>
        )}

        {hasActiveFilters && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Filtros activos:</p>
            <div className="flex flex-wrap gap-1">
              {query && (
                <Badge variant="secondary" className="text-xs">
                  Búsqueda: {query}
                </Badge>
              )}
              {currentCategory && (
                <Badge variant="secondary" className="text-xs">
                  Categoría: {currentCategory}
                </Badge>
              )}
              {showInStock && (
                <Badge variant="secondary" className="text-xs">
                  Solo Stock
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Filters */}
      <div className="lg:hidden">
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline" className="w-full mb-4">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {hasActiveFilters && (
                <span className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </DrawerTrigger>
          <DrawerContent className="w-[300px] sm:w-[350px]">
            <div className="space-y-6 py-4 mx-4">
              <h2 className="text-lg font-semibold">Filtros</h2>
              
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Buscar</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar productos..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Categorías</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Badge
                      key={category.id}
                      variant={currentCategory === category.name ? "default" : "outline"}
                      onClick={() => toggleCategory(category.name)}
                      className={cn(
                        "cursor-pointer transition-all",
                        currentCategory === category.name 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-secondary text-secondary-foreground"
                      )}
                    >
                      {currentCategory === category.name && <Check className="h-3 w-3 mr-1" />}
                      {category.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Disponibilidad</h3>
                <Button
                  variant={showInStock ? "default" : "outline"}
                  onClick={toggleInStock}
                  className={cn(
                    "w-full justify-start gap-2",
                    showInStock && "bg-primary text-primary-foreground"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 border rounded flex items-center justify-center",
                    showInStock ? "bg-white border-white" : "border-muted-foreground"
                  )}>
                    {showInStock && <Check className="h-3 w-3 text-primary" />}
                  </div>
                  Solo productos con stock
                </Button>
              </div>

              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  onClick={clearAll} 
                  disabled={isPending}
                  className="w-full text-muted-foreground hover:text-destructive"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <X className="h-4 w-4 mr-2" />
                  )}
                  Limpiar filtros
                </Button>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}