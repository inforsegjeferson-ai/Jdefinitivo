import { DashboardLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Package, 
  Search, 
  Plus, 
  MoreHorizontal,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Box,
  Pencil,
  Trash2,
  Tags,
  Settings
} from "lucide-react";
import { motion } from "framer-motion";
import { ProductsTab } from "@/components/pdv";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useDbProducts } from "@/hooks/useDbProducts";
import { useDbCategories } from "@/hooks/useDbCategories";
import { Product, ProductInput } from "@/types/product";

const Estoque = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const { products, loading: productsLoading, addProduct, updateProduct, deleteProduct, refetch } = useDbProducts();
  const { categories, loading: categoriesLoading, addCategory, updateCategory, deleteCategory: dbDeleteCategory } = useDbCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoriesDialogOpen, setCategoriesDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    category: "",
    price: 0,
    currentStock: 0,
    minStock: 0,
    unit: "un",
    description: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      category: "",
      price: 0,
      currentStock: 0,
      minStock: 0,
      unit: "un",
      description: "",
    });
    setEditingProduct(null);
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        code: product.code,
        category: product.category,
        price: product.price,
        currentStock: product.currentStock,
        minStock: product.minStock,
        unit: product.unit,
        description: product.description || "",
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.code || !formData.category) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    if (editingProduct) {
      const updatedProduct: Product = {
        ...editingProduct,
        ...formData,
        lastMovement: new Date().toISOString().split('T')[0],
      };
      updateProduct(editingProduct.id, {
        name: updatedProduct.name,
        sku: updatedProduct.code,
        category: updatedProduct.category,
        price: updatedProduct.price,
        stock_quantity: updatedProduct.currentStock,
        description: updatedProduct.description,
      }).then(() => {
        toast.success("Produto atualizado com sucesso!");
        refetch();
      });
    } else {
      const newProduct: Product = {
        id: String(Date.now()),
        ...formData,
        lastMovement: new Date().toISOString().split('T')[0],
      };
      addProduct({
        name: newProduct.name,
        sku: newProduct.code,
        category: newProduct.category,
        price: newProduct.price,
        stock_quantity: newProduct.currentStock,
        description: newProduct.description,
      }).then(() => {
        toast.success("Produto adicionado com sucesso!");
        refetch();
      });
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = (product: Product) => {
    if (confirm(`Deseja realmente excluir "${product.name}"?`)) {
      deleteProduct(product.id).then(() => {
        toast.success("Produto excluído com sucesso!");
        refetch();
      });
    }
  };

  const handleOpenCategoriesDialog = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoriesDialogOpen(true);
  };

  const handleOpenEditCategory = (category: string) => {
    setEditingCategory(category);
    setCategoryName(category);
    setCategoriesDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      toast.error("O nome da categoria é obrigatório");
      return;
    }

    const trimmedName = categoryName.trim();

    if (editingCategory) {
      if (editingCategory === trimmedName) {
        toast.info("Nenhuma alteração detectada");
        return;
      }

      if (categories.some((c) => c === trimmedName && c !== editingCategory)) {
        toast.error("Já existe uma categoria com esse nome");
        return;
      }

      const ok = await updateCategory(editingCategory, trimmedName);
      if (!ok) return;

      // Atualizar categoria nos produtos (persistido)
      const toUpdate = products.filter((p) => p.category === editingCategory);
      for (const p of toUpdate) {
        await updateProduct(p.id, { category: trimmedName });
      }
      await refetch();

      // Atualizar filtro se necessário
      if (categoryFilter === editingCategory) {
        setCategoryFilter(trimmedName);
      }

      toast.success("Categoria atualizada com sucesso!");
    } else {
      if (categories.some((c) => c === trimmedName)) {
        toast.error("Já existe uma categoria com esse nome");
        return;
      }

      const ok = await addCategory(trimmedName);
      if (!ok) return;

      toast.success("Categoria criada com sucesso!");
    }

    setCategoryName("");
    setEditingCategory(null);
  };

  const handleDeleteCategory = async (category: string) => {
    // Verificar se há produtos usando esta categoria
    const productsUsingCategory = products.filter(p => p.category === category);
    
    if (productsUsingCategory.length > 0) {
      toast.error(
        `Não é possível excluir a categoria. Existem ${productsUsingCategory.length} produto(s) usando esta categoria.`
      );
      return;
    }

    if (confirm(`Deseja realmente excluir a categoria "${category}"?`)) {
      const ok = await dbDeleteCategory(category);
      if (!ok) return;

      // Se estiver filtrado por esta categoria, voltar para "Todos"
      if (categoryFilter === category) {
        setCategoryFilter("Todos");
      }
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "Todos" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: products.length,
    lowStock: products.filter((p) => p.currentStock < p.minStock).length,
    adequate: products.filter((p) => p.currentStock >= p.minStock).length,
  };

  const getStockStatus = (current: number, min: number) => {
    if (current < min) return { label: "Baixo", variant: "destructive" as const, icon: TrendingDown };
    if (current < min * 1.5) return { label: "Atenção", variant: "warning" as const, icon: AlertTriangle };
    return { label: "Adequado", variant: "success" as const, icon: TrendingUp };
  };

  return (
    <DashboardLayout title="Estoque" subtitle="Controle de produtos e materiais">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Produtos Cadastrados</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.lowStock}</p>
                <p className="text-sm text-muted-foreground">Estoque Baixo</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                <Box className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.adequate}</p>
                <p className="text-sm text-muted-foreground">Estoque Adequado</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col md:flex-row gap-4 mb-6"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou código..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            {["Todos", ...categories].map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          onClick={handleOpenCategoriesDialog}
          title="Gerenciar Categorias"
        >
          <Tags className="h-4 w-4 mr-2" />
          Categorias
        </Button>
        <Button variant="solar" onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </motion.div>

      {/* Products UI (reused component) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <ProductsTab
          products={products}
          categories={categories}
          onAddProduct={(p) => addProduct(p as any)}
          onEditProduct={(id, p) => updateProduct(id, {
            name: p.name,
            sku: p.code,
            category: p.category,
            price: p.price,
            stock_quantity: p.currentStock,
            description: p.description,
          })}
          onDeleteProduct={(id) => deleteProduct(id)}
        />
      </motion.div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do produto"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="EX: PS-550M"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit">Unidade</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData({ ...formData, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="un">Unidade</SelectItem>
                    <SelectItem value="par">Par</SelectItem>
                    <SelectItem value="kit">Kit</SelectItem>
                    <SelectItem value="rolo">Rolo</SelectItem>
                    <SelectItem value="m">Metro</SelectItem>
                    <SelectItem value="kg">Kg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="currentStock">Estoque Atual</Label>
                <Input
                  id="currentStock"
                  type="number"
                  value={formData.currentStock}
                  onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="minStock">Estoque Mínimo</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição opcional do produto"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="solar" onClick={handleSubmit}>
              {editingProduct ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Categories Dialog */}
      <Dialog open={categoriesDialogOpen} onOpenChange={setCategoriesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Editar Categoria" : "Gerenciar Categorias"}
            </DialogTitle>
          </DialogHeader>

          {editingCategory !== null ? (
            // Edit/Create mode
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
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryName("");
                  }}
                >
                  Cancelar
                </Button>
                <Button variant="solar" onClick={handleSaveCategory}>
                  {editingCategory ? "Salvar" : "Criar"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            // List mode
            <div className="grid gap-4 py-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {categories.length} categoria{categories.length !== 1 ? "s" : ""} cadastrada{categories.length !== 1 ? "s" : ""}
                </p>
                <Button
                  variant="solar"
                  size="sm"
                  onClick={() => {
                    setEditingCategory("");
                    setCategoryName("");
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Categoria
                </Button>
              </div>

              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma categoria cadastrada
                  </p>
                ) : (
                  categories.map((category) => {
                    const productsCount = products.filter(
                      (p) => p.category === category
                    ).length;
                    return (
                      <div
                        key={category}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Tags className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{category}</p>
                            <p className="text-xs text-muted-foreground">
                              {productsCount} produto{productsCount !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleOpenEditCategory(category)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDeleteCategory(category)}
                            disabled={productsCount > 0}
                            title={
                              productsCount > 0
                                ? "Não é possível excluir categoria em uso"
                                : "Excluir categoria"
                            }
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCategoriesDialogOpen(false)}
                >
                  Fechar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Estoque;
