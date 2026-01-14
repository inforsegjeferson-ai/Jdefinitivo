import { useSearch } from "@/hooks/useSearch";
import { useEffect, useState } from "react";
import { useOfflineServiceOrders } from "@/hooks/useOfflineServiceOrders";
import { useDbClients } from "@/hooks/useDbClients";
import { useDbProducts } from "@/hooks/useDbProducts";
import { useDbChecklists } from "@/hooks/useDbChecklists";

export default function SearchResults() {
  const { searchTerm } = useSearch();
  const { orders } = useOfflineServiceOrders();
  const { clients } = useDbClients();
  const { products } = useDbProducts();
  const { executions } = useDbChecklists();
  const [query, setQuery] = useState("");

  useEffect(() => {
    setQuery(searchTerm);
  }, [searchTerm]);

  // Filtros simples (pode ser expandido)
  const filteredOrders = orders.filter(o =>
    o.order_number?.toLowerCase().includes(query.toLowerCase()) ||
    o.client_name?.toLowerCase().includes(query.toLowerCase()) ||
    o.service_type?.toLowerCase().includes(query.toLowerCase()) ||
    o.notes?.toLowerCase().includes(query.toLowerCase())
  );
  const filteredClients = clients.filter(c =>
    c.name?.toLowerCase().includes(query.toLowerCase()) ||
    c.email?.toLowerCase().includes(query.toLowerCase())
  );
  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(query.toLowerCase()) ||
    p.sku?.toLowerCase().includes(query.toLowerCase())
  );
  const filteredChecklists = executions.filter(c =>
    c.templateName?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Resultados para "{query}"</h1>
      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold mb-2">Ordens de Serviço</h2>
          {filteredOrders.length === 0 ? <p className="text-muted-foreground">Nenhuma ordem encontrada.</p> : (
            <ul className="list-disc ml-6">
              {filteredOrders.map(o => <li key={o.id}>{o.order_number} - {o.client_name} ({o.service_type})</li>)}
            </ul>
          )}
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">Clientes</h2>
          {filteredClients.length === 0 ? <p className="text-muted-foreground">Nenhum cliente encontrado.</p> : (
            <ul className="list-disc ml-6">
              {filteredClients.map(c => <li key={c.id}>{c.name || c.email}</li>)}
            </ul>
          )}
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">Produtos</h2>
          {filteredProducts.length === 0 ? <p className="text-muted-foreground">Nenhum produto encontrado.</p> : (
            <ul className="list-disc ml-6">
              {filteredProducts.map(p => <li key={p.id}>{p.name || p.sku}</li>)}
            </ul>
          )}
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">Checklists</h2>
          {filteredChecklists.length === 0 ? <p className="text-muted-foreground">Nenhum checklist encontrado.</p> : (
            <ul className="list-disc ml-6">
              {filteredChecklists.map(c => <li key={c.id}>{c.templateName}</li>)}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
