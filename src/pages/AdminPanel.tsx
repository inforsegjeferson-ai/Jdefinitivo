import { useState } from 'react';
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  UserCheck, 
  UserX, 
  Shield, 
  Wrench, 
  Users, 
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Search,
  Trash2,
  X
} from "lucide-react";
import { motion } from "framer-motion";
import { useDbTeam, AppRole, TeamMemberWithRole } from "@/hooks/useDbTeam";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

const roleConfig: Record<AppRole, { label: string; icon: React.ReactNode; color: string }> = {
  admin: { 
    label: 'Administrador', 
    icon: <Shield className="h-4 w-4" />,
    color: 'bg-primary/10 text-primary border-primary/20'
  },
  installer: { 
    label: 'Instalador', 
    icon: <Wrench className="h-4 w-4" />,
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
  },
  auxiliary: { 
    label: 'Auxiliar', 
    icon: <Users className="h-4 w-4" />,
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
  },
};

const AdminPanel = () => {
  const { members, loading, updateProfile, addRole, removeRole, deleteUser, refetch } = useDbTeam();
  const { isAdmin, loading: profileLoading } = useUserProfile();
  const [selectedMember, setSelectedMember] = useState<TeamMemberWithRole | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'deactivate' | 'delete' | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole | ''>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Search filter function
  const matchesSearch = (member: TeamMemberWithRole) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query)
    );
  };

  // Filter pending users (inactive with no roles)
  const pendingUsers = members.filter(m => !m.is_active && m.roles.length === 0 && matchesSearch(m));
  
  // Filter active users
  const activeUsers = members.filter(m => m.is_active && matchesSearch(m));
  
  // Filter inactive users with roles (deactivated)
  const deactivatedUsers = members.filter(m => !m.is_active && m.roles.length > 0 && matchesSearch(m));
  
  // Counts without search filter for stats
  const pendingCount = members.filter(m => !m.is_active && m.roles.length === 0).length;
  const activeCount = members.filter(m => m.is_active).length;
  const deactivatedCount = members.filter(m => !m.is_active && m.roles.length > 0).length;

  const handleApproveUser = async () => {
    if (!selectedMember || !selectedRole) return;
    
    setIsProcessing(true);
    try {
      // Use atomic RPC function to activate and assign role in single transaction
      const { error } = await supabase.rpc('approve_user_with_role', {
        _user_id: selectedMember.id,
        _role: selectedRole as AppRole
      });
      
      if (error) {
        console.error('Error approving user:', error);
        throw new Error('Failed to approve user');
      }
      
      toast.success(`${selectedMember.name} aprovado como ${roleConfig[selectedRole as AppRole].label}`);
      closeDialog();
      refetch();
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('Erro ao aprovar usuário');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeactivateUser = async () => {
    if (!selectedMember) return;
    
    setIsProcessing(true);
    try {
      const success = await updateProfile(selectedMember.id, { is_active: false });
      if (success) {
        toast.success(`${selectedMember.name} foi desativado`);
        closeDialog();
        refetch();
      }
    } catch (error) {
      console.error('Error deactivating user:', error);
      toast.error('Erro ao desativar usuário');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReactivateUser = async (member: TeamMemberWithRole) => {
    setIsProcessing(true);
    try {
      const success = await updateProfile(member.id, { is_active: true });
      if (success) {
        toast.success(`${member.name} foi reativado`);
        refetch();
      }
    } catch (error) {
      console.error('Error reactivating user:', error);
      toast.error('Erro ao reativar usuário');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRoleChange = async (member: TeamMemberWithRole, newRole: AppRole) => {
    setIsProcessing(true);
    try {
      // Remove all current roles
      for (const role of member.roles) {
        await removeRole(member.id, role);
      }
      // Add new role
      await addRole(member.id, newRole);
      refetch();
    } catch (error) {
      console.error('Error changing role:', error);
      toast.error('Erro ao alterar função');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddRole = async (member: TeamMemberWithRole, role: AppRole) => {
    setIsProcessing(true);
    try {
      await addRole(member.id, role);
      refetch();
    } catch (error) {
      console.error('Error adding role:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveRole = async (member: TeamMemberWithRole, role: AppRole) => {
    setIsProcessing(true);
    try {
      await removeRole(member.id, role);
      refetch();
    } catch (error) {
      console.error('Error removing role:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedMember) return;
    
    setIsProcessing(true);
    try {
      const success = await deleteUser(selectedMember.id);
      if (success) {
        closeDialog();
        refetch();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const closeDialog = () => {
    setSelectedMember(null);
    setActionType(null);
    setSelectedRole('');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading || profileLoading) {
    return (
      <DashboardLayout title="Painel Admin" subtitle="Gerenciamento de usuários e permissões">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin()) {
    return (
      <DashboardLayout title="Acesso Negado" subtitle="Você não tem permissão para acessar esta página">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center min-h-[60vh]"
        >
          <Card className="max-w-md w-full text-center">
            <CardContent className="p-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 mx-auto mb-4">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
              <p className="text-muted-foreground">
                Apenas administradores podem acessar o painel de gerenciamento.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Painel Admin" subtitle="Gerenciamento de usuários e permissões">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{pendingCount}</p>
                    <p className="text-sm text-muted-foreground">Pendentes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activeCount}</p>
                    <p className="text-sm text-muted-foreground">Ativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                    <XCircle className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{deactivatedCount}</p>
                    <p className="text-sm text-muted-foreground">Desativados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{members.length}</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Main Content */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                Pendentes ({pendingUsers.length})
              </TabsTrigger>
              <TabsTrigger value="active" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Ativos ({activeUsers.length})
              </TabsTrigger>
              <TabsTrigger value="deactivated" className="gap-2">
                <XCircle className="h-4 w-4" />
                Desativados ({deactivatedUsers.length})
              </TabsTrigger>
            </TabsList>

            {/* Pending Users Tab */}
            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle>Usuários Aguardando Aprovação</CardTitle>
                  <CardDescription>
                    Novos usuários que precisam de aprovação e atribuição de função
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum usuário pendente de aprovação</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Cadastro</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                  <AvatarImage src={user.avatar_url || undefined} />
                                  <AvatarFallback className="bg-amber-500/10 text-amber-600">
                                    {getInitials(user.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{user.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{user.email}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(user.created_at).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedMember(user);
                                  setActionType('approve');
                                }}
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Aprovar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Active Users Tab */}
            <TabsContent value="active">
              <Card>
                <CardHeader>
                  <CardTitle>Usuários Ativos</CardTitle>
                  <CardDescription>
                    Gerencie funções e permissões dos membros da equipe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activeUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum usuário ativo</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Funções</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                  <AvatarImage src={user.avatar_url || undefined} />
                                  <AvatarFallback className="bg-primary/10 text-primary">
                                    {getInitials(user.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{user.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{user.email}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {user.roles.map((role) => (
                                  <Badge
                                    key={role}
                                    variant="outline"
                                    className={`${roleConfig[role].color} gap-1 pr-1`}
                                  >
                                    {roleConfig[role].icon}
                                    {roleConfig[role].label}
                                    <button
                                      onClick={() => handleRemoveRole(user, role)}
                                      disabled={isProcessing}
                                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                                {user.roles.length === 0 && (
                                  <span className="text-muted-foreground text-sm">Sem função</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Select
                                  value=""
                                  onValueChange={(value) => handleAddRole(user, value as AppRole)}
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Adicionar função" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(['admin', 'installer', 'auxiliary'] as AppRole[])
                                      .filter(role => !user.roles.includes(role))
                                      .map((role) => (
                                        <SelectItem key={role} value={role}>
                                          <div className="flex items-center gap-2">
                                            {roleConfig[role].icon}
                                            {roleConfig[role].label}
                                          </div>
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => {
                                    setSelectedMember(user);
                                    setActionType('deactivate');
                                  }}
                                >
                                  <UserX className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => {
                                    setSelectedMember(user);
                                    setActionType('delete');
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Deactivated Users Tab */}
            <TabsContent value="deactivated">
              <Card>
                <CardHeader>
                  <CardTitle>Usuários Desativados</CardTitle>
                  <CardDescription>
                    Usuários que foram desativados podem ser reativados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {deactivatedUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <UserX className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum usuário desativado</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Funções</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deactivatedUsers.map((user) => (
                          <TableRow key={user.id} className="opacity-60">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                  <AvatarImage src={user.avatar_url || undefined} />
                                  <AvatarFallback className="bg-muted text-muted-foreground">
                                    {getInitials(user.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{user.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{user.email}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {user.roles.map((role) => (
                                  <Badge
                                    key={role}
                                    variant="outline"
                                    className="opacity-50"
                                  >
                                    {roleConfig[role].icon}
                                    {roleConfig[role].label}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReactivateUser(user)}
                                  disabled={isProcessing}
                                >
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Reativar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => {
                                    setSelectedMember(user);
                                    setActionType('delete');
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Approve User Dialog */}
      <Dialog open={actionType === 'approve'} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Usuário</DialogTitle>
            <DialogDescription>
              Selecione a função que será atribuída a {selectedMember?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma função" />
              </SelectTrigger>
              <SelectContent>
                {(['admin', 'installer', 'auxiliary'] as AppRole[]).map((role) => (
                  <SelectItem key={role} value={role}>
                    <div className="flex items-center gap-2">
                      {roleConfig[role].icon}
                      {roleConfig[role].label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button 
              onClick={handleApproveUser} 
              disabled={!selectedRole || isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserCheck className="h-4 w-4 mr-2" />
              )}
              Aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate User Dialog */}
      <Dialog open={actionType === 'deactivate'} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desativar Usuário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja desativar {selectedMember?.name}? 
              O usuário não poderá mais acessar o sistema.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeactivateUser} 
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserX className="h-4 w-4 mr-2" />
              )}
              Desativar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={actionType === 'delete'} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Excluir Usuário Permanentemente</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <strong>{selectedMember?.name}</strong> permanentemente? 
              Esta ação não pode ser desfeita e todos os dados do usuário serão removidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteUser} 
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Excluir Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminPanel;
