export type ResponseType = 'yes_no' | 'photo' | 'signature' | 'text' | 'number' | 'select';

export interface ChecklistItemTemplate {
  id: string;
  label: string;
  responseType: ResponseType;
  required: boolean;
  options?: string[]; // For select type
  order: number;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  items: ChecklistItemTemplate[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface ChecklistItemResponse {
  itemId: string;
  value: string | boolean | number | null;
  photoUrl?: string;
  signatureUrl?: string;
  timestamp: Date;
  gpsLocation?: {
    latitude: number;
    longitude: number;
  };
}

export interface ChecklistExecution {
  id: string;
  templateId: string;
  templateName: string;
  serviceOrderId?: string;
  executedBy: string;
  responses: ChecklistItemResponse[];
  status: 'pending' | 'in_progress' | 'completed';
  startedAt: Date;
  completedAt?: Date;
}
