export interface Location {
  id: string;
  name: string;
  type: 'main' | 'branch' | 'warehouse';
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  toleranceRadius: number; // in meters
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GPSCoordinates {
  lat: number;
  lng: number;
}
