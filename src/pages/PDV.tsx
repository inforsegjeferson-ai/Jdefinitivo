import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ProductCard, 
  CartPanel, 
  QuoteDialog, 
  SaleDialog,
  QuotesTab,
  SalesTab,
  ProductsTab
} from "@/components/pdv";
import { SaleViewDialog } from "@/components/pdv";
import { Product, CartItem, Quote, Sale } from "@/types/pdv";
// categories are derived from DB products at runtime
import { useDbProducts } from "@/hooks/useDbProducts";
import { useDbSales } from "@/hooks/useDbSales";
import { useDbCategories } from "@/hooks/useDbCategories";
import { useDbServiceOrders } from "@/hooks/useDbServiceOrders";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { 
  ShoppingCart, 
  FileText, 
  CreditCard, 
  Package, 
  Search,
  Grid3X3,
  List,
  Tags,
  Plus,
  Pencil,
  Trash2
} from "lucide-react";

const PDV = () => {
  const [activeTab, setActiveTab] = useState("pos");
  const { products: dbProducts, loading: productsLoading, addProduct: dbAddProduct, updateProduct: dbUpdateProduct, deleteProduct: dbDeleteProduct, refetch: refetchProducts } = useDbProducts();
  const products: Product[] = useMemo(() => dbProducts.map((p: any) => ({
    id: p.id,
    name: p.name,
    code: p.sku || (p.code ?? ""),
    category: p.category || "",
    price: p.price || 0,
    currentStock: (p.stock_quantity ?? p.currentStock ?? 0) as number,
    minStock: (p.minStock ?? 0) as number,
    unit: (p.unit ?? "un") as string,
    description: p.description ?? "",
    lastMovement: p.updated_at || p.created_at || new Date().toISOString(),
  })), [dbProducts]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const { sales: persistedSales, createSale, cancelSale: dbCancelSale, fetchSales } = useDbSales();
  const { addOrder } = useDbServiceOrders();
  const [viewSale, setViewSale] = useState<Sale | null>(null);
  const [viewSaleOpen, setViewSaleOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { categories, loading: categoriesLoading, addCategory, updateCategory, deleteCategory: dbDeleteCategory } = useDbCategories();
  const [categoriesDialogOpen, setCategoriesDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "Todos" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Cart functions
  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.currentStock) {
        toast.error("Quantidade máxima em estoque atingida");
        return;
      }
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      setCart([...cart, { product, quantity: 1, discount: 0 }]);
    }
    toast.success(`${product.name} adicionado ao carrinho`);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCart(
      cart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const updateDiscount = (productId: string, discount: number) => {
    setCart(
      cart.map((item) =>
        item.product.id === productId ? { ...item, discount } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Quote functions
  const generateQuote = (data: {
    customer: string;
    customerPhone: string;
    validDays: number;
    notes: string;
  }) => {
    const subtotal = cart.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0
    );
    const discount = cart.reduce(
      (acc, item) => acc + (item.product.price * item.quantity * item.discount) / 100,
      0
    );

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + data.validDays);

    const newQuote: Quote = {
      id: `Q${Date.now()}`,
      number: `ORC-${String(quotes.length + 1).padStart(4, "0")}`,
      customer: data.customer,
      customerPhone: data.customerPhone,
      items: [...cart],
      subtotal,
      discount,
      total: subtotal - discount,
      status: "pending",
      validUntil: validUntil.toISOString(),
      createdAt: new Date().toISOString(),
      notes: data.notes,
    };

    setQuotes([newQuote, ...quotes]);
    clearCart();
    setQuoteDialogOpen(false);
    toast.success(`Orçamento ${newQuote.number} gerado com sucesso`);
  };

  // Sale functions
  const finalizeSale = async (data: {
    customer: string;
    customerPhone?: string;
    customerAddress?: string;
    paymentMethod: 'cash' | 'credit' | 'debit' | 'pix' | 'boleto';
    installments?: number;
    notes: string;
    generateServiceOrder?: boolean;
    clientId?: string;
  }) => {
    const subtotal = cart.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0
    );
    const discount = cart.reduce(
      (acc, item) => acc + (item.product.price * item.quantity * item.discount) / 100,
      0
    );

    const saleIndex = (persistedSales && persistedSales.length) ? persistedSales.length : 0;
    const newSale: Sale = {
      id: `S${Date.now()}`,
      number: `VND-${String(saleIndex + 1).padStart(4, "0")}`,
      customer: data.customer,
      items: [...cart],
      subtotal,
      discount,
      total: subtotal - discount,
      paymentMethod: data.paymentMethod,
      installments: data.installments,
      status: "completed",
      createdAt: new Date().toISOString(),
      notes: data.notes,
    };

    // Persist sale to DB via RPC which updates stock and records movements
    (async () => {
      const payload = {
        ...newSale,
        customer: data.customer,
        paymentMethod: data.paymentMethod,
        installments: data.installments ?? null,
        items: cart.map(i => ({ 
          product: { 
            id: i.product.id, 
            name: i.product.name,
            sku: i.product.code,
            description: i.product.description 
          }, 
          quantity: i.quantity, 
          price: i.product.price,
          discount: i.discount
        })),
      };

      const result = await createSale(payload as any);
      if (result.success) {
        await refetchProducts();
        await fetchSales();

        // Gerar Ordem de Serviço se marcado
        if (data.generateServiceOrder) {
          await addOrder({
            client_name: data.customer,
            client_address: data.customerAddress || "",
            service_type: "Venda #" + newSale.number,
            status: "pending",
            notes: `Venda realizada. ${data.notes ? data.notes : ""}`
          });
        }
      } else {
        toast.error('Erro ao salvar venda. Verifique o estoque e tente novamente');
      }
    })();
    clearCart();
    setSaleDialogOpen(false);
    toast.success(`Venda ${newSale.number} realizada com sucesso`);
  };

  // Convert quote to sale
  const convertQuoteToSale = (quote: Quote) => {
    // Check stock availability
    const stockIssues = quote.items.filter(
      (item) => {
        const product = products.find((p) => p.id === item.product.id);
        return !product || product.currentStock < item.quantity;
      }
    );

    if (stockIssues.length > 0) {
      toast.error("Estoque insuficiente para alguns produtos");
      return;
    }

    setCart(quote.items);
    setQuotes(
      quotes.map((q) =>
        q.id === quote.id ? { ...q, status: "converted" as const } : q
      )
    );
    setSaleDialogOpen(true);
  };

  // Update quote status
  const updateQuoteStatus = (quoteId: string, status: Quote['status']) => {
    setQuotes(
      quotes.map((q) => (q.id === quoteId ? { ...q, status } : q))
    );
    toast.success(`Status do orçamento atualizado`);
  };

  // Cancel sale
  const cancelSale = (saleId: string) => {
    (async () => {
      const ok = await dbCancelSale(saleId);
      if (ok) {
        await refetchProducts();
        await fetchSales();
      }
    })();
  };

  // Product management
  const addProduct = (productData: Omit<Product, 'id' | 'lastMovement'>) => {
    dbAddProduct({
      name: productData.name,
      sku: productData.code,
      category: productData.category,
      price: productData.price,
      stock_quantity: productData.currentStock,
      description: productData.description,
    });
  };

  const editProduct = (id: string, productData: Partial<Product>) => {
    dbUpdateProduct(id, {
      name: productData.name,
      sku: productData.code,
      category: productData.category,
      price: productData.price,
      stock_quantity: productData.currentStock,
      description: productData.description,
    });
  };

  const deleteProduct = (id: string) => {
    dbDeleteProduct(id);
  };

  // Category management
  // categories are fetched via `useDbCategories`

  const handleOpenEditCategory = (category: string) => {
    setEditingCategory(category);
    setCategoryName(category);
    setCategoriesDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    const trimmed = categoryName.trim();
    if (!trimmed) {
      toast.error("O nome da categoria é obrigatório");
      return;
    }

    if (editingCategory) {
      if (editingCategory === trimmed) {
        toast.info("Nenhuma alteração detectada");
        setEditingCategory(null);
        setCategoryName("");
        return;
      }

      // Check for duplicate in DB categories
      if (categories.some((c) => c === trimmed && c !== editingCategory)) {
        toast.error("Já existe uma categoria com esse nome");
        return;
      }

      const ok = await updateCategory(editingCategory, trimmed);
      if (!ok) return;

      // Update products that used the old category
      const toUpdate = products.filter((p) => p.category === editingCategory);
      for (const p of toUpdate) {
        await dbUpdateProduct(p.id, { category: trimmed });
      }
      await refetchProducts();
      setEditingCategory(null);
      setCategoryName("");
      return;
    }

    // Create new category locally
    if (categories.some((c) => c === trimmed)) {
      toast.error("Já existe uma categoria com esse nome");
      return;
    }

    const ok = await addCategory(trimmed);
    if (!ok) return;
    setCategoryName("");
    setEditingCategory(null);
  };

  const handleDeleteCategory = async (category: string) => {
    const productsUsingCategory = products.filter(p => p.category === category);
    if (productsUsingCategory.length > 0) {
      toast.error(`Não é possível excluir a categoria. Existem ${productsUsingCategory.length} produto(s) usando esta categoria.`);
      return;
    }
    if (confirm(`Deseja realmente excluir a categoria "${category}"?`)) {
      const ok = await dbDeleteCategory(category);
      if (!ok) return;
    }
  };

  return (
    <DashboardLayout title="PDV" subtitle="Ponto de venda, orçamentos e vendas">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="pos" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Vender</span>
          </TabsTrigger>
          <TabsTrigger value="quotes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Orçamentos</span>
            {quotes.filter((q) => q.status === "pending").length > 0 && (
              <Badge variant="warning" className="ml-1 h-5 w-5 p-0 justify-center">
                {quotes.filter((q) => q.status === "pending").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Vendas</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Produtos</span>
          </TabsTrigger>
        </TabsList>

        {/* POS Tab */}
        <TabsContent value="pos" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Products Section */}
            <div className="lg:col-span-2 space-y-4">
              {/* Search and Filters */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produto..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>

              {/* Categories */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-wrap gap-2"
              >
                {categories.map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
                <Button variant="outline" size="sm" onClick={() => setCategoriesDialogOpen(true)}>
                  <Tags className="h-4 w-4 mr-2" />
                  Categorias
                </Button>
              </motion.div>

              {/* Products Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 sm:grid-cols-3 gap-4"
                    : "space-y-2"
                }
              >
                {filteredProducts.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum produto encontrado</p>
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={addToCart}
                    />
                  ))
                )}
              </motion.div>
            </div>

            {/* Cart Section */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="sticky top-24"
              >
                <CartPanel
                  items={cart}
                  onUpdateQuantity={updateQuantity}
                  onRemoveItem={removeFromCart}
                  onUpdateDiscount={updateDiscount}
                  onClearCart={clearCart}
                  onGenerateQuote={() => setQuoteDialogOpen(true)}
                  onFinalizeSale={() => setSaleDialogOpen(true)}
                />
              </motion.div>
            </div>
          </div>
        </TabsContent>

        {/* Quotes Tab */}
        <TabsContent value="quotes" className="mt-6">
          <QuotesTab
            quotes={quotes}
            onViewQuote={(quote) => console.log("View quote:", quote)}
            onConvertToSale={convertQuoteToSale}
            onUpdateStatus={updateQuoteStatus}
          />
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="mt-6">
          <SalesTab
            sales={persistedSales as any}
            onViewSale={(sale) => { setViewSale(sale); setViewSaleOpen(true); }}
            onCancelSale={cancelSale}
          />
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="mt-6">
          <ProductsTab
            products={products}
            categories={categories}
            onAddProduct={addProduct}
            onEditProduct={editProduct}
            onDeleteProduct={deleteProduct}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <QuoteDialog
        open={quoteDialogOpen}
        onOpenChange={setQuoteDialogOpen}
        items={cart}
        onConfirm={generateQuote}
      />

      <SaleDialog
        open={saleDialogOpen}
        onOpenChange={setSaleDialogOpen}
        items={cart}
        onConfirm={finalizeSale}
      />

      <SaleViewDialog open={viewSaleOpen} onOpenChange={setViewSaleOpen} sale={viewSale} />

      <Dialog open={categoriesDialogOpen} onOpenChange={setCategoriesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Editar Categoria" : "Gerenciar Categorias"}
            </DialogTitle>
          </DialogHeader>

          {editingCategory !== null ? (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="categoryName">Nome da Categoria *</Label>
                <Input
                  id="categoryName"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Nome da categoria"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSaveCategory();
                    }
                  }}
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setEditingCategory(null); setCategoryName(""); }}>
                  Cancelar
                </Button>
                <Button variant="solar" onClick={() => handleSaveCategory()}>
                  {editingCategory ? "Salvar" : "Criar"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="grid gap-4 py-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {categories.length} categoria{categories.length !== 1 ? "s" : ""} cadastrada{categories.length !== 1 ? "s" : ""}
                </p>
                <Button variant="solar" size="sm" onClick={() => { setEditingCategory(""); setCategoryName(""); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Categoria
                </Button>
              </div>

              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria cadastrada</p>
                ) : (
                  categories.map((category) => {
                    const productsCount = products.filter((p) => p.category === category).length;
                    return (
                      <div key={category} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Tags className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{category}</p>
                            <p className="text-xs text-muted-foreground">{productsCount} produto{productsCount !== 1 ? "s" : ""}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon-sm" onClick={() => handleOpenEditCategory(category)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => handleDeleteCategory(category)} disabled={productsCount > 0} title={productsCount > 0 ? "Não é possível excluir categoria em uso" : "Excluir categoria"}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCategoriesDialogOpen(false)}>Fechar</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default PDV;
