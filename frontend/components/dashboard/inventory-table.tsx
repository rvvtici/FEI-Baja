import { ArrowRightLeft } from "lucide-react";

interface InventoryTableProps {
  items: any[]; 
  onMovimentarClick: (item: any) => void; 
}

export function InventoryTable({ items, onMovimentarClick }: InventoryTableProps) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-foreground">
          {/* Cabeçalho ( futura área da filtragem ) */}
          <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Código</th>
              <th className="px-4 py-2.5 font-semibold">Nome da Peça</th>
              <th className="px-4 py-2.5 font-semibold">Categoria</th>
              <th className="px-4 py-2.5 font-semibold">Estoque</th>
              <th className="px-15 py-2.5 font-semibold text-right">Ação</th>
            </tr>
          </thead>

        {/* Corpo */}
          <tbody className="divide-y divide-border">
            {items.slice(0, 5).map((item) => (
              <tr key={item.id} className="bg-background hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                  {item.code}
                </td>
                <td className="px-6 py-4 font-medium">
                  {item.name}
                </td>
                <td className="px-6 py-4">
                  {item.category_name || "Geral"}
                </td>
                <td className="px-6 py-4">
                  <span className={`font-bold ${item.qty <= item.minimum_qty ? 'text-red-500' : 'text-green-500'}`}>
                    {item.qty} un
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => onMovimentarClick(item)}
                    className="inline-flex items-center gap-2 font-medium text-[#254EDb] hover:underline"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    Movimentar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}