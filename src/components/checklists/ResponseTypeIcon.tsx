import { 
  CheckCircle2, 
  Camera, 
  PenTool, 
  Type, 
  Hash, 
  List 
} from "lucide-react";
import { ResponseType } from "@/types/checklist";

interface ResponseTypeIconProps {
  type: ResponseType;
  className?: string;
}

export const ResponseTypeIcon = ({ type, className = "h-4 w-4" }: ResponseTypeIconProps) => {
  const icons: Record<ResponseType, React.ReactNode> = {
    yes_no: <CheckCircle2 className={className} />,
    photo: <Camera className={className} />,
    signature: <PenTool className={className} />,
    text: <Type className={className} />,
    number: <Hash className={className} />,
    select: <List className={className} />,
  };

  return <>{icons[type]}</>;
};

export const responseTypeLabels: Record<ResponseType, string> = {
  yes_no: 'Sim/Não',
  photo: 'Foto',
  signature: 'Assinatura',
  text: 'Texto',
  number: 'Número',
  select: 'Seleção',
};
