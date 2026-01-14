import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Target, Navigation, Loader2 } from 'lucide-react';
import type { GPSCoordinates } from '@/types/location';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface LeafletMapSelectorProps {
  coordinates?: GPSCoordinates;
  toleranceRadius?: number;
  onCoordinatesChange: (coords: GPSCoordinates) => void;
  onRadiusChange: (radius: number) => void;
}

const LeafletMapSelector = React.forwardRef<HTMLDivElement, LeafletMapSelectorProps>(
  ({
    coordinates,
    toleranceRadius = 100,
    onCoordinatesChange,
    onRadiusChange,
  }, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const [currentCoords, setCurrentCoords] = useState<GPSCoordinates>(
    coordinates || { lat: -23.5505, lng: -46.6333 }
  );
  const [isLocating, setIsLocating] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    mapRef.current = L.map(mapContainer.current).setView(
      [currentCoords.lat, currentCoords.lng],
      15
    );

    // Add OpenStreetMap tiles (FREE!)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapRef.current);

    // Add draggable marker
    markerRef.current = L.marker([currentCoords.lat, currentCoords.lng], {
      draggable: true,
    }).addTo(mapRef.current);

    // Add tolerance circle
    circleRef.current = L.circle([currentCoords.lat, currentCoords.lng], {
      radius: toleranceRadius,
      color: 'hsl(38, 92%, 50%)',
      fillColor: 'hsl(38, 92%, 50%)',
      fillOpacity: 0.15,
      weight: 2,
      dashArray: '5, 5',
    }).addTo(mapRef.current);

    // Handle marker drag
    markerRef.current.on('dragend', () => {
      const latlng = markerRef.current?.getLatLng();
      if (latlng) {
        const newCoords = { lat: latlng.lat, lng: latlng.lng };
        setCurrentCoords(newCoords);
        onCoordinatesChange(newCoords);
        circleRef.current?.setLatLng(latlng);
      }
    });

    // Handle map click
    mapRef.current.on('click', (e: L.LeafletMouseEvent) => {
      const newCoords = { lat: e.latlng.lat, lng: e.latlng.lng };
      setCurrentCoords(newCoords);
      onCoordinatesChange(newCoords);
      markerRef.current?.setLatLng(e.latlng);
      circleRef.current?.setLatLng(e.latlng);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update marker and circle when coordinates change externally
  useEffect(() => {
    if (coordinates && mapRef.current) {
      const latlng: L.LatLngExpression = [coordinates.lat, coordinates.lng];
      markerRef.current?.setLatLng(latlng);
      circleRef.current?.setLatLng(latlng);
      mapRef.current.setView(latlng, mapRef.current.getZoom());
      setCurrentCoords(coordinates);
    }
  }, [coordinates]);

  // Update circle radius when tolerance changes
  useEffect(() => {
    circleRef.current?.setRadius(toleranceRadius);
  }, [toleranceRadius]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada pelo navegador');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentCoords(newCoords);
        onCoordinatesChange(newCoords);
        const latlng: L.LatLngExpression = [newCoords.lat, newCoords.lng];
        markerRef.current?.setLatLng(latlng);
        circleRef.current?.setLatLng(latlng);
        mapRef.current?.setView(latlng, 16);
        setIsLocating(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsLocating(false);
        alert('Não foi possível obter sua localização');
      },
      { enableHighAccuracy: true }
    );
  };

  const handleCoordInputChange = (field: 'lat' | 'lng', value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      const newCoords = { ...currentCoords, [field]: numValue };
      setCurrentCoords(newCoords);
      onCoordinatesChange(newCoords);
      const latlng: L.LatLngExpression = [newCoords.lat, newCoords.lng];
      markerRef.current?.setLatLng(latlng);
      circleRef.current?.setLatLng(latlng);
      mapRef.current?.setView(latlng, mapRef.current?.getZoom() || 15);
    }
  };

  return (
    <div ref={ref} className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Selecione a Localização no Mapa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div 
            ref={mapContainer} 
            className="w-full h-[400px] rounded-lg overflow-hidden border z-0"
          />
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
            >
              {isLocating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4 mr-2" />
              )}
              {isLocating ? 'Localizando...' : 'Usar Minha Localização'}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lat">Latitude</Label>
              <Input
                id="lat"
                type="number"
                step="0.0001"
                value={currentCoords.lat.toFixed(6)}
                onChange={(e) => handleCoordInputChange('lat', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lng">Longitude</Label>
              <Input
                id="lng"
                type="number"
                step="0.0001"
                value={currentCoords.lng.toFixed(6)}
                onChange={(e) => handleCoordInputChange('lng', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Raio de Tolerância</Label>
              <span className="text-sm font-medium text-primary">
                {toleranceRadius}m
              </span>
            </div>
            <Slider
              value={[toleranceRadius]}
              onValueChange={([value]) => onRadiusChange(value)}
              min={50}
              max={500}
              step={10}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Define a área permitida para registro de ponto (50m - 500m)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
    );
  }
);

LeafletMapSelector.displayName = 'LeafletMapSelector';

export default LeafletMapSelector;
