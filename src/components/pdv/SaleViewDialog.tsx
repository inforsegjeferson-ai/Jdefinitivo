import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sale } from "@/types/pdv";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { toast } from 'sonner';
import SalePdfTemplateEditor, { PdfTemplate } from './SalePdfTemplateEditor';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale?: Sale | null;
}

export const SaleViewDialog = ({ open, onOpenChange, sale }: Props) => {
  if (!sale) return null;

  const items = sale.items ?? sale.items_json ?? [];
  const [template, setTemplate] = useState<PdfTemplate | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
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
            return;
          }
        }
        // fallback to localStorage
        try {
          const raw = localStorage.getItem('sale_pdf_template');
          if (raw && mounted) setTemplate(JSON.parse(raw));
        } catch (e) {
          if (mounted) setTemplate(null);
        }
      } catch (err) {
        console.error('load template', err);
      }
    };
    if (open) load();
    return () => { mounted = false; };
  }, [open, editorOpen, user]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sale_pdf_template');
      if (raw) setTemplate(JSON.parse(raw));
      else setTemplate(null);
    } catch (e) {
      setTemplate(null);
    }
  }, [editorOpen, open]);

  const computeLineTotal = (it: any) => {
    const price = Number(it.price || it.unit_price || 0);
    const qty = Number(it.quantity || 0);
    const discountPct = Number(it.discount || it.discount_pct || 0);
    const line = price * qty;
    const discount = (line * discountPct) / 100;
    return { price, qty, discountPct, line, total: line - discount };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Venda {sale.number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Cliente</p>
            <p className="font-medium">{sale.customer ?? sale.customer_name}</p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="hidden sm:table-cell">Código</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(items as any[]).map((it, idx) => {
                const { price, qty, discountPct, total } = computeLineTotal(it);
                const name = it.product?.name ?? it.product_name ?? it.name ?? it.product?.title ?? 'Produto';
                const code = it.product?.sku ?? it.product_code ?? it.product?.code ?? it.sku ?? '';
                return (
                  <TableRow key={idx}>
                    <TableCell>
                      <div className="font-medium">{name}</div>
                      {it.product?.description || it.description ? (
                        <div className="text-xs text-muted-foreground">{it.product?.description ?? it.description}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{code}</TableCell>
                    <TableCell>{qty}</TableCell>
                    <TableCell>{price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                    <TableCell>{discountPct ? `${discountPct}%` : '-'}</TableCell>
                    <TableCell>{total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="flex justify-end">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="text-lg font-bold">{(Number(sale.total) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
              <div className="text-xs text-muted-foreground">{format(new Date(sale.createdAt ?? sale.created_at), 'Pp')}</div>
            </div>
          </div>
        </div>

          <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button variant="outline" onClick={() => setEditorOpen(true)}>Editar Template</Button>
          <Button variant="solar" onClick={() => {
            // Export printable HTML and trigger print (user can save as PDF)
            try {
              const win = window.open('', '_blank');
              if (!win) { toast.error('Não foi possível abrir a janela de impressão'); return; }

              const tpl = template ?? {
                companyName: 'Minha Empresa',
                companyAddress: '',
                logoUrl: '',
                customCss: `body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; }
                .invoice-header { display:flex; justify-content:space-between; align-items:center; }
                .invoice-logo { max-height:60px }
                table { width:100%; border-collapse: collapse; margin-top: 12px; }
                th,td { border:1px solid #ddd; padding:8px; }
                th { background:#f3f4f6 }`,
              } as PdfTemplate;
              const styles = `
                <style>${tpl.customCss}</style>
              `;

              const itemsHtml = (items as any[]).map(it => {
                const name = it.product?.name ?? it.product_name ?? it.name ?? 'Produto';
                const code = it.product?.sku ?? it.product_code ?? it.sku ?? '';
                const qty = Number(it.quantity || 0);
                const price = Number(it.price || it.unit_price || 0);
                const discountPct = Number(it.discount || it.discount_pct || 0);
                const line = price * qty;
                const total = line - (line * discountPct) / 100;
                return `
                  <tr>
                    <td>
                      <div><strong>${name}</strong></div>
                      <div style="font-size:12px;color:#666">${it.product?.description ?? it.description ?? ''}</div>
                    </td>
                    <td>${code}</td>
                    <td class="right">${qty}</td>
                    <td class="right">${price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td class="right">${discountPct ? discountPct + '%' : '-'}</td>
                    <td class="right">${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  </tr>
                `;
              }).join('');

              const html = `<!doctype html><html><head><meta charset="utf-8"><title>Venda ${sale.number}</title>${styles}</head><body>
                <div class="invoice-header">
                  <div>
                    <h2>${tpl.companyName}</h2>
                    <div style="font-size:12px;color:#666">${tpl.companyAddress}</div>
                  </div>
                  <div>${tpl.logoUrl ? `<img src="${tpl.logoUrl}" class="invoice-logo"/>` : ''}</div>
                </div>
                <hr />
                <h3>Venda ${sale.number}</h3>
                <div><strong>Cliente:</strong> ${sale.customer ?? sale.customer_name ?? ''}</div>
                <div><strong>Data:</strong> ${format(new Date(sale.createdAt ?? sale.created_at), 'Pp')}</div>
                <table>
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Código</th>
                      <th>Qtd</th>
                      <th>Preço</th>
                      <th>Desconto</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>
                <div style="margin-top:16px;text-align:right;">
                  <div><strong>Total:</strong> ${(Number(sale.total) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                  ${sale.notes ? `<div style="margin-top:8px"><strong>Observações:</strong> ${sale.notes}</div>` : ''}
                </div>
              </body></html>`;

              win.document.write(html);
              win.document.close();
              win.focus();
              // give browser a moment to render before print
              setTimeout(() => { win.print(); }, 300);
            } catch (err) {
              console.error(err);
              toast.error('Erro ao gerar PDF');
            }
          }}>Exportar PDF</Button>
          <SalePdfTemplateEditor open={editorOpen} onOpenChange={setEditorOpen} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaleViewDialog;
