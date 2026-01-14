import { Wifi, WifiOff, RefreshCw, CloudOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OfflineIndicatorProps {
  isOnline: boolean;
  pendingCount: number;
  syncing: boolean;
  lastSync: Date | null;
  onSync: () => void;
}

export function OfflineIndicator({
  isOnline,
  pendingCount,
  syncing,
  lastSync,
  onSync,
}: OfflineIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Status de conexão */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
              isOnline
                ? 'bg-success/10 text-success'
                : 'bg-destructive/10 text-destructive'
            }`}
          >
            {isOnline ? (
              <Wifi className="h-3.5 w-3.5" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {isOnline ? 'Conectado à internet' : 'Sem conexão - modo offline ativo'}
        </TooltipContent>
      </Tooltip>

      {/* Ações pendentes */}
      {pendingCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="warning" className="gap-1">
              <CloudOff className="h-3 w-3" />
              {pendingCount}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {pendingCount} ação(ões) aguardando sincronização
          </TooltipContent>
        </Tooltip>
      )}

      {/* Botão de sincronização */}
      {isOnline && pendingCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onSync}
              disabled={syncing}
            >
              <RefreshCw
                className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {syncing ? 'Sincronizando...' : 'Sincronizar agora'}
          </TooltipContent>
        </Tooltip>
      )}

      {/* Última sincronização */}
      {lastSync && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-xs text-muted-foreground hidden lg:block">
              Sync: {format(lastSync, 'HH:mm', { locale: ptBR })}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            Última sincronização: {format(lastSync, "dd/MM 'às' HH:mm", { locale: ptBR })}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
