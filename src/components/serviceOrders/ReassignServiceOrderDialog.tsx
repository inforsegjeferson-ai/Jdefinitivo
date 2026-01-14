import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDbTeam } from '@/hooks/useDbTeam';
import { useDbServiceOrders } from '@/hooks/useDbServiceOrders';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
}

export function ReassignServiceOrderDialog({ open, onOpenChange, orderId }: Props) {
  const { getInstallers, getAuxiliaries } = useDbTeam();
  const { reassignOrder } = useDbServiceOrders();
  const [installers, setInstallers] = useState(() => getInstallers());
  const [auxiliaries, setAuxiliaries] = useState(() => getAuxiliaries());
  const [selectedLead, setSelectedLead] = useState<string | undefined>(undefined);
  const [selectedAux, setSelectedAux] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Update available members and current assignment when dialog opens
  useEffect(() => {
    if (!open) return;
    setInstallers(getInstallers());
    setAuxiliaries(getAuxiliaries());

    (async () => {
      if (!orderId) return;
      const { data, error } = await supabase
        .from('service_orders')
        .select('team_lead_id, auxiliary_id')
        .eq('id', orderId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching order for reassign:', error);
        return;
      }

      setSelectedLead(data?.team_lead_id || undefined);
      setSelectedAux(data?.auxiliary_id || undefined);
    })();
  }, [open, orderId]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const success = await reassignOrder(orderId, selectedLead || null, selectedAux || null, notes || undefined);
      if (success) {
        onOpenChange(false);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao reatribuir');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reatribuir Ordem de Serviço</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="teamLead">Técnico responsável</Label>
            <Select value={selectedLead} onValueChange={(v) => setSelectedLead(v || undefined)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar técnico" />
              </SelectTrigger>
              <SelectContent>
                {installers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="auxiliary">Auxiliar (opcional)</Label>
            <Select value={selectedAux === undefined ? undefined : selectedAux} onValueChange={(v) => setSelectedAux(v === '__none__' ? undefined : v || undefined)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar auxiliar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Nenhum</SelectItem>
                {auxiliaries.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Observações (opcional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anote o motivo da reatribuição, se necessário" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Reatribuir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ReassignServiceOrderDialog;
