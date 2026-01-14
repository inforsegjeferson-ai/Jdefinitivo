import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChecklistTemplate } from '@/types/checklist';

export const useDbChecklistTemplates = () => {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('checklist_templates')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Erro ao carregar modelos de checklist');
    } else {
      const mapped = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        category: row.category,
        items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
        createdAt: row.created_at ? new Date(row.created_at) : undefined,
        updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
        isActive: row.is_active,
      }));
      setTemplates(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const saveTemplate = async (template: Omit<ChecklistTemplate, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => {
    let result;
    const dbTemplate: any = {
      name: template.name,
      description: template.description,
      category: template.category,
         items: template.items,
      is_active: template.isActive,
      updated_at: new Date().toISOString(),
    };
    if (id) {
      // Remove campos undefined e created_at do update
      const updateObj = { ...dbTemplate };
      delete updateObj.created_at;
      Object.keys(updateObj).forEach(key => updateObj[key] === undefined && delete updateObj[key]);
      console.log('ChecklistTemplate update payload:', updateObj); // <-- LOG DO PAYLOAD
      result = await supabase
        .from('checklist_templates')
        .update(updateObj)
        .eq('id', id)
        .select()
        .single();
    } else {
      const templateToInsert = Object.assign({}, dbTemplate, { created_at: new Date().toISOString() });
      result = await supabase
        .from('checklist_templates')
        .insert([templateToInsert])
        .select()
        .single();
    }
    const { data, error } = result;
    if (error) {
      toast.error('Erro ao salvar modelo de checklist');
      return null;
    }
    fetchTemplates();
    toast.success('Modelo de checklist salvo!');
    return data;
  };

  return {
    templates,
    loading,
    saveTemplate,
    refetch: fetchTemplates,
  };
};
