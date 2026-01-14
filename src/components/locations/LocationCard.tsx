import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Building2, 
  Warehouse, 
  Edit, 
  Trash2, 
  Navigation,
  Circle
} from 'lucide-react';
import type { Location } from '@/types/location';
import { motion } from 'framer-motion';

interface LocationCardProps {
  location: Location;
  onEdit: (location: Location) => void;
  onDelete: (id: string) => void;
  onViewOnMap: (location: Location) => void;
}

const LocationCard = React.forwardRef<HTMLDivElement, LocationCardProps>(
  ({ location, onEdit, onDelete, onViewOnMap }, ref) => {
  const getTypeIcon = () => {
    switch (location.type) {
      case 'main':
        return <Building2 className="h-5 w-5" />;
      case 'branch':
        return <MapPin className="h-5 w-5" />;
      case 'warehouse':
        return <Warehouse className="h-5 w-5" />;
    }
  };

  const getTypeBadge = () => {
    switch (location.type) {
      case 'main':
        return <Badge className="bg-primary/20 text-primary border-primary/30">Loja Principal</Badge>;
      case 'branch':
        return <Badge variant="secondary">Filial</Badge>;
      case 'warehouse':
        return <Badge variant="outline">Depósito</Badge>;
    }
  };

    return (
      <motion.div
        ref={ref as any}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card className={`hover:shadow-md transition-shadow ${location.type === 'main' ? 'border-primary/30 bg-primary/5' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                location.type === 'main' ? 'gradient-solar text-primary-foreground' : 'bg-secondary'
              }`}>
                {getTypeIcon()}
              </div>
              <div>
                <CardTitle className="text-lg">{location.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {location.address}
                </p>
              </div>
            </div>
            {getTypeBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <span className="text-muted-foreground">Coordenadas</span>
              <p className="font-mono text-xs">
                {location.coordinates.lat.toFixed(6)}, {location.coordinates.lng.toFixed(6)}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Raio de Tolerância</span>
              <div className="flex items-center gap-1.5">
                <Circle className="h-3 w-3 text-primary" />
                <span className="font-medium">{location.toleranceRadius}m</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={location.isActive ? 'default' : 'secondary'} className="text-xs">
              {location.isActive ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>

          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onViewOnMap(location)}
            >
              <Navigation className="h-4 w-4 mr-1" />
              Ver no Mapa
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(location)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            {location.type !== 'main' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(location.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
    );
  }
);

LocationCard.displayName = 'LocationCard';

export default LocationCard;
