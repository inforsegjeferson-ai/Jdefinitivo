import { Product } from "@/types/pdv";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, AlertTriangle } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const isLowStock = product.currentStock < product.minStock;
  const isOutOfStock = product.currentStock === 0;

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <Badge variant="outline" className="text-xs">
            {product.category}
          </Badge>
        </div>

        <div className="mb-3">
          <h3 className="font-semibold text-sm line-clamp-2 mb-1">{product.name}</h3>
          <p className="text-xs text-muted-foreground">{product.code}</p>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-bold text-primary">
            {product.price.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {isLowStock && <AlertTriangle className="h-3 w-3 text-warning" />}
            <span>{product.currentStock} {product.unit}</span>
          </div>
        </div>

        <Button
          variant="solar"
          size="sm"
          className="w-full"
          onClick={() => onAddToCart(product)}
          disabled={isOutOfStock}
        >
          <Plus className="h-4 w-4 mr-1" />
          {isOutOfStock ? "Sem Estoque" : "Adicionar"}
        </Button>
      </CardContent>
    </Card>
  );
};
