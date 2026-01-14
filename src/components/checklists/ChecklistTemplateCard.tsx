import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChecklistTemplate } from "@/types/checklist";
import { ResponseTypeIcon, responseTypeLabels } from "./ResponseTypeIcon";
import { Edit2, Trash2, Copy, Play, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";

interface ChecklistTemplateCardProps {
  template: ChecklistTemplate;
  onEdit: (template: ChecklistTemplate) => void;
  onDelete: (id: string) => void;
  onDuplicate: (template: ChecklistTemplate) => void;
}

export const ChecklistTemplateCard = ({
  template,
  onEdit,
  onDelete,
  onDuplicate,
}: ChecklistTemplateCardProps) => {
  // Count response types
  const responseTypeCounts = template.items.reduce((acc, item) => {
    acc[item.responseType] = (acc[item.responseType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
    >
      <Card className="card-interactive h-full">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-solar">
                <ClipboardList className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{template.name}</h3>
                <p className="text-xs text-muted-foreground">{template.category}</p>
              </div>
            </div>
            <Badge variant={template.isActive ? "success" : "secondary"}>
              {template.isActive ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {template.description}
          </p>

          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {template.items.length} {template.items.length === 1 ? 'item' : 'itens'}
            </Badge>
            {Object.entries(responseTypeCounts).map(([type, count]) => (
              <Badge key={type} variant="secondary" className="text-xs flex items-center gap-1">
                <ResponseTypeIcon type={type as any} className="h-3 w-3" />
                {count}
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExecute(template)}
              className="flex-1"
            >
              <Play className="h-3.5 w-3.5 mr-1" />
              Executar
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(template)}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDuplicate(template)}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(template.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
