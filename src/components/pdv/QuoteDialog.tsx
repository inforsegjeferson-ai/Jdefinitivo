import { useState } from "react";
import { CartItem } from "@/types/pdv";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, User, Phone, Calendar, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface QuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  onConfirm: (data: {
    customer: string;
    customerPhone: string;
    validDays: number;
    notes: string;
  }) => void;
}

export const QuoteDialog = ({
  open,
  onOpenChange,
  items,
  onConfirm,
}: QuoteDialogProps) => {
  const [customer, setCustomer] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [validDays, setValidDays] = useState(7);
  const [notes, setNotes] = useState("");

  const subtotal = items.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  const totalDiscount = items.reduce(
    (acc, item) => acc + (item.product.price * item.quantity * item.discount) / 100,
    0
  );

  const total = subtotal - totalDiscount;

  const handleConfirm = () => {
    if (!customer.trim()) {
      toast.error("Informe o nome do cliente");
      return;
    }

    onConfirm({
      customer: customer.trim(),
      customerPhone: customerPhone.trim(),
      validDays,
      notes: notes.trim(),
    });

    // Reset form
    setCustomer("");
    setCustomerPhone("");
    setValidDays(7);
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerar Orçamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Itens:</span>
              <span>{items.length}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>
                {subtotal.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-sm text-success mb-1">
                <span>Descontos:</span>
                <span>
                  -{totalDiscount.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold pt-2 border-t border-border">
              <span>Total:</span>
              <span className="text-primary">
                {total.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="customer" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nome do Cliente *
              </Label>
              <Input
                id="customer"
                placeholder="Nome completo do cliente"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefone
              </Label>
              <Input
                id="phone"
                placeholder="(00) 00000-0000"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="validDays" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Validade (dias)
              </Label>
              <Input
                id="validDays"
                type="number"
                min={1}
                max={90}
                value={validDays}
                onChange={(e) => setValidDays(parseInt(e.target.value) || 7)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Observações
              </Label>
              <Textarea
                id="notes"
                placeholder="Observações do orçamento..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="solar" onClick={handleConfirm}>
            <FileText className="h-4 w-4 mr-1" />
            Gerar Orçamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
