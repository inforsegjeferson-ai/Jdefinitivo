import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DashboardLayout } from '@/components/layout';
import { StatCard } from '@/components/dashboard';
import { LocationCard, LocationDialog } from '@/components/locations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MapPin, 
  Building2, 
  Warehouse, 
  Plus, 
  Search,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Location } from '@/types/location';
import { useDbLocations, DbLocation, LocationInput } from '@/hooks/useDbLocations';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const Locais = () => {
  const { locations, loading, addLocation, updateLocation, deleteLocation, getMainLocation } = useDbLocations();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  
  const overviewMapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const mainLocation = getMainLocation();
  const hasMainLocation = !!mainLocation;

  // Convert DB location to frontend Location type
  const convertToFrontend = (dbLoc: DbLocation): Location => ({
    id: dbLoc.id,
    name: dbLoc.name,
    type: dbLoc.type,
    address: dbLoc.address,
    coordinates: { lat: dbLoc.latitude, lng: dbLoc.longitude },
    toleranceRadius: dbLoc.tolerance_radius,
    isActive: dbLoc.is_active,
    createdAt: new Date(dbLoc.created_at),
    updatedAt: new Date(dbLoc.updated_at),
  });

  const frontendLocations = locations.map(convertToFrontend);

  // Stats
  const stats = {
    total: locations.length,
    main: locations.filter(l => l.type === 'main').length,
    branches: locations.filter(l => l.type === 'branch').length,
    warehouses: locations.filter(l => l.type === 'warehouse').length,
  };

  // Filter locations
  const filteredLocations = frontendLocations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Initialize overview map with Leaflet
  const initOverviewMap = useCallback(() => {
    if (!overviewMapContainer.current || mapRef.current) return;

    const mainLoc = getMainLocation();
    const center: L.LatLngExpression = mainLoc 
      ? [mainLoc.latitude, mainLoc.longitude]
      : [-23.5505, -46.6333];

    mapRef.current = L.map(overviewMapContainer.current).setView(center, 10);

    // Add OpenStreetMap tiles (FREE!)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapRef.current);
  }, [getMainLocation]);

  // Initialize map on mount
  useEffect(() => {
    if (!loading) {
      initOverviewMap();
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [loading, initOverviewMap]);

  // Update markers when locations change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add markers for each location
    locations.forEach(location => {
      const markerColor = location.type === 'main' 
        ? '#f59e0b' 
        : location.type === 'branch' 
          ? '#3b82f6' 
          : '#6b7280';

      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          width: 24px;
          height: 24px;
          background-color: ${markerColor};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([location.latitude, location.longitude], { icon: customIcon })
        .addTo(mapRef.current!);

      const popupContent = `
        <div style="padding: 4px;">
          <strong>${location.name}</strong>
          <p style="font-size: 12px; margin: 4px 0 0;">${location.address}</p>
          <p style="font-size: 11px; color: #666; margin: 4px 0 0;">Raio: ${location.tolerance_radius}m</p>
        </div>
      `;
      marker.bindPopup(popupContent);

      markersRef.current.push(marker);
    });

    // Fit map to show all markers
    if (locations.length > 0 && mapRef.current) {
      const bounds = L.latLngBounds(locations.map(l => [l.latitude, l.longitude] as L.LatLngTuple));
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations]);

  const handleSaveLocation = async (locationData: Omit<Location, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    const input: LocationInput = {
      name: locationData.name,
      type: locationData.type,
      address: locationData.address,
      latitude: locationData.coordinates.lat,
      longitude: locationData.coordinates.lng,
      tolerance_radius: locationData.toleranceRadius,
      is_active: locationData.isActive,
    };

    if (locationData.id) {
      await updateLocation(locationData.id, input);
    } else {
      await addLocation(input);
    }
    setEditingLocation(null);
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setDialogOpen(true);
  };

  const handleDeleteLocation = async (id: string) => {
    await deleteLocation(id);
  };

  const handleViewOnMap = (location: Location) => {
    if (mapRef.current) {
      mapRef.current.setView([location.coordinates.lat, location.coordinates.lng], 16);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Locais" subtitle="Gestão de locais e coordenadas GPS">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Locais" subtitle="Gestão de locais e coordenadas GPS">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <StatCard title="Total de Locais" value={stats.total} icon={MapPin} />
        <StatCard title="Loja Principal" value={stats.main} icon={Building2} />
        <StatCard title="Filiais" value={stats.branches} icon={MapPin} />
        <StatCard title="Depósitos" value={stats.warehouses} icon={Warehouse} />
      </div>

      {/* Overview Map */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Visão Geral dos Locais</CardTitle>
        </CardHeader>
        <CardContent>
          <div ref={overviewMapContainer} className="w-full h-[300px] rounded-lg overflow-hidden border z-0" />
        </CardContent>
      </Card>

      {/* Search and Add */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou endereço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          onClick={() => {
            setEditingLocation(null);
            setDialogOpen(true);
          }}
          className="gradient-solar"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Local
        </Button>
      </div>

      {/* Locations Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filteredLocations.map(location => (
            <LocationCard
              key={location.id}
              location={location}
              onEdit={handleEditLocation}
              onDelete={handleDeleteLocation}
              onViewOnMap={handleViewOnMap}
            />
          ))}
        </AnimatePresence>
      </div>

      {filteredLocations.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum local encontrado</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Tente ajustar sua busca.' : 'Adicione seu primeiro local clicando no botão acima.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Location Dialog */}
      <LocationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        location={editingLocation}
        onSave={handleSaveLocation}
        hasMainLocation={hasMainLocation}
      />
    </DashboardLayout>
  );
};

export default Locais;
