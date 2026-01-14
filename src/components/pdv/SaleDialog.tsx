import { useState, useEffect } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  CreditCard, 
  User, 
  Banknote, 
  Smartphone, 
  FileBarChart,
  MessageSquare,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { useDbClients } from "@/hooks/useDbClients";

interface SaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  onConfirm: (data: {
    customer: string;
    customerPhone?: string;
    customerAddress?: string;
    paymentMethod: 'cash' | 'credit' | 'debit' | 'pix' | 'boleto';
    installments?: number;
    notes: string;
    generateServiceOrder?: boolean;
    clientId?: string;
  }) => void;
}

const paymentMethods = [
  { value: "pix", label: "PIX", icon: Smartphone },
  { value: "cash", label: "Dinheiro", icon: Banknote },
  { value: "debit", label: "Débito", icon: CreditCard },
  { value: "credit", label: "Crédito", icon: CreditCard },
  { value: "boleto", label: "Boleto", icon: FileBarChart },
];

export const SaleDialog = ({
  open,
  onOpenChange,
  items,
  onConfirm,
}: SaleDialogProps) => {
  const { clients } = useDbClients();
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [customer, setCustomer] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("pix");
  const [installments, setInstallments] = useState<number>(1);
  const [notes, setNotes] = useState("");
  const [generateServiceOrder, setGenerateServiceOrder] = useState(false);

  const subtotal = items.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  const totalDiscount = items.reduce(
    (acc, item) => acc + (item.product.price * item.quantity * item.discount) / 100,
    0
  );

  const total = subtotal - totalDiscount;

  // Load client data when selected
  useEffect(() => {
    if (selectedClientId) {
      const selected = clients.find(c => c.id === selectedClientId);
      if (selected) {
        setCustomer(selected.name);
        setCustomerPhone(selected.phone || "");
        setCustomerAddress(selected.address || "");
      }
    }
  }, [selectedClientId, clients]);

  const handleConfirm = () => {
    if (!customer.trim()) {
      toast.error("Informe o nome do cliente");
      return;
    }

    onConfirm({
      customer: customer.trim(),
      customerPhone: customerPhone.trim() || undefined,
      customerAddress: customerAddress.trim() || undefined,
      paymentMethod: paymentMethod as 'cash' | 'credit' | 'debit' | 'pix' | 'boleto',
      installments: paymentMethod === "credit" ? installments : undefined,
      notes: notes.trim(),
      generateServiceOrder,
      clientId: selectedClientId || undefined,
    });

    // Reset form
    setSelectedClientId("");
    setCustomer("");
    setPaymentMethod("pix");
    setInstallments(1);
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Finalizar Venda
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Itens:</span>
              <span>{items.reduce((acc, item) => acc + item.quantity, 0)}</span>
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
            <div className="flex justify-between text-xl font-bold pt-2 border-t border-primary/20">
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
              <Label htmlFor="client-select">Cliente</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                placeholder="Telefone do cliente"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                placeholder="Endereço do cliente"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Forma de Pagamento
              </Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                className="grid grid-cols-2 gap-2"
              >
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <div key={method.value}>
                      <RadioGroupItem
                        value={method.value}
                        id={method.value}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={method.value}
                        className="flex items-center gap-2 rounded-lg border-2 border-muted bg-muted/30 p-3 cursor-pointer transition-all hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{method.label}</span>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>

            {paymentMethod === "credit" && (
              <div className="space-y-2">
                <Label htmlFor="installments">Parcelas</Label>
                <Select
                  value={installments.toString()}
                  onValueChange={(v) => setInstallments(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}x de{" "}
                        {(total / n).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                        {n === 1 && " (à vista)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Observações
              </Label>
              <Textarea
                id="notes"
                placeholder="Observações da venda..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2 p-2 rounded bg-muted/30 border border-muted">
              <Checkbox
                id="generate-os"
                checked={generateServiceOrder}
                onCheckedChange={(checked) => setGenerateServiceOrder(!!checked)}
              />
              <Label htmlFor="generate-os" className="cursor-pointer text-sm">
                Gerar Ordem de Serviço automaticamente
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="solar" onClick={handleConfirm}>
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Confirmar Venda
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
