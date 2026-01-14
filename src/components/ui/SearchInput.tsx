import { useSearch } from "@/hooks/useSearch";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";

export function SearchInput() {
  const { searchTerm, setSearchTerm } = useSearch();
  const navigate = useNavigate();

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && searchTerm.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(searchTerm)}`);
    }
  }

  return (
    <Input
      placeholder="Buscar..."
      className="w-64 pl-9 bg-muted/50 border-transparent focus:border-primary focus:bg-background"
      value={searchTerm}
      onChange={e => setSearchTerm(e.target.value)}
      onKeyDown={handleKeyDown}
    />
  );
}
