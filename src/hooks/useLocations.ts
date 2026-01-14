import { useState, useEffect } from 'react';
import { Location } from '@/types/location';

// Mock data - will be replaced with backend later
const initialLocations: Location[] = [
  {
    id: "1",
    name: "Loja Principal - SolarTech",
    type: "main",
    address: "Av. Energia Solar, 1000 - Centro",
    coordinates: { lat: -23.5505, lng: -46.6333 },
    toleranceRadius: 100,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Simple event emitter for cross-component sync
const locationListeners: Set<() => void> = new Set();
let sharedLocations = [...initialLocations];

export const useLocations = () => {
  const [locations, setLocations] = useState<Location[]>(sharedLocations);

  useEffect(() => {
    const listener = () => setLocations([...sharedLocations]);
    locationListeners.add(listener);
    return () => {
      locationListeners.delete(listener);
    };
  }, []);

  const updateLocations = (newLocations: Location[]) => {
    sharedLocations = newLocations;
    locationListeners.forEach(listener => listener());
  };

  const getMainLocation = (): Location | null => {
    return locations.find(loc => loc.type === 'main' && loc.isActive) || null;
  };

  const addLocation = (location: Location) => {
    updateLocations([...sharedLocations, location]);
  };

  const updateLocation = (id: string, updates: Partial<Location>) => {
    updateLocations(
      sharedLocations.map(loc => 
        loc.id === id ? { ...loc, ...updates, updatedAt: new Date() } : loc
      )
    );
  };

  const deleteLocation = (id: string) => {
    updateLocations(sharedLocations.filter(loc => loc.id !== id));
  };

  const calculateDistance = (
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const validateGPSAgainstMain = (
    userLat: number, 
    userLng: number
  ): { isValid: boolean; distance: number; mainLocation: Location | null } => {
    const mainLocation = getMainLocation();
    
    if (!mainLocation) {
      return { isValid: false, distance: 0, mainLocation: null };
    }

    const distance = calculateDistance(
      userLat,
      userLng,
      mainLocation.coordinates.lat,
      mainLocation.coordinates.lng
    );

    return {
      isValid: distance <= mainLocation.toleranceRadius,
      distance: Math.round(distance),
      mainLocation,
    };
  };

  return {
    locations,
    getMainLocation,
    addLocation,
    updateLocation,
    deleteLocation,
    validateGPSAgainstMain,
    calculateDistance,
  };
};
