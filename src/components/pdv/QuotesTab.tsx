import { useState } from "react";
import { Quote } from "@/types/pdv";
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
  CreditCard, 
  XCircle,
  CheckCircle,
  FileText
} from "lucide-react";
import { motion } from "framer-motion";

interface QuotesTabProps {
  quotes: Quote[];
  onViewQuote: (quote: Quote) => void;
  onConvertToSale: (quote: Quote) => void;
  onUpdateStatus: (quoteId: string, status: Quote['status']) => void;
}

const statusConfig = {
  pending: { label: "Pendente", variant: "warning" as const },
  approved: { label: "Aprovado", variant: "success" as const },
  rejected: { label: "Rejeitado", variant: "destructive" as const },
  converted: { label: "Convertido", variant: "default" as const },
};

export const QuotesTab = ({
  quotes,
  onViewQuote,
  onConvertToSale,
  onUpdateStatus,
}: QuotesTabProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredQuotes = quotes.filter(
    (quote) =>
      quote.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: quotes.length,
    pending: quotes.filter((q) => q.status === "pending").length,
    approved: quotes.filter((q) => q.status === "approved").length,
    converted: quotes.filter((q) => q.status === "converted").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <FileText className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <FileText className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-xs text-muted-foreground">Aprovados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.converted}</p>
                <p className="text-xs text-muted-foreground">Convertidos</p>
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
                  <TableHead>Nº Orçamento</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum orçamento encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotes.map((quote) => {
                    const status = statusConfig[quote.status];
                    const isExpired = new Date(quote.validUntil) < new Date() && quote.status === "pending";

                    return (
                      <TableRow key={quote.id}>
                        <TableCell className="font-medium">{quote.number}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{quote.customer}</p>
                            {quote.customerPhone && (
                              <p className="text-xs text-muted-foreground">{quote.customerPhone}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{quote.items.length}</TableCell>
                        <TableCell className="font-semibold">
                          {quote.total.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </TableCell>
                        <TableCell>
                          <span className={isExpired ? "text-destructive" : ""}>
                            {new Date(quote.validUntil).toLocaleDateString("pt-BR")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={isExpired ? "destructive" : status.variant}>
                            {isExpired ? "Expirado" : status.label}
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
                              <DropdownMenuItem onClick={() => onViewQuote(quote)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar
                              </DropdownMenuItem>
                              {quote.status === "pending" && (
                                <>
                                  <DropdownMenuItem onClick={() => onUpdateStatus(quote.id, "approved")}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Aprovar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onUpdateStatus(quote.id, "rejected")}>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Rejeitar
                                  </DropdownMenuItem>
                                </>
                              )}
                              {(quote.status === "pending" || quote.status === "approved") && (
                                <DropdownMenuItem onClick={() => onConvertToSale(quote)}>
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Converter em Venda
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
