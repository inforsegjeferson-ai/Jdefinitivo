import { DashboardLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, 
  Search, 
  Shield,
  Wrench,
  HardHat,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useDbTeam, AppRole } from "@/hooks/useDbTeam";

const roleConfig: Record<AppRole, { label: string; icon: typeof Shield; color: string; variant: "default" | "success" | "info" }> = {
  admin: { label: "Administrativo", icon: Shield, color: "text-primary", variant: "default" },
  installer: { label: "Instalador", icon: Wrench, color: "text-success", variant: "success" },
  auxiliary: { label: "Auxiliar", icon: HardHat, color: "text-info", variant: "info" },
};

const Equipe = () => {
  const { members, loading, addRole, removeRole } = useDbTeam();
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMembers = members.filter((member) => {
    const matchesFilter = filter === "all" || member.roles.includes(filter as AppRole);
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: members.length,
    admins: members.filter((m) => m.roles.includes("admin")).length,
    installers: members.filter((m) => m.roles.includes("installer")).length,
    auxiliaries: members.filter((m) => m.roles.includes("auxiliary")).length,
  };

  const handleRoleChange = async (userId: string, currentRoles: AppRole[], newRole: AppRole) => {
    // Remove current primary role and add new one
    const primaryRole = currentRoles[0];
    if (primaryRole && primaryRole !== newRole) {
      await removeRole(userId, primaryRole);
    }
    if (!currentRoles.includes(newRole)) {
      await addRole(userId, newRole);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Equipe" subtitle="Gestão de colaboradores">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Equipe" subtitle="Gestão de colaboradores">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                <Wrench className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.installers}</p>
                <p className="text-sm text-muted-foreground">Instaladores</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10">
                <HardHat className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.auxiliaries}</p>
                <p className="text-sm text-muted-foreground">Auxiliares</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.admins}</p>
                <p className="text-sm text-muted-foreground">Administradores</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col md:flex-row gap-4 mb-6"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filtrar por função" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="admin">Administrativo</SelectItem>
            <SelectItem value="installer">Instalador</SelectItem>
            <SelectItem value="auxiliary">Auxiliar</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {members.length === 0 
                        ? "Nenhum colaborador cadastrado. Cadastre usuários no sistema para vê-los aqui."
                        : "Nenhum colaborador encontrado com os filtros aplicados."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => {
                    const primaryRole = member.roles[0] || 'auxiliary';
                    const roleInfo = roleConfig[primaryRole];
                    const RoleIcon = roleInfo?.icon || HardHat;

                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                              <span className="text-sm font-medium text-primary">
                                {member.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-sm text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <RoleIcon className={`h-4 w-4 ${roleInfo?.color || 'text-muted-foreground'}`} />
                            <span>{roleInfo?.label || 'Colaborador'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{member.phone || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={member.is_active ? "success" : "secondary"}>
                            {member.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default Equipe;
