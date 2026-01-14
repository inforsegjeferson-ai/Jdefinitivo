import { DashboardLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Construction
} from "lucide-react";
import { motion } from "framer-motion";

interface PlaceholderPageProps {
  title: string;
  subtitle: string;
}

const PlaceholderPage = ({ title, subtitle }: PlaceholderPageProps) => {
  return (
    <DashboardLayout title={title} subtitle={subtitle}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center min-h-[60vh]"
      >
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-solar mx-auto mb-4">
              <Construction className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Em Desenvolvimento</h2>
            <p className="text-muted-foreground">
              Esta funcionalidade está sendo desenvolvida e estará disponível em breve.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export const Configuracoes = () => <PlaceholderPage title="Configurações" subtitle="Configurações do sistema" />;
