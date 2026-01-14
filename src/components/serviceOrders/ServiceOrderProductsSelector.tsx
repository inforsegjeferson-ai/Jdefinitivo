import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDbProducts } from '@/hooks/useDbProducts';
import { ServiceOrderProductInput } from '@/hooks/useDbServiceOrderProducts';

interface ServiceOrderProductsSelectorProps {
  value: ServiceOrderProductInput[];
  onChange: (items: ServiceOrderProductInput[]) => void;
}

export function ServiceOrderProductsSelector({ value, onChange }: ServiceOrderProductsSelectorProps) {
  const { products } = useDbProducts();
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleAdd = () => {
    const product = products.find((p: any) => p.id === selectedProductId);
    if (!product || quantity <= 0) return;
    onChange([
      ...value,
      {
        product_id: product.id,
        product_name: product.name,
        quantity,
        unit: (product as any).unit || '',
      },
    ]);
    setSelectedProductId('');
    setQuantity(1);
  };

  const handleRemove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Label>Produto</Label>
          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um produto" />
            </SelectTrigger>
            <SelectContent>
              {products.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-24">
          <Label>Quantidade</Label>
          <Input type="number" min={1} value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
        </div>
        <Button type="button" onClick={handleAdd} disabled={!selectedProductId || quantity <= 0}>
          Adicionar
        </Button>
      </div>
      <div>
        {value.length === 0 ? (
          <span className="text-muted-foreground text-sm">Nenhum produto adicionado</span>
        ) : (
          <ul className="space-y-1">
            {value.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span>{item.product_name} ({item.quantity}{item.unit ? ` ${item.unit}` : ''})</span>
                <Button type="button" size="sm" variant="ghost" onClick={() => handleRemove(idx)}>
                  Remover
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
