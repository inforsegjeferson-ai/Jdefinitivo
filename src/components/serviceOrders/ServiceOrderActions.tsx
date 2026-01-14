import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, CheckCircle, Loader2, Truck, User, Gauge } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ServiceOrderEvidenceCapture } from './ServiceOrderEvidenceCapture';
import { useServiceOrderEvidence } from '@/hooks/useServiceOrderEvidence';
import { ChecklistExecutionDialog } from '@/components/checklists/ChecklistExecutionDialog';
import { ChecklistTemplate, ChecklistExecution } from '@/types/checklist';
import { useDbChecklistTemplates } from '@/hooks/useDbChecklistTemplates';
import { supabase } from '@/integrations/supabase/client';
import { useDbVehicles } from '@/hooks/useDbVehicles';
import { useDbTeam } from '@/hooks/useDbTeam';
import { useDbServiceOrderProducts } from '@/hooks/useDbServiceOrderProducts';

interface EvidenceItem {
  type: 'photo' | 'signature';
  dataUrl: string;
  latitude?: number;
  longitude?: number;
  capturedAt: Date;
}

interface ServiceOrderActionsProps {
  orderId: string;
  status: 'pending' | 'inProgress' | 'completed' | 'cancelled';
  checklistTemplateId?: string;
  onStartOrder: (orderId: string, notes?: string, startData?: StartOrderData) => Promise<boolean>;
  onFinishOrder: (orderId: string, notes?: string) => Promise<boolean>;
}

interface StartOrderData {
  vehicleId: string;
  auxiliaryId?: string;
  mileage: number;
}


