import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, RequireAuth } from "@/hooks/useAuth";
import { SearchProvider } from "@/hooks/useSearch";
import Index from "./pages/Index";
import RelatorioPonto from "./pages/RelatorioPonto";
import Auth from "./pages/Auth";
import OrdensServico from "./pages/OrdensServico";
import PontoEletronico from "./pages/PontoEletronico";
import Equipe from "./pages/Equipe";
import Frota from "./pages/Frota";
import Estoque from "./pages/Estoque";
import PDV from "./pages/PDV";
import Checklists from "./pages/Checklists";
import Locais from "./pages/Locais";
import Clientes from "./pages/Clientes";
import AdminPanel from "./pages/AdminPanel";

import Agenda from "./pages/Agenda";
import NotFound from "./pages/NotFound";
import ServiceOrdersMapPage from "./pages/ServiceOrdersMapPage";
import SearchResults from "./pages/SearchResults";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SearchProvider>
            <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<RequireAuth><Index /></RequireAuth>} />
            <Route path="/ordens" element={<RequireAuth><OrdensServico /></RequireAuth>} />
            <Route path="/ponto" element={<RequireAuth><PontoEletronico /></RequireAuth>} />
            <Route path="/equipe" element={<RequireAuth><Equipe /></RequireAuth>} />
            <Route path="/frota" element={<RequireAuth><Frota /></RequireAuth>} />
            <Route path="/estoque" element={<RequireAuth><Estoque /></RequireAuth>} />
            <Route path="/pdv" element={<RequireAuth><PDV /></RequireAuth>} />
            <Route path="/agenda" element={<RequireAuth><Agenda /></RequireAuth>} />
            <Route path="/checklists" element={<RequireAuth><Checklists /></RequireAuth>} />
            <Route path="/locais" element={<RequireAuth><Locais /></RequireAuth>} />
            <Route path="/clientes" element={<RequireAuth><Clientes /></RequireAuth>} />
            <Route path="/configuracoes" element={<RequireAuth><AdminPanel /></RequireAuth>} />
            <Route path="/mapa-servicos" element={<RequireAuth><ServiceOrdersMapPage /></RequireAuth>} />
            <Route path="/relatorio-ponto" element={<RequireAuth><RelatorioPonto /></RequireAuth>} />
            <Route path="/buscar" element={<RequireAuth><SearchResults /></RequireAuth>} />
            <Route path="*" element={<NotFound />} />
            </Routes>
          </SearchProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
