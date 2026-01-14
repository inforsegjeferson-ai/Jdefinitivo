import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Truck, Wrench, CheckCircle } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: "installer" | "auxiliary";
  status: "available" | "onService" | "break";
  avatar?: string;
}

interface Vehicle {
  id: string;
  plate: string;
  model: string;
  status: "available" | "inUse" | "maintenance";
}

const memberStatusConfig = {
  available: { label: "Disponível", variant: "success" as const },
  onService: { label: "Em Serviço", variant: "inProgress" as const },
  break: { label: "Intervalo", variant: "warning" as const },
};

const vehicleStatusConfig = {
  available: { label: "Disponível", variant: "success" as const },
  inUse: { label: "Em Uso", variant: "inProgress" as const },
  maintenance: { label: "Manutenção", variant: "warning" as const },
};

interface TeamOverviewProps {
  members: TeamMember[];
  vehicles: Vehicle[];
}

export function TeamOverview({ members, vehicles }: TeamOverviewProps) {
  const availableMembers = members.filter(m => m.status === "available").length;
  const availableVehicles = vehicles.filter(v => v.status === "available").length;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Team Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Equipe
              </div>
              <Badge variant="outline">
                {availableMembers}/{members.length} disponíveis
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {members.slice(0, 4).map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-sm font-medium text-primary">
                        {member.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {member.role === "installer" ? "Instalador" : "Auxiliar"}
                      </p>
                    </div>
                  </div>
                  <Badge variant={memberStatusConfig[member.status].variant}>
                    {memberStatusConfig[member.status].label}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Vehicles Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                Frota
              </div>
              <Badge variant="outline">
                {availableVehicles}/{vehicles.length} disponíveis
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vehicles.slice(0, 4).map((vehicle, index) => (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-info/10">
                      <Truck className="h-4 w-4 text-info" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{vehicle.plate}</p>
                      <p className="text-xs text-muted-foreground">{vehicle.model}</p>
                    </div>
                  </div>
                  <Badge variant={vehicleStatusConfig[vehicle.status].variant}>
                    {vehicleStatusConfig[vehicle.status].label}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
