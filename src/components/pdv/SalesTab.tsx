import { useState } from "react";
import { Sale } from "@/types/pdv";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  XCircle,
  CreditCard,
  Banknote,
  Smartphone,
  FileBarChart,
  TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";

interface SalesTabProps {
  sales: Sale[];
  onViewSale: (sale: Sale) => void;
  onCancelSale: (saleId: string) => void;
}

const paymentMethodConfig = {
  pix: { label: "PIX", icon: Smartphone },
  cash: { label: "Dinheiro", icon: Banknote },
  debit: { label: "Débito", icon: CreditCard },
  credit: { label: "Crédito", icon: CreditCard },
  boleto: { label: "Boleto", icon: FileBarChart },
};

export const SalesTab = ({
  sales,
  onViewSale,
  onCancelSale,
}: SalesTabProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSales = sales.filter((sale) => {
    const customer = (sale.customer ?? sale.customer_name ?? '') as string;
    const number = (sale.number ?? '') as string;
    return (
      customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      number.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const completedSales = sales.filter((s) => (s.status ?? s.state) === "completed");
  const todaySales = completedSales.filter((s) => {
    const created = s.createdAt ?? s.created_at ?? s.createdAt;
    return new Date(created).toDateString() === new Date().toDateString();
  });

  const stats = {
    total: completedSales.length,
    today: todaySales.length,
    revenue: completedSales.reduce((acc, s) => acc + s.total, 0),
    todayRevenue: todaySales.reduce((acc, s) => acc + s.total, 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Vendas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.today}</p>
                <p className="text-xs text-muted-foreground">Vendas Hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-solar">
                <Banknote className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-lg font-bold">
                  {stats.revenue.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    notation: "compact",
                  })}
                </p>
                <p className="text-xs text-muted-foreground">Faturamento Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Banknote className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-lg font-bold">
                  {stats.todayRevenue.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
                <p className="text-xs text-muted-foreground">Faturamento Hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente ou número..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Venda</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Produtos</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhuma venda encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map((sale) => {
                                    const payment = paymentMethodConfig[sale.paymentMethod ?? sale.payment_method ?? 'pix'];
                    const PaymentIcon = payment.icon;
                                    return (
                      <TableRow key={sale.id}>
                                        <TableCell className="font-medium">{sale.number}</TableCell>
                                        <TableCell>{sale.customer ?? sale.customer_name}</TableCell>
                                        <TableCell>
                                          <div className="flex flex-wrap gap-1">
                                            {(sale.items ?? []).slice(0, 3).map((item: any, idx: number) => {
                                              const name = item.product?.name ?? item.product_name ?? item.name ?? 'Produto';
                                              return (
                                                <span key={idx} className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[150px]" title={name}>
                                                  {name} ({item.quantity})
                                                </span>
                                              );
                                            })}
                                            {(sale.items ?? []).length > 3 && (
                                              <span className="text-xs text-muted-foreground px-2 py-1">+{(sale.items ?? []).length - 3}</span>
                                            )}
                                          </div>
                                        </TableCell>
                                        <TableCell>{(sale.items ?? []).reduce((acc: number, i: any) => acc + (i.quantity || 0), 0)}</TableCell>
                                        <TableCell className="font-semibold">
                                          {(Number(sale.total) || 0).toLocaleString("pt-BR", {
                                            style: "currency",
                                            currency: "BRL",
                                          })}
                                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <PaymentIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{payment.label}</span>
                            {sale.installments && sale.installments > 1 && (
                              <span className="text-xs text-muted-foreground">
                                ({sale.installments}x)
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(sale.createdAt ?? sale.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={(sale.status ?? sale.state) === "completed" ? "success" : "destructive"}
                          >
                            {(sale.status ?? sale.state) === "completed" ? "Concluída" : "Cancelada"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onViewSale(sale)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar
                              </DropdownMenuItem>
                              {sale.status === "completed" && (
                                <DropdownMenuItem
                                  onClick={() => onCancelSale(sale.id)}
                                  className="text-destructive"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancelar Venda
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
