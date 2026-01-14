import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { MapPin, Target, Navigation } from 'lucide-react';
import type { GPSCoordinates } from '@/types/location';

interface MapSelectorProps {
  coordinates?: GPSCoordinates;
  toleranceRadius?: number;
  onCoordinatesChange: (coords: GPSCoordinates) => void;
  onRadiusChange: (radius: number) => void;
  mapboxToken: string;
}

const MapSelector = React.forwardRef<HTMLDivElement, MapSelectorProps>(
  ({
    coordinates,
    toleranceRadius = 100,
    onCoordinatesChange,
    onRadiusChange,
    mapboxToken,
  }, ref) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const marker = useRef<mapboxgl.Marker | null>(null);
    const [currentCoords, setCurrentCoords] = useState<GPSCoordinates>(
      coordinates || { lat: -23.5505, lng: -46.6333 }
    );
    const [isLocating, setIsLocating] = useState(false);

    // Create circle GeoJSON for tolerance radius
    const createCircle = (center: [number, number], radiusKm: number, points = 64) => {
      const coords = [];
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * 2 * Math.PI;
        const dx = radiusKm * Math.cos(angle);
        const dy = radiusKm * Math.sin(angle);
        const lat = center[1] + (dy / 111.32);
        const lng = center[0] + (dx / (111.32 * Math.cos((center[1] * Math.PI) / 180)));
        coords.push([lng, lat]);
      }
      coords.push(coords[0]);
      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [coords],
        },
        properties: {},
      };
    };

    const updateCircle = () => {
      if (map.current?.getSource('tolerance-circle')) {
        const source = map.current.getSource('tolerance-circle') as mapboxgl.GeoJSONSource;
        source.setData(createCircle([currentCoords.lng, currentCoords.lat], toleranceRadius / 1000));
      }
    };

    useEffect(() => {
      if (!mapContainer.current || !mapboxToken) return;

      mapboxgl.accessToken = mapboxToken;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [currentCoords.lng, currentCoords.lat],
        zoom: 15,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      marker.current = new mapboxgl.Marker({
        color: '#E11D48',
        draggable: true,
      })
        .setLngLat([currentCoords.lng, currentCoords.lat])
        .addTo(map.current);

      marker.current.on('dragend', () => {
        const lngLat = marker.current?.getLngLat();
        if (lngLat) {
          const newCoords = { lat: lngLat.lat, lng: lngLat.lng };
          setCurrentCoords(newCoords);
          onCoordinatesChange(newCoords);
        }
      });

      map.current.on('style.load', () => {
        if (!map.current) return;
        map.current.addSource('tolerance-circle', {
          type: 'geojson',
          data: createCircle([currentCoords.lng, currentCoords.lat], toleranceRadius / 1000),
        });

        map.current.addLayer({
          id: 'tolerance-circle-fill',
          type: 'fill',
          source: 'tolerance-circle',
          paint: { 'fill-color': '#E11D48', 'fill-opacity': 0.15 },
        });

        map.current.addLayer({
          id: 'tolerance-circle-line',
          type: 'line',
          source: 'tolerance-circle',
          paint: {
            'line-color': '#E11D48',
            'line-width': 2,
            'line-dasharray': [2, 2],
          },
        });
      });

      map.current.on('click', (e) => {
        const newCoords = { lat: e.lngLat.lat, lng: e.lngLat.lng };
        setCurrentCoords(newCoords);
        onCoordinatesChange(newCoords);
        marker.current?.setLngLat([newCoords.lng, newCoords.lat]);
      });

      return () => {
        map.current?.remove();
      };
    }, [mapboxToken]);

    useEffect(() => {
      if (marker.current) {
        marker.current.setLngLat([currentCoords.lng, currentCoords.lat]);
      }
      updateCircle();
    }, [currentCoords]);

    useEffect(() => {
      updateCircle();
    }, [toleranceRadius]);

    const handleGetCurrentLocation = () => {
      if (!navigator.geolocation) {
        alert('Geolocalização não suportada');
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
          marker.current?.setLngLat([newCoords.lng, newCoords.lat]);
          map.current?.flyTo({ center: [newCoords.lng, newCoords.lat], zoom: 16 });
          setIsLocating(false);
        },
        () => {
          setIsLocating(false);
          alert('Não foi possível obter a localização');
        },
        { enableHighAccuracy: true }
      );
    };

    if (!mapboxToken) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p>Token do Mapbox não configurado.</p>
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
              Localização no Mapa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div ref={mapContainer} className="w-full h-[400px] rounded-lg overflow-hidden border" />
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
            >
              <Navigation className="h-4 w-4 mr-2" />
              {isLocating ? 'Localizando...' : 'Minha Localização'}
            </Button>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input type="number" value={currentCoords.lat.toFixed(6)} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input type="number" value={currentCoords.lng.toFixed(6)} readOnly />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Raio de Tolerância ({toleranceRadius}m)</Label>
              </div>
              <Slider
                value={[toleranceRadius]}
                onValueChange={([val]) => onRadiusChange(val)}
                min={50}
                max={500}
                step={10}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);

MapSelector.displayName = 'MapSelector';
export default MapSelector;