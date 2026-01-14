import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MapPin, 
  Clock, 
  User, 
  Truck, 
  FileText, 
  Camera, 
  PenTool,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  Phone,
  Mail,
  Calendar,
  ClipboardList,
  History,
  Image as ImageIcon,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ServiceOrderAuditLog } from './ServiceOrderAuditLog';
import { useDbServiceOrderProducts } from '@/hooks/useDbServiceOrderProducts';

interface ServiceOrderDetails {
  id: string;
  order_number: string;
  client_name: string;
  client_address: string;
  client_id?: string;
  service_type: string;
  status: 'pending' | 'inProgress' | 'completed' | 'cancelled';
  scheduled_date?: string;
  scheduled_time?: string;
  notes?: string;
  team_lead_id?: string;
  auxiliary_id?: string;
  vehicle_id?: string;
  checklist_template_id?: string;
  completed_checklist?: any;
  created_at: string;
  updated_at?: string;
}

interface ClientInfo {
  name: string;
  phone?: string;
  email?: string;
  address: string;
  city: string;
  state?: string;
  zip_code?: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface Vehicle {
  id: string;
  plate: string;
  model: string;
}

interface Evidence {
  id: string;
  type: string;
  data_url: string;
  latitude?: number;
  longitude?: number;
  captured_at: string;
  notes?: string;
}

interface ServiceOrderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
}

const statusConfig = {
  pending: { label: 'Pendente', variant: 'pending' as const, icon: AlertCircle },
  inProgress: { label: 'Em Andamento', variant: 'inProgress' as const, icon: Clock },
  completed: { label: 'Concluído', variant: 'completed' as const, icon: CheckCircle2 },
  cancelled: { label: 'Cancelado', variant: 'destructive' as const, icon: XCircle },
};