export function ServiceOrderActions({
  orderId,
  status,
  checklistTemplateId,
  onStartOrder,
  onFinishOrder,
}: ServiceOrderActionsProps) {
  // Buscar templates reais do banco (hook deve ser chamado aqui)
  const { templates } = useDbChecklistTemplates();
  const { isAdmin, isInstaller, isAuxiliary } = useUserProfile();
  const { saveEvidence } = useServiceOrderEvidence();
  const { useProducts } = useDbServiceOrderProducts();
  const { vehicles } = useDbVehicles();
  const { members } = useDbTeam();
  const [loading, setLoading] = useState(false);
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [checklistDialogOpen, setChecklistDialogOpen] = useState(false);
  const [pendingEvidence, setPendingEvidence] = useState<{ evidence: EvidenceItem[]; notes: string } | null>(null);
  const [notes, setNotes] = useState('');
  
  // Start order form fields
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedAuxiliary, setSelectedAuxiliary] = useState('');
  const [mileage, setMileage] = useState('');
  const [usedProducts, setUsedProducts] = useState([]);

  // Filter available vehicles and auxiliaries
  const availableVehicles = vehicles.filter(v => v.status === 'available' || v.status === 'inUse');
  const availableAuxiliaries = members.filter(m => m.is_active);

  // Permissões: admin e instalador podem iniciar/finalizar, auxiliar não pode
  const canManageOrder = isAdmin() || isInstaller();
  const cannotManage = isAuxiliary() && !isAdmin() && !isInstaller();

  // Get the checklist template if one is assigned
  const checklistTemplate = checklistTemplateId 
    ? templates.find(t => t.id === checklistTemplateId) 
    : null;

  const resetStartForm = () => {
    setNotes('');
    setSelectedVehicle('');
    setSelectedAuxiliary('');
    setMileage('');
  };

  const handleStart = async () => {
    if (!selectedVehicle) {
      return;
    }

    const mileageValue = parseInt(mileage, 10);
    if (isNaN(mileageValue) || mileageValue < 0) {
      return;
    }

    setLoading(true);
    try {
      const startData: StartOrderData = {
        vehicleId: selectedVehicle,
        auxiliaryId: selectedAuxiliary || undefined,
        mileage: mileageValue,
      };

      const success = await onStartOrder(orderId, notes, startData);
      if (success) {
        setStartDialogOpen(false);
        resetStartForm();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEvidenceComplete = async (evidence: EvidenceItem[], finishNotes: string) => {
    // Se tem checklist, salvar evidência e abrir checklist
    if (checklistTemplate) {
      setPendingEvidence({ evidence, notes: finishNotes });
      setEvidenceDialogOpen(false);
      setChecklistDialogOpen(true);
      return;
    }

    // Sem checklist, finalizar direto
    await completeFinish(evidence, finishNotes, null);
  };

  const handleChecklistComplete = async (execution: Omit<ChecklistExecution, 'id'>) => {
    if (!pendingEvidence) return;

    await completeFinish(
      pendingEvidence.evidence, 
      pendingEvidence.notes, 
      execution
    );
    
    setPendingEvidence(null);
    setChecklistDialogOpen(false);
  };

  const completeFinish = async (
    evidence: EvidenceItem[], 
    finishNotes: string, 
    checklistExecution: Omit<ChecklistExecution, 'id'> | null,
    products?: any[]
  ) => {
    // Salvar evidências
    const evidenceSaved = await saveEvidence(orderId, evidence, finishNotes);
    if (!evidenceSaved) {
      return;
    }
    // Salvar produtos usados e dar baixa no estoque
    if (products && products.length > 0) {
      const ok = await useProducts(orderId, products);
      if (!ok) return;
    }
    // Salvar checklist na OS se preenchido
    if (checklistExecution) {
      await supabase
        .from('service_orders')
        .update({
          completed_checklist: checklistExecution as any,
        })
        .eq('id', orderId);
    }

    // Finalizar a OS
    const finished = await onFinishOrder(orderId, finishNotes);
    
    if (finished) {
      setEvidenceDialogOpen(false);
    }
  };

  const isStartFormValid = selectedVehicle && mileage && parseInt(mileage, 10) >= 0;

  if (cannotManage) {
    return null;
  }

  return (
    <>
      <div className="flex gap-2">
        {status === 'pending' && canManageOrder && (
          <Button
            size="sm"
            variant="default"
            onClick={() => setStartDialogOpen(true)}
            className="gap-1.5"
          >
            <Play className="h-3.5 w-3.5" />
            Iniciar
          </Button>
        )}
        
        {status === 'inProgress' && canManageOrder && (
          <Button
            size="sm"
            variant="success"
            onClick={() => setEvidenceDialogOpen(true)}
            className="gap-1.5"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Finalizar
          </Button>
        )}
      </div>

      {/* Dialog para iniciar OS */}
      <Dialog open={startDialogOpen} onOpenChange={(open) => {
        setStartDialogOpen(open);
        if (!open) resetStartForm();
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Iniciar Ordem de Serviço</DialogTitle>
            <DialogDescription>
              Preencha as informações para iniciar esta OS.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Veículo */}
            <div className="space-y-2">
              <Label htmlFor="vehicle" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Veículo *
              </Label>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o veículo" />
                </SelectTrigger>
                <SelectContent>
                  {availableVehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.plate} - {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quilometragem */}
            <div className="space-y-2">
              <Label htmlFor="mileage" className="flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                Quilometragem Atual *
              </Label>
              <Input
                id="mileage"
                type="number"
                min="0"
                placeholder="Ex: 45320"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
              />
            </div>

            {/* Auxiliar */}
            <div className="space-y-2">
              <Label htmlFor="auxiliary" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Auxiliar (opcional)
              </Label>
              <Select value={selectedAuxiliary || undefined} onValueChange={setSelectedAuxiliary}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o auxiliar (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {availableAuxiliaries.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Adicione observações sobre esta ação..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setStartDialogOpen(false);
                resetStartForm();
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleStart} 
              disabled={loading || !isStartFormValid}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Iniciar OS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para finalizar OS com captura de evidências */}
      <ServiceOrderEvidenceCapture
        open={evidenceDialogOpen}
        onOpenChange={setEvidenceDialogOpen}
        onComplete={async (evidence, finishNotes, products) => {
          setUsedProducts(products);
          await completeFinish(evidence, finishNotes, null, products);
        }}
        hasChecklist={!!checklistTemplate}
      />

      {/* Dialog para preencher checklist */}
      {checklistTemplate && (
        <ChecklistExecutionDialog
          template={checklistTemplate}
          open={checklistDialogOpen}
          serviceOrderId={orderId}
          onOpenChange={(open) => {
            setChecklistDialogOpen(open);
            if (!open) {
              setPendingEvidence(null);
            }
          }}
          onComplete={handleChecklistComplete}
        />
      )}
    </>
  );
}
