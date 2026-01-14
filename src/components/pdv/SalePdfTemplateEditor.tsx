import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const STORAGE_KEY = "sale_pdf_template";

export interface PdfTemplate {
  companyName: string;
  companyAddress: string;
  logoUrl: string;
  customCss: string;
}

const defaultTemplate: PdfTemplate = {
  companyName: "Minha Empresa",
  companyAddress: "Rua Exemplo, 123 - Cidade",
  logoUrl: "",
  customCss: `body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; }
.invoice-header { display:flex; justify-content:space-between; align-items:center; }
.invoice-logo { max-height:60px }
table { width:100%; border-collapse: collapse; margin-top: 12px; }
th,td { border:1px solid #ddd; padding:8px; }
th { background:#f3f4f6 }`,
};

export const SalePdfTemplateEditor = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const { user } = useAuth();
  const [template, setTemplate] = useState<PdfTemplate>(defaultTemplate);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        if (user) {
          const { data, error } = await supabase
            .from('pdf_templates')
            .select('template')
            .eq('user_id', user.id)
            .eq('key', 'sale')
            .single();
          if (!error && data?.template) {
            if (mounted) setTemplate(data.template as PdfTemplate);
            setLoading(false);
            return;
          }
        }
        // fallback to localStorage if present
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw && mounted) setTemplate(JSON.parse(raw));
        } catch (e) {
          if (mounted) setTemplate(defaultTemplate);
        }
      } catch (err) {
        console.error('load template', err);
        toast.error('Erro ao carregar template');
        if (mounted) setTemplate(defaultTemplate);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (open) load();
    return () => { mounted = false; };
  }, [open, user]);

  const save = async () => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }
    setLoading(true);
    try {
      const payload = { user_id: user.id, key: 'sale', template };
      const { error } = await supabase.from('pdf_templates').upsert(payload, { onConflict: '(user_id,key)' });
      if (error) {
        console.error('save template', error);
        toast.error('Erro ao salvar template');
        setLoading(false);
        return;
      }
      // also keep localStorage for backward compatibility
      localStorage.setItem(STORAGE_KEY, JSON.stringify(template));
      toast.success('Template salvo');
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar template');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setTemplate(defaultTemplate);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editor de Template de PDF</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Nome da Empresa</Label>
            <Input value={template.companyName} onChange={(e) => setTemplate({ ...template, companyName: e.target.value })} />
          </div>

          <div className="grid gap-2">
            <Label>Endereço</Label>
            <Input value={template.companyAddress} onChange={(e) => setTemplate({ ...template, companyAddress: e.target.value })} />
          </div>

          <div className="grid gap-2">
            <Label>Logo (URL)</Label>
            <Input value={template.logoUrl} onChange={(e) => setTemplate({ ...template, logoUrl: e.target.value })} placeholder="https://.../logo.png" />
          </div>

          <div className="grid gap-2">
            <Label>CSS customizado</Label>
            <Textarea rows={8} value={template.customCss} onChange={(e) => setTemplate({ ...template, customCss: e.target.value })} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); }}>Reset</Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="solar" onClick={save} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SalePdfTemplateEditor;
