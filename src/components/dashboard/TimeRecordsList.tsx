import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  LogIn, 
  LogOut, 
  Coffee, 
  MapPin,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export interface TimeRecord {
  id: string;
  user: string;
  type: "entry" | "lunchOut" | "lunchReturn" | "exit";
  time: string;
  location: string;
  validated: boolean;
}

const recordTypeConfig = {
  entry: { 
    label: "Entrada", 
    icon: LogIn, 
    color: "text-success",
    bgColor: "bg-success/10"
  },
  lunchOut: { 
    label: "Saída Almoço", 
    icon: Coffee, 
    color: "text-warning",
    bgColor: "bg-warning/10"
  },
  lunchReturn: { 
    label: "Retorno Almoço", 
    icon: Coffee, 
    color: "text-info",
    bgColor: "bg-info/10"
  },
  exit: { 
    label: "Saída", 
    icon: LogOut, 
    color: "text-destructive",
    bgColor: "bg-destructive/10"
  },
};

interface TimeRecordItemProps {
  record: TimeRecord;
  delay?: number;
}

export function TimeRecordItem({ record, delay = 0 }: TimeRecordItemProps) {
  const config = recordTypeConfig[record.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.bgColor}`}>
        <Icon className={`h-5 w-5 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{record.user}</span>
          <Badge variant="outline" className="text-xs">
            {config.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{record.time}</span>
          <span className="text-muted-foreground/50">•</span>
          <MapPin className="h-3 w-3" />
          <span className="truncate">{record.location}</span>
        </div>
      </div>
      <div className="flex-shrink-0">
        {record.validated ? (
          <CheckCircle className="h-5 w-5 text-success" />
        ) : (
          <AlertCircle className="h-5 w-5 text-warning" />
        )}
      </div>
    </motion.div>
  );
}

interface TimeRecordsListProps {
  records: TimeRecord[];
}

export function TimeRecordsList({ records }: TimeRecordsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Registros de Ponto Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {records.map((record, index) => (
            <TimeRecordItem key={record.id} record={record} delay={index * 0.05} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
