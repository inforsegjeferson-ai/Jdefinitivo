import { CartItem } from "@/types/pdv";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  ShoppingCart, 
  Trash2, 
  Minus, 
  Plus, 
  Percent,
  FileText,
  CreditCard
} from "lucide-react";

interface CartPanelProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onUpdateDiscount: (productId: string, discount: number) => void;
  onClearCart: () => void;
  onGenerateQuote: () => void;
  onFinalizeSale: () => void;
}

export const CartPanel = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateDiscount,
  onClearCart,
  onGenerateQuote,
  onFinalizeSale,
}: CartPanelProps) => {
  const subtotal = items.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  const totalDiscount = items.reduce(
    (acc, item) => acc + (item.product.price * item.quantity * item.discount) / 100,
    0
  );

  const total = subtotal - totalDiscount;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShoppingCart className="h-5 w-5" />
          Carrinho
          {items.length > 0 && (
            <span className="ml-auto text-sm font-normal text-muted-foreground">
              {items.length} {items.length === 1 ? "item" : "itens"}
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 pt-0">
        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
            <div>
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Carrinho vazio</p>
              <p className="text-sm">Adicione produtos para começar</p>
            </div>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-4 px-4">
              <div className="space-y-3">
                {items.map((item) => {
                  const itemTotal = item.product.price * item.quantity;
                  const itemDiscount = (itemTotal * item.discount) / 100;

                  return (
                    <div
                      key={item.product.id}
                      className="p-3 rounded-lg bg-muted/50 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.product.price.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}{" "}
                            / {item.product.unit}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="shrink-0 text-destructive hover:text-destructive"
                          onClick={() => onRemoveItem(item.product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() =>
                              onUpdateQuantity(
                                item.product.id,
                                Math.max(1, item.quantity - 1)
                              )
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              onUpdateQuantity(
                                item.product.id,
                                Math.max(1, parseInt(e.target.value) || 1)
                              )
                            }
                            className="w-14 h-8 text-center text-sm"
                            min={1}
                            max={item.product.currentStock}
                          />
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() =>
                              onUpdateQuantity(
                                item.product.id,
                                Math.min(
                                  item.product.currentStock,
                                  item.quantity + 1
                                )
                              )
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-1 ml-auto">
                          <Percent className="h-3 w-3 text-muted-foreground" />
                          <Input
                            type="number"
                            value={item.discount}
                            onChange={(e) =>
                              onUpdateDiscount(
                                item.product.id,
                                Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))
                              )
                            }
                            className="w-14 h-8 text-center text-sm"
                            min={0}
                            max={100}
                            step={0.5}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <div className="text-right">
                          {item.discount > 0 && (
                            <span className="text-xs text-muted-foreground line-through mr-2">
                              {itemTotal.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </span>
                          )}
                          <span className="font-medium">
                            {(itemTotal - itemDiscount).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <Separator className="my-4" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>
                  {subtotal.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Descontos:</span>
                  <span>
                    -{totalDiscount.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">
                  {total.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={onGenerateQuote}>
                  <FileText className="h-4 w-4 mr-1" />
                  Orçamento
                </Button>
                <Button variant="solar" onClick={onFinalizeSale}>
                  <CreditCard className="h-4 w-4 mr-1" />
                  Vender
                </Button>
              </div>
              <Button
                variant="ghost"
                className="w-full text-destructive hover:text-destructive"
                onClick={onClearCart}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Limpar Carrinho
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
