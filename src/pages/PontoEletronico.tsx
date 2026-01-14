import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  MapPin, 
  CheckCircle, 
  AlertCircle,
  LogIn,
  LogOut,
  Coffee,
  Play,
  Navigation,
  Settings2,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useDbLocations } from "@/hooks/useDbLocations";
import { useDbTimeRecords } from "@/hooks/useDbTimeRecords";
import { Link } from "react-router-dom";

interface TimeEntry {
  id: string;
  type: "entry" | "lunchOut" | "lunchReturn" | "exit";
  time: string;
  location: string;
  validated: boolean;
  coordinates?: { lat: number; lng: number };
}

const PontoEletronico = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  
  const { getMainLocation, validateGPSAgainstMain, loading: locationsLoading } = useDbLocations();
  const { addRecord, refetch, getTodayRecords } = useDbTimeRecords();
  const mainLocation = getMainLocation();

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getNextRecordType = (): TimeEntry["type"] | null => {
    const types: TimeEntry["type"][] = ["entry", "lunchOut", "lunchReturn", "exit"];
    // Use getTodayRecords from hook
    const recordedTypes = getTodayRecords().map((r) => r.record_type);
    for (const type of types) {
      if (!recordedTypes.includes(type)) {
        return type;
      }
    }
    return null;
  };

  const typeConfig = {
    entry: { 
      label: "Entrada", 
      icon: LogIn, 
      color: "text-success",
      bgColor: "bg-success/10",
      buttonVariant: "success" as const,
      requiresGps: true
    },
    lunchOut: { 
      label: "Saída Almoço", 
      icon: Coffee, 
      color: "text-warning",
      bgColor: "bg-warning/10",
      buttonVariant: "warning" as const,
      requiresGps: false
    },
    lunchReturn: { 
      label: "Retorno Almoço", 
      icon: Coffee, 
      color: "text-info",
      bgColor: "bg-info/10",
      buttonVariant: "default" as const,
      requiresGps: false
    },
    exit: { 
      label: "Saída", 
      icon: LogOut, 
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      buttonVariant: "destructive" as const,
      requiresGps: true
    },
  };

  const nextType = getNextRecordType();

  const registerTime = async () => {
    if (!nextType) return;
    const config = typeConfig[nextType];

    // Check if main location exists when GPS is required
    if (config.requiresGps && !mainLocation) {
      toast.error("Loja principal não configurada", {
        description: "Configure o local principal em Locais antes de registrar.",
      });
      return;
    }

    setIsGpsLoading(true);
    try {
      // Try to get real GPS location first
      let userLocation: { lat: number; lng: number };
      
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });
        userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
      } catch {
        // Fallback to mock location for demo (near main location)
        if (mainLocation) {
          userLocation = {
            lat: mainLocation.latitude + (Math.random() - 0.5) * 0.001,
            lng: mainLocation.longitude + (Math.random() - 0.5) * 0.001,
          };
        } else {
          userLocation = { lat: -23.5505, lng: -46.6333 };
        }
        toast.info("GPS real não disponível", {
          description: "Usando localização simulada para demonstração.",
        });
      }

      // Validate against main location
      const validation = validateGPSAgainstMain(userLocation.lat, userLocation.lng);
      const validated = !config.requiresGps || validation.isValid;

      // Salva no banco de dados
      const success = await addRecord({
        record_type: nextType,
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        location_name: validated 
          ? mainLocation?.name || "Local validado"
          : `${validation.distance}m da loja`,
        is_validated: validated,
        distance_from_main: validation.distance,
      });
      if (success) {
        refetch();
        toast.success(`${config.label} registrada com sucesso!`, {
          description: `Horário: ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
        });
      } else {
        toast.error("Erro ao registrar ponto");
      }
    } catch {
      toast.error("Erro ao obter localização", {
        description: "Verifique as permissões de GPS do seu dispositivo.",
      });
    } finally {
      setIsGpsLoading(false);
    }
  };

  if (locationsLoading) {
    return (
      <DashboardLayout title="Ponto Eletrônico" subtitle="Controle de jornada de trabalho">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Ponto Eletrônico" subtitle="Controle de jornada de trabalho">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Clock Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2"
        >
          <Card variant="solar" className="overflow-hidden">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <p className="text-primary-foreground/80 mb-2">
                  {new Date().toLocaleDateString("pt-BR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <div className="text-6xl font-bold text-primary-foreground mb-6">
                  {currentTime.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </div>
              </motion.div>

              {nextType && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-4"
                >
                  <p className="text-primary-foreground/80">
                    Próximo registro: <strong>{typeConfig[nextType].label}</strong>
                    {typeConfig[nextType].requiresGps && (
                      <Badge className="ml-2 bg-primary-foreground/20 text-primary-foreground">
                        <MapPin className="h-3 w-3 mr-1" />
                        GPS Obrigatório
                      </Badge>
                    )}
                  </p>
                  <Button
                    size="xl"
                    onClick={registerTime}
                    disabled={isGpsLoading}
                    className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg"
                  >
                    {isGpsLoading ? (
                      <>
                        <Navigation className="h-5 w-5 animate-pulse mr-2" />
                        Obtendo Localização...
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5 mr-2" />
                        Registrar {typeConfig[nextType].label}
                      </>
                    )}
                  </Button>
                </motion.div>
              )}

              {!nextType && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-primary-foreground/80"
                >
                  <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-xl font-medium">Jornada Completa</p>
                  <p>Todos os registros do dia foram realizados.</p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Location Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Local de Trabalho
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mainLocation ? (
                <>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{mainLocation.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {mainLocation.address}
                        </p>
                      </div>
                      <Badge variant="success">Ativo</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
                      <CheckCircle className="h-4 w-4 text-success" />
                    </div>
                    <span>Raio de tolerância: <strong>{mainLocation.tolerance_radius}m</strong></span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Coordenadas: {mainLocation.latitude.toFixed(6)}, {mainLocation.longitude.toFixed(6)}
                    </p>
                    <p className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Entrada e saída requerem validação GPS
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <AlertCircle className="h-10 w-10 mx-auto text-warning mb-3" />
                  <p className="font-medium text-warning">Local principal não configurado</p>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Configure o local principal para validar registros GPS
                  </p>
                  <Link to="/locais">
                    <Button variant="outline" size="sm">
                      <Settings2 className="h-4 w-4 mr-2" />
                      Configurar Locais
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Today's Records */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Registros de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getTodayRecords().length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum registro realizado hoje.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getTodayRecords().map((record, index) => {
                  const config = typeConfig[record.record_type];
                  const Icon = config.icon;
                  const time = new Date(record.recorded_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                  return (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${config.bgColor}`}>
                        <Icon className={`h-6 w-6 ${config.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{config.label}</span>
                          <Badge variant={record.is_validated ? "success" : "warning"}>
                            {record.is_validated ? "Validado" : "Fora do raio"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {record.location_name}
                          </span>
                        </div>
                      </div>
                      {record.is_validated ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-warning" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default PontoEletronico;