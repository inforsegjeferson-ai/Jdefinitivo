import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { DbServiceOrder, ServiceOrderStatus } from '@/hooks/useDbServiceOrders';

interface PendingAction {
  id: string;
  type: 'start' | 'finish' | 'update';
  orderId: string;
  data?: Partial<DbServiceOrder>;
  notes?: string;
  timestamp: number;
}

interface OfflineDB extends DBSchema {
  serviceOrders: {
    key: string;
    value: DbServiceOrder;
    indexes: { 'by-status': ServiceOrderStatus };
  };
  pendingActions: {
    key: string;
    value: PendingAction;
    indexes: { 'by-timestamp': number };
  };
  syncMeta: {
    key: string;
    value: { key: string; lastSync: number };
  };
}

const DB_NAME = 'jsolar-offline';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<OfflineDB> | null = null;

export const getOfflineDb = async (): Promise<IDBPDatabase<OfflineDB>> => {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<OfflineDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store para ordens de serviço
      if (!db.objectStoreNames.contains('serviceOrders')) {
        const orderStore = db.createObjectStore('serviceOrders', { keyPath: 'id' });
        orderStore.createIndex('by-status', 'status');
      }

      // Store para ações pendentes (fila de sincronização)
      if (!db.objectStoreNames.contains('pendingActions')) {
        const actionStore = db.createObjectStore('pendingActions', { keyPath: 'id' });
        actionStore.createIndex('by-timestamp', 'timestamp');
      }

      // Metadados de sincronização
      if (!db.objectStoreNames.contains('syncMeta')) {
        db.createObjectStore('syncMeta', { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
};

// Salvar ordens no cache local
export const cacheServiceOrders = async (orders: DbServiceOrder[]): Promise<void> => {
  const db = await getOfflineDb();
  const tx = db.transaction('serviceOrders', 'readwrite');
  
  await Promise.all([
    ...orders.map(order => tx.store.put(order)),
    tx.done,
  ]);

  // Atualizar timestamp de última sincronização
  await db.put('syncMeta', { key: 'lastSync', lastSync: Date.now() });
};

// Buscar ordens do cache
export const getCachedOrders = async (): Promise<DbServiceOrder[]> => {
  const db = await getOfflineDb();
  return db.getAll('serviceOrders');
};

// Buscar uma ordem específica
export const getCachedOrder = async (orderId: string): Promise<DbServiceOrder | undefined> => {
  const db = await getOfflineDb();
  return db.get('serviceOrders', orderId);
};

// Atualizar uma ordem no cache
export const updateCachedOrder = async (order: DbServiceOrder): Promise<void> => {
  const db = await getOfflineDb();
  await db.put('serviceOrders', order);
};

// Adicionar ação pendente para sincronização
export const addPendingAction = async (
  type: 'start' | 'finish' | 'update',
  orderId: string,
  data?: Partial<DbServiceOrder>,
  notes?: string
): Promise<void> => {
  const db = await getOfflineDb();
  const action: PendingAction = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    orderId,
    data,
    notes,
    timestamp: Date.now(),
  };
  await db.add('pendingActions', action);
};

// Buscar todas as ações pendentes
export const getPendingActions = async (): Promise<PendingAction[]> => {
  const db = await getOfflineDb();
  return db.getAllFromIndex('pendingActions', 'by-timestamp');
};

// Remover ação pendente após sincronização
export const removePendingAction = async (actionId: string): Promise<void> => {
  const db = await getOfflineDb();
  await db.delete('pendingActions', actionId);
};

// Obter contagem de ações pendentes
export const getPendingActionsCount = async (): Promise<number> => {
  const db = await getOfflineDb();
  return db.count('pendingActions');
};

// Obter última sincronização
export const getLastSyncTime = async (): Promise<number | null> => {
  const db = await getOfflineDb();
  const meta = await db.get('syncMeta', 'lastSync');
  return meta?.lastSync || null;
};

// Limpar todo o cache
export const clearOfflineCache = async (): Promise<void> => {
  const db = await getOfflineDb();
  await db.clear('serviceOrders');
  await db.clear('pendingActions');
  await db.clear('syncMeta');
};
