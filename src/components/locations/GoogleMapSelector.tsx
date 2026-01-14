import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { MapPin, Target, Navigation, Loader2 } from 'lucide-react';
import type { GPSCoordinates } from '@/types/location';

interface GoogleMapSelectorProps {
  coordinates?: GPSCoordinates;
  toleranceRadius?: number;
  onCoordinatesChange: (coords: GPSCoordinates) => void;
  onRadiusChange: (radius: number) => void;
  apiKey: string;
}

declare global {
  interface Window {
    google: any;
    initGoogleMap: () => void;
  }
}

const GoogleMapSelector = React.forwardRef<HTMLDivElement, GoogleMapSelectorProps>(
  ({
    coordinates,
    toleranceRadius = 100,
    onCoordinatesChange,
    onRadiusChange,
    apiKey,
  }, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const [currentCoords, setCurrentCoords] = useState<GPSCoordinates>(
    coordinates || { lat: -23.5505, lng: -46.6333 }
  );
  const [isLocating, setIsLocating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const updateCircle = useCallback(() => {
    if (circleRef.current) {
      circleRef.current.setCenter({ lat: currentCoords.lat, lng: currentCoords.lng });
      circleRef.current.setRadius(toleranceRadius);
    }
  }, [currentCoords, toleranceRadius]);

  const initMap = useCallback(() => {
    if (!mapContainer.current || !window.google) return;

    const map = new window.google.maps.Map(mapContainer.current, {
      center: { lat: currentCoords.lat, lng: currentCoords.lng },
      zoom: 15,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });

    mapRef.current = map;

    // Add marker
    const marker = new window.google.maps.Marker({
      position: { lat: currentCoords.lat, lng: currentCoords.lng },
      map,
      draggable: true,
      animation: window.google.maps.Animation.DROP,
    });

    markerRef.current = marker;

    // Add circle for tolerance radius
    const circle = new window.google.maps.Circle({
      map,
      center: { lat: currentCoords.lat, lng: currentCoords.lng },
      radius: toleranceRadius,
      fillColor: '#f59e0b',
      fillOpacity: 0.15,
      strokeColor: '#f59e0b',
      strokeOpacity: 0.8,
      strokeWeight: 2,
    });

    circleRef.current = circle;

    // Handle marker drag
    marker.addListener('dragend', () => {
      const position = marker.getPosition();
      if (position) {
        const newCoords = { lat: position.lat(), lng: position.lng() };
        setCurrentCoords(newCoords);
        onCoordinatesChange(newCoords);
        circle.setCenter(position);
      }
    });

    // Handle map click
    map.addListener('click', (e: any) => {
      const newCoords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setCurrentCoords(newCoords);
      onCoordinatesChange(newCoords);
      marker.setPosition(e.latLng);
      circle.setCenter(e.latLng);
    });

    setIsLoading(false);
  }, [currentCoords.lat, currentCoords.lng, toleranceRadius, onCoordinatesChange]);

  useEffect(() => {
    if (!apiKey) {
      setIsLoading(false);
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initMap();
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initMap();
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps');
      setIsLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, [apiKey, initMap]);

  // Update marker and circle when coordinates change externally
  useEffect(() => {
    if (markerRef.current && mapRef.current) {
      markerRef.current.setPosition({ lat: currentCoords.lat, lng: currentCoords.lng });
      if (circleRef.current) {
        circleRef.current.setCenter({ lat: currentCoords.lat, lng: currentCoords.lng });
      }
    }
  }, [currentCoords]);

  // Update circle radius
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(toleranceRadius);
    }
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
        
        if (markerRef.current) {
          markerRef.current.setPosition(newCoords);
        }
        if (circleRef.current) {
          circleRef.current.setCenter(newCoords);
        }
        if (mapRef.current) {
          mapRef.current.panTo(newCoords);
          mapRef.current.setZoom(16);
        }
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
      
      if (mapRef.current) {
        mapRef.current.panTo(newCoords);
      }
      if (markerRef.current) {
        markerRef.current.setPosition(newCoords);
      }
      if (circleRef.current) {
        circleRef.current.setCenter(newCoords);
      }
    }
  };

  if (!apiKey) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Chave da API do Google Maps não configurada. Por favor, adicione sua chave nas configurações.
          </p>
        </CardContent>
      </Card>
    );
  }

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
          {isLoading ? (
            <div className="w-full h-[400px] rounded-lg border flex items-center justify-center bg-muted">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div 
              ref={mapContainer} 
              className="w-full h-[400px] rounded-lg overflow-hidden border"
            />
          )}
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
            >
              <Navigation className="h-4 w-4 mr-2" />
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

GoogleMapSelector.displayName = 'GoogleMapSelector';

export default GoogleMapSelector;
