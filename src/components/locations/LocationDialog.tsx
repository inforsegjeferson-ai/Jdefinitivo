import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import LeafletMapSelector from './LeafletMapSelector';
import type { Location, GPSCoordinates } from '@/types/location';
import { MapPin, Building2, Warehouse } from 'lucide-react';

interface LocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location?: Location | null;
  onSave: (location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  hasMainLocation: boolean;
}

const LocationDialog = React.forwardRef<any, LocationDialogProps>(
  ({
    open,
    onOpenChange,
    location,
    onSave,
    hasMainLocation,
  }, ref) => {
    const [formData, setFormData] = useState({
      name: '',
      type: 'branch' as 'main' | 'branch' | 'warehouse',
      address: '',
      coordinates: { lat: -23.5505, lng: -46.6333 } as GPSCoordinates,
      toleranceRadius: 100,
      isActive: true,
    });

    useEffect(() => {
      if (location) {
        setFormData({
          name: location.name,
          type: location.type,
          address: location.address,
          coordinates: location.coordinates,
          toleranceRadius: location.toleranceRadius,
          isActive: location.isActive,
        });
      } else {
        setFormData({
          name: '',
          type: hasMainLocation ? 'branch' : 'main',
          address: '',
          coordinates: { lat: -23.5505, lng: -46.6333 },
          toleranceRadius: 100,
          isActive: true,
        });
      }
    }, [location, hasMainLocation, open]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
        ...formData,
        id: location?.id,
      });
      onOpenChange(false);
    };

    const getTypeIcon = (type: string) => {
      switch (type) {
        case 'main':
          return <Building2 className="h-4 w-4" />;
        case 'branch':
          return <MapPin className="h-4 w-4" />;
        case 'warehouse':
          return <Warehouse className="h-4 w-4" />;
        default:
          return null;
      }
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent ref={ref as any} className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {location ? 'Editar Local' : 'Adicionar Novo Local'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Local *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Loja Matriz"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Local *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'main' | 'branch' | 'warehouse') =>
                      setFormData({ ...formData, type: value })
                    }
                    disabled={location?.type === 'main'}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(!hasMainLocation || location?.type === 'main') && (
                        <SelectItem value="main">
                          <div className="flex items-center gap-2">
                            {getTypeIcon('main')}
                            Loja Principal
                          </div>
                        </SelectItem>
                      )}
                      <SelectItem value="branch">
                        <div className="flex items-center gap-2">
                          {getTypeIcon('branch')}
                          Filial
                        </div>
                      </SelectItem>
                      <SelectItem value="warehouse">
                        <div className="flex items-center gap-2">
                          {getTypeIcon('warehouse')}
                          Depósito
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço Completo *</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua, número, bairro, cidade..."
                    rows={3}
                    required
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label>Local Ativo</Label>
                    <p className="text-xs text-muted-foreground">
                      Locais inativos não aparecem para seleção
                    </p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                </div>
              </div>

              <div>
                <LeafletMapSelector
                  coordinates={formData.coordinates}
                  toleranceRadius={formData.toleranceRadius}
                  onCoordinatesChange={(coords) =>
                    setFormData({ ...formData, coordinates: coords })
                  }
                  onRadiusChange={(radius) =>
                    setFormData({ ...formData, toleranceRadius: radius })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="gradient-solar">
                {location ? 'Salvar Alterações' : 'Adicionar Local'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }
);

LocationDialog.displayName = 'LocationDialog';

export default LocationDialog;