export function ServiceOrderDetailsDialog({
  open,
  onOpenChange,
  orderId,
}: ServiceOrderDetailsDialogProps) {
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<ServiceOrderDetails | null>(null);
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [teamLead, setTeamLead] = useState<TeamMember | null>(null);
  const [auxiliary, setAuxiliary] = useState<TeamMember | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const { products: usedProducts, fetchProducts: fetchUsedProducts } = useDbServiceOrderProducts();

  useEffect(() => {
    if (open && orderId) {
      fetchOrderDetails();
      fetchUsedProducts(orderId);
    }
  }, [open, orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      // Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from('service_orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (orderError || !orderData) {
        console.error('Error fetching order:', orderError);
        setLoading(false);
        return;
      }

      setOrder(orderData as ServiceOrderDetails);

      // Fetch related data in parallel
      const fetchPromises: Promise<void>[] = [];

      // Client
      if (orderData.client_id) {
        const clientPromise = async () => {
          const { data } = await supabase
            .from('clients')
            .select('name, phone, email, address, city, state, zip_code')
            .eq('id', orderData.client_id)
            .maybeSingle();
          setClient(data);
        };
        fetchPromises.push(clientPromise());
      }

      // Team Lead
      if (orderData.team_lead_id) {
        const teamLeadPromise = async () => {
          const { data } = await supabase
            .from('profiles')
            .select('id, name, email, phone')
            .eq('id', orderData.team_lead_id)
            .maybeSingle();
          setTeamLead(data);
        };
        fetchPromises.push(teamLeadPromise());
      }

      // Auxiliary
      if (orderData.auxiliary_id) {
        const auxiliaryPromise = async () => {
          const { data } = await supabase
            .from('profiles')
            .select('id, name, email, phone')
            .eq('id', orderData.auxiliary_id)
            .maybeSingle();
          setAuxiliary(data);
        };
        fetchPromises.push(auxiliaryPromise());
      }

      // Vehicle
      if (orderData.vehicle_id) {
        const vehiclePromise = async () => {
          const { data } = await supabase
            .from('vehicles')
            .select('id, plate, model')
            .eq('id', orderData.vehicle_id)
            .maybeSingle();
          setVehicle(data);
        };
        fetchPromises.push(vehiclePromise());
      }

      // Evidence
      const evidencePromise = async () => {
        const { data } = await supabase
          .from('service_order_evidence')
          .select('*')
          .eq('service_order_id', orderId)
          .order('created_at', { ascending: true });
        setEvidence(data || []);
      };
      fetchPromises.push(evidencePromise());

      await Promise.all(fetchPromises);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const photos = evidence.filter((e) => e.type === 'photo');
  const signature = evidence.find((e) => e.type === 'signature');
  const statusInfo = order ? statusConfig[order.status] : statusConfig.pending;
  const StatusIcon = statusInfo.icon;

  const renderChecklistItem = (item: any, index: number) => {
    const getResponseDisplay = () => {
      switch (item.responseType) {
        case 'yesNo':
          return item.response === true ? (
            <Badge variant="completed" className="gap-1">
              <CheckCircle2 className="h-3 w-3" /> Sim
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3 w-3" /> Não
            </Badge>
          );
        case 'photo':
          return item.response ? (
            <div className="mt-2">
              <img 
                src={item.response} 
                alt={item.label} 
                className="max-w-full h-32 object-cover rounded-md"
              />
            </div>
          ) : (
            <Badge variant="outline">Sem foto</Badge>
          );
        case 'signature':
          return item.response ? (
            <div className="mt-2 bg-white p-2 rounded-md inline-block">
              <img 
                src={item.response} 
                alt="Assinatura" 
                className="max-w-full h-20 object-contain"
              />
            </div>
          ) : (
            <Badge variant="outline">Sem assinatura</Badge>
          );
        default:
          return <span className="text-sm">{String(item.response)}</span>;
      }
    };

    return (
      <div key={index} className="flex flex-col gap-1 py-3 border-b border-border last:border-0">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium">{item.label}</span>
          {item.required && (
            <Badge variant="outline" className="text-xs">Obrigatório</Badge>
          )}
        </div>
        <div className="mt-1">
          {getResponseDisplay()}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Detalhes da OS</span>
            {order && (
              <>
                <Badge variant="outline" className="font-mono">
                  {order.order_number}
                </Badge>
                <Badge variant={statusInfo.variant} className="gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {statusInfo.label}
                </Badge>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">Carregando detalhes...</div>
          </div>
        ) : order ? (
          <Tabs defaultValue="info" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info" className="gap-1">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Informações</span>
              </TabsTrigger>
              <TabsTrigger value="checklist" className="gap-1">
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline">Checklist</span>
              </TabsTrigger>
              <TabsTrigger value="evidence" className="gap-1">
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">Evidências</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Histórico</span>
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 mt-4 overflow-y-scroll max-h-[65vh]">
              <TabsContent value="info" className="m-0 space-y-4 w-full">
                {/* Service Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Informações do Serviço
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-muted-foreground">Tipo de Serviço</span>
                        <p className="font-medium">{order.service_type}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Data Agendada</span>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {order.scheduled_date 
                            ? format(new Date(order.scheduled_date), 'dd/MM/yyyy', { locale: ptBR })
                            : 'Não definida'}
                          {order.scheduled_time && ` às ${order.scheduled_time.slice(0, 5)}`}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-muted-foreground">Criado em</span>
                        <p className="text-sm">
                          {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      {order.updated_at && (
                        <div>
                          <span className="text-xs text-muted-foreground">Última atualização</span>
                          <p className="text-sm">
                            {format(new Date(order.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      )}
                    </div>
                    {order.notes && (
                      <div>
                        <span className="text-xs text-muted-foreground">Observações</span>
                        <p className="text-sm bg-muted/50 p-2 rounded mt-1">{order.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Client Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Informações do Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-xs text-muted-foreground">Nome</span>
                      <p className="font-medium">{client?.name || order.client_name}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm">{client?.address || order.client_address}</p>
                        {client && (
                          <p className="text-sm text-muted-foreground">
                            {client.city}
                            {client.state && `, ${client.state}`}
                            {client.zip_code && ` - ${client.zip_code}`}
                          </p>
                        )}
                      </div>
                    </div>
                    {client && (
                      <div className="flex flex-wrap gap-4">
                        {client.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                        {client.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{client.email}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Team & Vehicle */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Equipe e Veículo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-muted-foreground">Técnico Responsável</span>
                        {teamLead ? (
                          <div className="mt-1">
                            <p className="font-medium">{teamLead.name}</p>
                            <p className="text-xs text-muted-foreground">{teamLead.email}</p>
                            {teamLead.phone && (
                              <p className="text-xs text-muted-foreground">{teamLead.phone}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Não atribuído</p>
                        )}
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Auxiliar</span>
                        {auxiliary ? (
                          <div className="mt-1">
                            <p className="font-medium">{auxiliary.name}</p>
                            <p className="text-xs text-muted-foreground">{auxiliary.email}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Não atribuído</p>
                        )}
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <span className="text-xs text-muted-foreground">Veículo</span>
                      {vehicle ? (
                        <div className="flex items-center gap-2 mt-1">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{vehicle.plate}</span>
                          <span className="text-muted-foreground">-</span>
                          <span>{vehicle.model}</span>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Não atribuído</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Used Products */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Produtos Usados no Serviço
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {usedProducts.length === 0 ? (
                      <span className="text-muted-foreground text-sm">Nenhum produto registrado nesta OS</span>
                    ) : (
                      <ul className="space-y-1">
                        {usedProducts.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span>{item.product_name} ({item.quantity}{item.unit ? ` ${item.unit}` : ''})</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="checklist" className="m-0">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ClipboardList className="h-4 w-4" />
                      Checklist Preenchido
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {order.completed_checklist && 
                     Array.isArray(order.completed_checklist) && 
                     order.completed_checklist.length > 0 ? (
                      <div className="divide-y divide-border">
                        {order.completed_checklist.map((item: any, index: number) => 
                          renderChecklistItem(item, index)
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhum checklist preenchido</p>
                        {order.status !== 'completed' && (
                          <p className="text-sm mt-1">
                            O checklist será preenchido ao finalizar a OS
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="evidence" className="m-0 space-y-4">
                {/* Photos */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      Fotos ({photos.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {photos.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {photos.map((photo) => (
                          <div key={photo.id} className="relative group">
                            <img
                              src={photo.data_url}
                              alt="Evidência"
                              className="w-full h-32 object-cover rounded-lg border border-border"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1.5 rounded-b-lg">
                              {format(new Date(photo.captured_at), 'dd/MM HH:mm', { locale: ptBR })}
                              {photo.latitude && photo.longitude && (
                                <span className="ml-1 opacity-75">
                                  📍
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhuma foto registrada</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Signature */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <PenTool className="h-4 w-4" />
                      Assinatura do Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {signature ? (
                      <div className="space-y-2">
                        <div className="bg-white p-4 rounded-lg border border-border inline-block">
                          <img
                            src={signature.data_url}
                            alt="Assinatura do cliente"
                            className="max-w-full h-24 object-contain"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Capturada em {format(new Date(signature.captured_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                        {signature.notes && (
                          <p className="text-sm bg-muted/50 p-2 rounded">{signature.notes}</p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <PenTool className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhuma assinatura registrada</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="m-0 w-full">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Histórico de Alterações
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ServiceOrderAuditLog serviceOrderId={orderId} />
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Ordem de serviço não encontrada
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
