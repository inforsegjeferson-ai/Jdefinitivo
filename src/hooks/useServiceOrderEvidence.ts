import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

interface EvidenceItem {
  type: 'photo' | 'signature';
  dataUrl: string;
  latitude?: number;
  longitude?: number;
  capturedAt: Date;
}

interface Evidence {
  id: string;
  service_order_id: string;
  type: string;
  data_url: string;
  latitude: number | null;
  longitude: number | null;
  captured_at: string;
  captured_by: string;
  notes: string | null;
  created_at: string;
}

export const useServiceOrderEvidence = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const saveEvidence = async (
    serviceOrderId: string,
    evidence: EvidenceItem[],
    notes?: string
  ): Promise<boolean> => {
    if (!user) {
      toast.error('Você precisa estar autenticado');
      return false;
    }

    setLoading(true);
    try {
      const evidenceData = evidence.map(item => ({
        service_order_id: serviceOrderId,
        type: item.type,
        data_url: item.dataUrl,
        latitude: item.latitude,
        longitude: item.longitude,
        captured_at: item.capturedAt.toISOString(),
        captured_by: user.id,
        notes: item.type === 'signature' ? notes : null,
      }));

      const { error } = await supabase
        .from('service_order_evidence')
        .insert(evidenceData);

      if (error) {
        console.error('Error saving evidence:', error);
        toast.error('Erro ao salvar evidências');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error saving evidence:', error);
      toast.error('Erro ao salvar evidências');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getEvidence = async (serviceOrderId: string): Promise<Evidence[]> => {
    const { data, error } = await supabase
      .from('service_order_evidence')
      .select('*')
      .eq('service_order_id', serviceOrderId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching evidence:', error);
      return [];
    }

    return data || [];
  };

  return {
    saveEvidence,
    getEvidence,
    loading,
  };
};
