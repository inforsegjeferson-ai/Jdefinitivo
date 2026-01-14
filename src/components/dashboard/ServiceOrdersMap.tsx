import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin } from 'lucide-react';
import { ServiceOrder } from './ServiceOrderCard';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface ServiceOrdersMapProps {
  orders: ServiceOrder[];
  height?: string;
}

interface OrderMarker {
  order: ServiceOrder;
  lat: number;
  lng: number;
  marker: L.Marker;
}

const statusColors: Record<ServiceOrder['status'], string> = {
  pending: '#f59e0b', // amber/orange
  inProgress: '#3b82f6', // blue
  completed: '#10b981', // green
  cancelled: '#ef4444', // red
};

const statusLabels: Record<ServiceOrder['status'], string> = {
  pending: 'Pendente',
  inProgress: 'Em Andamento',
  completed: 'Concluída',
  cancelled: 'Cancelada',
};

export function ServiceOrdersMap({ orders, height = '400px' }: ServiceOrdersMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<OrderMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [geocodedCount, setGeocodedCount] = useState(0);

  // Geocodificar endereço usando Nominatim (OpenStreetMap)
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'Jsolar App',
          },
        }
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    mapRef.current = L.map(mapContainer.current).setView([-23.5505, -46.6333], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Geocodificar e adicionar marcadores
  useEffect(() => {
    if (!mapRef.current || orders.length === 0) {
      setLoading(false);
      return;
    }

    const updateMarkers = async () => {
      setLoading(true);
      setGeocodedCount(0);

      // Limpar marcadores anteriores
      markersRef.current.forEach(({ marker }) => {
        mapRef.current?.removeLayer(marker);
      });
      markersRef.current = [];

      const newMarkers: OrderMarker[] = [];

      // Geocodificar endereços em paralelo (limitado para não sobrecarregar a API)
      const geocodePromises = orders.map(async (order) => {
        const coords = await geocodeAddress(order.address);
        if (coords) {
          setGeocodedCount((prev) => prev + 1);
          return { order, coords };
        }
        return null;
      });

      const results = await Promise.all(geocodePromises);

      // Criar marcadores customizados
      results.forEach((result) => {
        if (!result || !mapRef.current) return;

        const { order, coords } = result;
        const color = statusColors[order.status];

        // Criar ícone customizado
        const customIcon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              background-color: ${color};
              width: 24px;
              height: 24px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">
              <div style="
                transform: rotate(45deg);
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <div style="
                  width: 8px;
                  height: 8px;
                  background-color: white;
                  border-radius: 50%;
                "></div>
              </div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 24],
        });

        const marker = L.marker([coords.lat, coords.lng], {
          icon: customIcon,
        }).addTo(mapRef.current!);

        // Popup com informações da ordem
        const popupContent = `
          <div style="min-width: 200px;">
            <div style="font-weight: bold; margin-bottom: 4px; color: ${color};">${order.id}</div>
            <div style="font-size: 0.875rem; margin-bottom: 4px;">${order.client}</div>
            <div style="font-size: 0.75rem; color: #666; margin-bottom: 8px;">${order.address}</div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span style="
                display: inline-block;
                width: 8px;
                height: 8px;
                background-color: ${color};
                border-radius: 50%;
              "></span>
              <span style="font-size: 0.75rem;">${statusLabels[order.status]}</span>
            </div>
          </div>
        `;
        marker.bindPopup(popupContent);

        newMarkers.push({ order, lat: coords.lat, lng: coords.lng, marker });
      });

      markersRef.current = newMarkers;

      // Ajustar visualização do mapa para mostrar todos os marcadores
      if (newMarkers.length > 0 && mapRef.current) {
        const bounds = L.latLngBounds(
          newMarkers.map((m) => [m.lat, m.lng])
        );
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }

      setLoading(false);
    };

    updateMarkers();
  }, [orders]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Locais das Ordens de Serviço
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && orders.length > 0 && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-[1000] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Carregando locais... ({geocodedCount}/{orders.length})
              </p>
            </div>
          </div>
        )}
        <div className="space-y-4">
          {/* Legenda */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full border-2 border-white shadow"
                style={{ backgroundColor: statusColors.pending }}
              />
              <span>Pendente</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full border-2 border-white shadow"
                style={{ backgroundColor: statusColors.inProgress }}
              />
              <span>Em Andamento</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full border-2 border-white shadow"
                style={{ backgroundColor: statusColors.completed }}
              />
              <span>Concluída</span>
            </div>
          </div>

          {/* Mapa */}
          <div
            ref={mapContainer}
            style={{ height, width: '100%', borderRadius: '8px', position: 'relative' }}
            className="border border-border"
          />
        </div>
      </CardContent>
    </Card>
  );
}