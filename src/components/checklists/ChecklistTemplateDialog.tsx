import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChecklistTemplate, ChecklistItemTemplate } from "@/types/checklist";
import { useDbChecklistTemplates } from "@/hooks/useDbChecklistTemplates";
import { ChecklistItemForm } from "./ChecklistItemForm";
import { ResponseTypeIcon, responseTypeLabels } from "./ResponseTypeIcon";
import { Plus, GripVertical, Edit2, Trash2, ClipboardList } from "lucide-react";

interface ChecklistTemplateDialogProps {
  template: ChecklistTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (template: Omit<ChecklistTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const categories = [
  'Instalação',
  'Manutenção',
  'Inspeção',
  'Segurança',
  'Qualidade',
  'Outro',
];

export const ChecklistTemplateDialog = ({
  template,
  open,
  onOpenChange,
  onSave,
}: ChecklistTemplateDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Instalação');
  const [isActive, setIsActive] = useState(true);
  const [items, setItems] = useState<ChecklistItemTemplate[]>([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItemTemplate | null>(null);
  const { saveTemplate } = useDbChecklistTemplates();

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description);
      setCategory(template.category);
      setIsActive(template.isActive);
      setItems(template.items);
    } else {
      setName('');
      setDescription('');
      setCategory('Instalação');
      setIsActive(true);
      setItems([]);
    }
  }, [template, open]);

  const handleAddItem = (itemData: Omit<ChecklistItemTemplate, 'id' | 'order'>) => {
    const newItem: ChecklistItemTemplate = {
      ...itemData,
      id: `item-${Date.now()}`,
      order: items.length,
    };
    setItems([...items, newItem]);
    setShowItemForm(false);
  };

  const handleUpdateItem = (itemData: Omit<ChecklistItemTemplate, 'id' | 'order'>) => {
    if (!editingItem) return;
    
    setItems(items.map(item => 
      item.id === editingItem.id 
        ? { ...item, ...itemData }
        : item
    ));
    setEditingItem(null);
  };

  const handleDeleteItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= items.length) return;
    
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    newItems.forEach((item, i) => item.order = i);
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const templateData = {
      name,
      description,
      category,
      isActive,
      items,
    };
    if (template && template.id) {
      saveTemplate(templateData, template.id);
    } else {
      saveTemplate(templateData);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-solar">
              <ClipboardList className="h-5 w-5 text-primary-foreground" />
            </div>
            {template ? 'Editar Modelo de Checklist' : 'Novo Modelo de Checklist'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <ScrollArea className="max-h-[65vh] pr-4 overflow-y-scroll">
            <div className="space-y-6 w-full">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Modelo</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Checklist de Instalação Solar"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o propósito deste checklist..."
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isActive">Modelo Ativo</Label>
                  <p className="text-xs text-muted-foreground">
                    Modelos inativos não aparecem para execução
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>

              {/* Items Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Itens do Checklist</Label>
                  <Badge variant="outline">{items.length} itens</Badge>
                </div>

                {showItemForm || editingItem ? (
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <ChecklistItemForm
                      item={editingItem || undefined}
                      onSave={editingItem ? handleUpdateItem : handleAddItem}
                      onCancel={() => {
                        setShowItemForm(false);
                        setEditingItem(null);
                      }}
                    />
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowItemForm(true)}
                    className="w-full border-dashed"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Item
                  </Button>
                )}

                {items.length > 0 && (
                  <div className="space-y-2">
                    {items
                      .sort((a, b) => a.order - b.order)
                      .map((item, index) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveItem(index, 'up')}
                              disabled={index === 0}
                              className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                            >
                              <GripVertical className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveItem(index, 'down')}
                              disabled={index === items.length - 1}
                              className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                            >
                              <GripVertical className="h-3 w-3" />
                            </button>
                          </div>
                          
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                            {index + 1}
                          </span>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.label}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                <ResponseTypeIcon type={item.responseType} className="h-3 w-3" />
                                {responseTypeLabels[item.responseType]}
                              </Badge>
                              {item.required && (
                                <Badge variant="outline" className="text-xs text-destructive border-destructive">
                                  Obrigatório
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setEditingItem(item)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          <div className="flex gap-3 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 gradient-solar" disabled={items.length === 0}>
              {template ? 'Salvar Alterações' : 'Criar Modelo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
