import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Check, MapPin, Clock } from "lucide-react";

interface PhotoCaptureProps {
  onSave: (photoDataUrl: string, metadata: { timestamp: Date; gps?: { latitude: number; longitude: number } }) => void;
  onCancel: () => void;
}

export const PhotoCapture = ({ onSave, onCancel }: PhotoCaptureProps) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoadingGps, setIsLoadingGps] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const captureGps = () => {
    setIsLoadingGps(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setIsLoadingGps(false);
        },
        () => {
          setIsLoadingGps(false);
        }
      );
    } else {
      setIsLoadingGps(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhoto(event.target?.result as string);
      captureGps();
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!photo) return;
    
    onSave(photo, {
      timestamp: new Date(),
      gps: gpsLocation || undefined,
    });
  };

  const clearPhoto = () => {
    setPhoto(null);
    setGpsLocation(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {!photo ? (
        <div 
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium">Tirar Foto ou Selecionar</p>
          <p className="text-xs text-muted-foreground mt-1">
            Clique para capturar ou escolher uma imagem
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden">
            <img 
              src={photo} 
              alt="Captured" 
              className="w-full h-48 object-cover"
            />
            <button
              onClick={clearPhoto}
              className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{new Date().toLocaleString('pt-BR')}</span>
            </div>
            {gpsLocation && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>
                  {gpsLocation.latitude.toFixed(4)}, {gpsLocation.longitude.toFixed(4)}
                </span>
              </div>
            )}
            {isLoadingGps && (
              <span className="text-primary">Obtendo localização...</span>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1"
        >
          <Upload className="h-4 w-4 mr-2" />
          {photo ? 'Trocar' : 'Selecionar'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={!photo}
          className="flex-1 gradient-solar"
        >
          <Check className="h-4 w-4 mr-2" />
          Salvar
        </Button>
      </div>
    </div>
  );
};
