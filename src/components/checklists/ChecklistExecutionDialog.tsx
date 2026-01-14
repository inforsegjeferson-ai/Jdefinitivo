import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ChecklistTemplate, ChecklistItemResponse, ChecklistExecution } from "@/types/checklist";
import { useDbChecklists } from "@/hooks/useDbChecklists";
import { ResponseTypeIcon, responseTypeLabels } from "./ResponseTypeIcon";
import { SignaturePad } from "./SignaturePad";
import { PhotoCapture } from "./PhotoCapture";
import { Check, Camera, PenTool, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChecklistExecutionDialogProps {
  template: ChecklistTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceOrderId?: string;
  onComplete?: (execution: Omit<ChecklistExecution, 'id'>) => void;
}

export const ChecklistExecutionDialog = ({
  template,
  open,
  onOpenChange,
  onComplete,
  serviceOrderId,
}: ChecklistExecutionDialogProps) => {
  const { toast } = useToast();
  const { addExecution } = useDbChecklists(serviceOrderId);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [photoMetadata, setPhotoMetadata] = useState<Record<string, any>>({});
  const [activeCapture, setActiveCapture] = useState<{ itemId: string; type: 'photo' | 'signature' } | null>(null);

  if (!template) return null;

  const handleResponseChange = (itemId: string, value: any) => {
    setResponses(prev => ({ ...prev, [itemId]: value }));
  };

  const handlePhotoSave = (itemId: string, photoUrl: string, metadata: any) => {
    handleResponseChange(itemId, photoUrl);
    setPhotoMetadata(prev => ({ ...prev, [itemId]: metadata }));
    setActiveCapture(null);
  };

  const handleSignatureSave = (itemId: string, signatureUrl: string) => {
    handleResponseChange(itemId, signatureUrl);
    setActiveCapture(null);
  };

  const handleSubmit = () => {
    // Check required fields
    const missingRequired = template.items.filter(
      item => item.required && !responses[item.id]
    );

    if (missingRequired.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: `Preencha todos os campos obrigatórios: ${missingRequired.map(i => i.label).join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    const itemResponses: ChecklistItemResponse[] = template.items.map(item => ({
      itemId: item.id,
      value: responses[item.id] ?? null,
      photoUrl: item.responseType === 'photo' ? responses[item.id] : undefined,
      signatureUrl: item.responseType === 'signature' ? responses[item.id] : undefined,
      timestamp: new Date(),
      gpsLocation: photoMetadata[item.id]?.gps,
    }));

    const executionData = {
      templateId: template.id,
      templateName: template.name,
      serviceOrderId,
      executedBy: 'Usuário Atual',
      responses: itemResponses,
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date(),
    };
    addExecution(executionData);
    if (onComplete) onComplete(executionData);
    // Reset state
    setResponses({});
    setPhotoMetadata({});
    setActiveCapture(null);
    onOpenChange(false);
  };

  const renderItemInput = (item: typeof template.items[0]) => {
    const value = responses[item.id];

    if (activeCapture?.itemId === item.id) {
      if (activeCapture.type === 'photo') {
        return (
          <PhotoCapture
            onSave={(url, metadata) => handlePhotoSave(item.id, url, metadata)}
            onCancel={() => setActiveCapture(null)}
          />
        );
      }
      if (activeCapture.type === 'signature') {
        return (
          <SignaturePad
            onSave={(url) => handleSignatureSave(item.id, url)}
            onCancel={() => setActiveCapture(null)}
          />
        );
      }
    }

    switch (item.responseType) {
      case 'yes_no':
        return (
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant={value === true ? "default" : "outline"}
              size="sm"
              onClick={() => handleResponseChange(item.id, true)}
              className={value === true ? "gradient-solar" : ""}
            >
              <Check className="h-4 w-4 mr-1" />
              Sim
            </Button>
            <Button
              type="button"
              variant={value === false ? "destructive" : "outline"}
              size="sm"
              onClick={() => handleResponseChange(item.id, false)}
            >
              Não
            </Button>
          </div>
        );

      case 'photo':
        return (
          <div>
            {value ? (
              <div className="relative">
                <img src={value} alt="Captured" className="w-full h-32 object-cover rounded-lg" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute bottom-2 right-2"
                  onClick={() => setActiveCapture({ itemId: item.id, type: 'photo' })}
                >
                  Trocar
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveCapture({ itemId: item.id, type: 'photo' })}
                className="w-full"
              >
                <Camera className="h-4 w-4 mr-2" />
                Capturar Foto
              </Button>
            )}
          </div>
        );

      case 'signature':
        return (
          <div>
            {value ? (
              <div className="relative">
                <img src={value} alt="Signature" className="w-full h-24 object-contain bg-white rounded-lg border" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute bottom-2 right-2"
                  onClick={() => setActiveCapture({ itemId: item.id, type: 'signature' })}
                >
                  Refazer
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveCapture({ itemId: item.id, type: 'signature' })}
                className="w-full"
              >
                <PenTool className="h-4 w-4 mr-2" />
                Coletar Assinatura
              </Button>
            )}
          </div>
        );

      case 'text':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleResponseChange(item.id, e.target.value)}
            placeholder="Digite sua resposta..."
            rows={2}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => handleResponseChange(item.id, e.target.value)}
            placeholder="Digite um número..."
          />
        );

      case 'select':
        return (
          <Select value={value || ''} onValueChange={(v) => handleResponseChange(item.id, v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma opção" />
            </SelectTrigger>
            <SelectContent>
              {item.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return null;
    }
  };

  const completedCount = template.items.filter(item => responses[item.id] !== undefined).length;
  const progress = (completedCount / template.items.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-solar">
              <Check className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span>{template.name}</span>
              <p className="text-sm font-normal text-muted-foreground">
                {completedCount} de {template.items.length} itens preenchidos
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full gradient-solar transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <ScrollArea className="max-h-[65vh] pr-4 overflow-y-scroll">
          <div className="space-y-6 w-full">
            {template.items
              .sort((a, b) => a.order - b.order)
              .map((item, index) => (
                <div key={item.id} className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Label className="text-sm font-medium">{item.label}</Label>
                        {item.required && (
                          <Badge variant="outline" className="text-xs text-destructive border-destructive">
                            Obrigatório
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <ResponseTypeIcon type={item.responseType} className="h-3 w-3" />
                          {responseTypeLabels[item.responseType]}
                        </Badge>
                      </div>
                      {renderItemInput(item)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </ScrollArea>

        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="flex-1 gradient-solar">
            <Check className="h-4 w-4 mr-2" />
            Finalizar Checklist
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
