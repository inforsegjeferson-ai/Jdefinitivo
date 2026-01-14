import { useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChecklistTemplate,
  ChecklistItemTemplate,
} from "@/types/checklist";
import {
  ChecklistTemplateCard,
  ChecklistTemplateDialog,
  ResponseTypeIcon,
  responseTypeLabels,
} from "@/components/checklists";
import { StatCard } from "@/components/dashboard";
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  ClipboardCheck,
  Camera,
  PenTool,
  CheckCircle2,
  Clock,
  Calendar,
  User,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDbChecklistTemplates } from "@/hooks/useDbChecklistTemplates";

// Mock data
const initialTemplates: ChecklistTemplate[] = [
  {
    id: '1',
    name: 'Checklist de Instalação Solar',
    description: 'Verificações obrigatórias para instalação de painéis solares residenciais',
    category: 'Instalação',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    items: [
      { id: 'i1', label: 'Estrutura do telhado está adequada?', responseType: 'yes_no', required: true, order: 0 },
      { id: 'i2', label: 'Foto do local de instalação', responseType: 'photo', required: true, order: 1 },
      { id: 'i3', label: 'Painéis fixados corretamente?', responseType: 'yes_no', required: true, order: 2 },
      { id: 'i4', label: 'Foto dos painéis instalados', responseType: 'photo', required: true, order: 3 },
      { id: 'i5', label: 'Inversor configurado?', responseType: 'yes_no', required: true, order: 4 },
      { id: 'i6', label: 'Assinatura do cliente', responseType: 'signature', required: true, order: 5 },
    ],
  },
  {
    id: '2',
    name: 'Inspeção de Manutenção',
    description: 'Checklist para manutenção preventiva de sistemas fotovoltaicos',
    category: 'Manutenção',
    isActive: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-10'),
    items: [
      { id: 'm1', label: 'Painéis limpos?', responseType: 'yes_no', required: true, order: 0 },
      { id: 'm2', label: 'Conexões elétricas em bom estado?', responseType: 'yes_no', required: true, order: 1 },
      { id: 'm3', label: 'Foto do estado geral', responseType: 'photo', required: true, order: 2 },
      { id: 'm4', label: 'Observações', responseType: 'text', required: false, order: 3 },
    ],
  },
  {
    id: '3',
    name: 'Verificação de Segurança',
    description: 'Checklist de segurança antes de iniciar trabalhos',
    category: 'Segurança',
    isActive: false,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    items: [
      { id: 's1', label: 'EPIs completos?', responseType: 'yes_no', required: true, order: 0 },
      { id: 's2', label: 'Área isolada?', responseType: 'yes_no', required: true, order: 1 },
      { id: 's3', label: 'Tipo de trabalho', responseType: 'select', required: true, order: 2, options: ['Altura', 'Elétrico', 'Solo'] },
    ],
  },
];

const Checklists = () => {
  // toast já foi declarado acima, não declarar novamente
  const { toast } = useToast();
  const { templates, saveTemplate, refetch } = useDbChecklistTemplates();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Dialog states
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);

  // Stats
  const stats = {
    totalTemplates: templates.length,
    activeTemplates: templates.filter(t => t.isActive).length,
  };

  // Filtered data
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && template.isActive) ||
      (statusFilter === 'inactive' && !template.isActive);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Handlers
  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setTemplateDialogOpen(true);
  };

  const handleEditTemplate = (template: ChecklistTemplate) => {
    setSelectedTemplate(template);
    setTemplateDialogOpen(true);
  };

  const handleSaveTemplate = (templateData: Omit<ChecklistTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedTemplate) {
      // Update existing in DB
      saveTemplate(templateData, selectedTemplate.id);
    } else {
      // Create new in DB
      saveTemplate(templateData);
    }
  };

  const handleDeleteTemplate = (id: string) => {
    // Remover template do banco
    import('@/integrations/supabase/client').then(async ({ supabase }) => {
      const { error } = await supabase.from('checklist_templates').delete().eq('id', id);
      if (error) {
        toast({
          title: "Erro ao excluir",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Modelo excluído",
          description: "O modelo de checklist foi excluído.",
          variant: "destructive",
        });
        refetch();
      }
    });
  };

  const handleDuplicateTemplate = (template: ChecklistTemplate) => {
    const duplicate = {
      ...template,
      name: `${template.name} (Cópia)`,
      items: template.items.map(item => ({ ...item, id: `item-${Date.now()}-${item.order}` })),
      isActive: true,
    };
    saveTemplate(duplicate);
    toast({
      title: "Modelo duplicado",
      description: "Uma cópia do modelo foi criada.",
    });
  };

  const categories = [...new Set(templates.map(t => t.category))];

  return (
    <DashboardLayout title="Checklists" subtitle="Modelos dinâmicos de checklist">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <StatCard
          title="Total de Modelos"
          value={stats.totalTemplates}
          icon={ClipboardList}
        />
        <StatCard
          title="Itens com Foto"
          value={templates.reduce((acc, t) => acc + t.items.filter(i => i.responseType === 'photo').length, 0)}
          icon={Camera}
        />
        <StatCard
          title="Itens com Assinatura"
          value={templates.reduce((acc, t) => acc + t.items.filter(i => i.responseType === 'signature').length, 0)}
          icon={PenTool}
        />
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <TabsList>
            <TabsTrigger value="templates" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Modelos
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={handleCreateTemplate} className="gradient-solar gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo Modelo</span>
            </Button>
          </div>
        </div>

        <TabsContent value="templates" className="space-y-6">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Templates Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <ChecklistTemplateCard
                key={template.id}
                template={template}
                onEdit={handleEditTemplate}
                onDelete={handleDeleteTemplate}
                onDuplicate={handleDuplicateTemplate}
              />
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum modelo encontrado</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm ? 'Tente ajustar sua busca' : 'Crie seu primeiro modelo de checklist'}
                </p>
                <Button onClick={handleCreateTemplate} className="gradient-solar gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Modelo
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ChecklistTemplateDialog
        template={selectedTemplate}
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        onSave={handleSaveTemplate}
      />
    </DashboardLayout>
  );
};

export default Checklists;
