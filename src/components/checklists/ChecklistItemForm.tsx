import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChecklistItemTemplate, ResponseType } from "@/types/checklist";
import { ResponseTypeIcon, responseTypeLabels } from "./ResponseTypeIcon";
import { Plus, X } from "lucide-react";

interface ChecklistItemFormProps {
  item?: ChecklistItemTemplate;
  onSave: (item: Omit<ChecklistItemTemplate, 'id' | 'order'>) => void;
  onCancel: () => void;
}

export const ChecklistItemForm = ({ item, onSave, onCancel }: ChecklistItemFormProps) => {
  const [label, setLabel] = useState(item?.label || '');
  const [responseType, setResponseType] = useState<ResponseType>(item?.responseType || 'yes_no');
  const [required, setRequired] = useState(item?.required ?? true);
  const [options, setOptions] = useState<string[]>(item?.options || ['']);

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = () => {
    onSave({
      label,
      responseType,
      required,
      options: responseType === 'select' ? options.filter(o => o.trim()) : undefined,
    });
  };

  const responseTypes: ResponseType[] = ['yes_no', 'photo', 'signature', 'text', 'number', 'select'];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="label">Pergunta/Item</Label>
        <Input
          id="label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Ex: O equipamento está instalado corretamente?"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="responseType">Tipo de Resposta</Label>
        <Select value={responseType} onValueChange={(v) => setResponseType(v as ResponseType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {responseTypes.map((type) => (
              <SelectItem key={type} value={type}>
                <div className="flex items-center gap-2">
                  <ResponseTypeIcon type={type} />
                  <span>{responseTypeLabels[type]}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {responseType === 'select' && (
        <div className="space-y-2">
          <Label>Opções de Seleção</Label>
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Opção ${index + 1}`}
                />
                {options.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveOption(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddOption}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Opção
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Label htmlFor="required">Obrigatório</Label>
        <Switch
          id="required"
          checked={required}
          onCheckedChange={setRequired}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="button" onClick={handleSubmit} className="flex-1 gradient-solar">
          {item ? 'Atualizar' : 'Adicionar'} Item
        </Button>
      </div>
    </div>
  );
};
