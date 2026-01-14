import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Client, ClientInput, useDbClients } from '@/hooks/useDbClients';

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  editingClient?: Client | null;
  onSave?: (client: ClientInput) => Promise<boolean | Client | null>;
}

export function ClientDialog({ open, onOpenChange, client, editingClient, onSave }: ClientDialogProps) {
  const { addClient, updateClient } = useDbClients();
  const activeClient = client || editingClient;
  
  const [formData, setFormData] = useState<ClientInput>({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    notes: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeClient) {
      setFormData({
        name: activeClient.name,
        phone: activeClient.phone || '',
        email: activeClient.email || '',
        address: activeClient.address,
        city: activeClient.city,
        state: activeClient.state || '',
        zip_code: activeClient.zip_code || '',
        notes: activeClient.notes || '',
        is_active: activeClient.is_active,
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        notes: '',
        is_active: true,
      });
    }
  }, [activeClient, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.address || !formData.city) {
      return;
    }

    setSaving(true);
    
    let result: boolean | Client | null = false;
    
    if (onSave) {
      result = await onSave(formData);
    } else if (activeClient) {
      result = await updateClient(activeClient.id, formData);
    } else {
      result = await addClient(formData);
    }
    
    setSaving(false);

    if (result) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{activeClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do cliente"
                required
              />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="col-span-2">
              <Label>Endereço *</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Rua, número, bairro"
                rows={2}
                required
              />
            </div>
            <div>
              <Label>Cidade *</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Cidade"
                required
              />
            </div>
            <div>
              <Label>Estado</Label>
              <Input
                value={formData.state || ''}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="UF"
                maxLength={2}
              />
            </div>
            <div>
              <Label>CEP</Label>
              <Input
                value={formData.zip_code || ''}
                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                placeholder="00000-000"
              />
            </div>
            {activeClient && (
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Cliente ativo</Label>
              </div>
            )}
            <div className="col-span-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações sobre o cliente"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : activeClient ? 'Salvar Alterações' : 'Criar Cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}