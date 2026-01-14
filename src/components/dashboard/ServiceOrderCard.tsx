import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, User, Truck, History, Pencil, Trash2, Eye } from "lucide-react";
import { ServiceOrderActions } from "@/components/serviceOrders/ServiceOrderActions";
import { ServiceOrderAuditLog } from "@/components/serviceOrders/ServiceOrderAuditLog";
import { ServiceOrderDetailsDialog } from "@/components/serviceOrders/ServiceOrderDetailsDialog";
import ReassignServiceOrderDialog from '@/components/serviceOrders/ReassignServiceOrderDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

export interface ServiceOrder {
  id: string;
  dbId?: string; // ID real do banco para auditoria
  client: string;
  address: string;
  status: "pending" | "inProgress" | "completed" | "cancelled";
  team: string;
  vehicle: string;
  scheduledTime: string;
  type: string;
  checklistTemplateId?: string;
}

const statusConfig = {
  pending: { label: "Pendente", variant: "pending" as const },
  inProgress: { label: "Em Andamento", variant: "inProgress" as const },
  completed: { label: "Concluído", variant: "completed" as const },
  cancelled: { label: "Cancelado", variant: "destructive" as const },
};

interface ServiceOrderCardProps {
  order: ServiceOrder;
  delay?: number;
  onStartOrder?: (orderId: string, notes?: string) => Promise<boolean>;
  onFinishOrder?: (orderId: string, notes?: string) => Promise<boolean>;
  onEdit?: (orderId: string) => void;
  onDelete?: (orderId: string) => Promise<boolean>;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function ServiceOrderCard({ 
  order, 
  delay = 0,
  onStartOrder,
  onFinishOrder,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}: ServiceOrderCardProps) {
  const status = statusConfig[order.status] || statusConfig.pending;
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete || !order.dbId) return;
    setDeleting(true);
    const success = await onDelete(order.dbId);
    setDeleting(false);
    if (success) {
      setDeleteDialogOpen(false);
    }
  };

  const showActions = onEdit || onDelete;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay }}
      >
        <Card variant="interactive" className="group">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{order.id}</CardTitle>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{order.type}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon-sm" 
                  onClick={() => setDetailsDialogOpen(true)}
                  title="Ver detalhes"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                
                {showActions && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setDetailsDialogOpen(true)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setAuditDialogOpen(true)}>
                        <History className="h-4 w-4 mr-2" />
                        Histórico
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setReassignDialogOpen(true)}>
                        <User className="h-4 w-4 mr-2" />
                        Reatribuir
                      </DropdownMenuItem>
                      {onEdit && canEdit && order.status !== 'completed' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onEdit(order.dbId || order.id)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                        </>
                      )}
                      {onDelete && canDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setDeleteDialogOpen(true)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{order.client}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline"
              >
                <span className="truncate">{order.address}</span>
              </a>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{order.scheduledTime}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5" />
                  <span>{order.vehicle}</span>
                </div>
              </div>
              <div className="flex -space-x-2">
                <div className="h-6 w-6 rounded-full bg-primary/10 border-2 border-card flex items-center justify-center">
                  <span className="text-[10px] font-medium text-primary">
                    {order.team.charAt(0)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Ações de iniciar/finalizar */}
            {onStartOrder && onFinishOrder && (
              <div className="pt-2 border-t border-border">
                <ServiceOrderActions
                  orderId={order.dbId || order.id}
                  status={order.status}
                  checklistTemplateId={order.checklistTemplateId}
                  onStartOrder={onStartOrder}
                  onFinishOrder={onFinishOrder}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialog de auditoria */}
      <Dialog open={auditDialogOpen} onOpenChange={setAuditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Histórico - {order.id}</DialogTitle>
          </DialogHeader>
          <ServiceOrderAuditLog serviceOrderId={order.dbId || order.id} />
        </DialogContent>
      </Dialog>

      {/* Dialog de detalhes completos */}
      <ServiceOrderDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        orderId={order.dbId || order.id}
      />

      {/* Dialog de reatribuição */}
      <ReassignServiceOrderDialog
        open={reassignDialogOpen}
        onOpenChange={setReassignDialogOpen}
        orderId={order.dbId || order.id}
      />

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Ordem de Serviço</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a ordem <strong>{order.id}</strong>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
