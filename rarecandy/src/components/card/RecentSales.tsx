import type { RecentSale } from "@/lib/types";
import { formatPrice, formatDate } from "@/lib/utils";
import { GradeBadge } from "@/components/ui/Badge";

interface RecentSalesProps {
  sales: RecentSale[];
}

export function RecentSalesTable({ sales }: RecentSalesProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wider text-ink-faint font-body">
              Date
            </th>
            <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wider text-ink-faint font-body">
              Price
            </th>
            <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wider text-ink-faint font-body">
              Grade
            </th>
            <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-ink-faint font-body">
              Platform
            </th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <tr key={sale.id} className="border-b border-border/50 hover:bg-cream-dark/50 transition-colors">
              <td className="py-3 pr-4 text-ink-muted">{formatDate(sale.date)}</td>
              <td className="py-3 pr-4 font-mono font-medium">{formatPrice(sale.price)}</td>
              <td className="py-3 pr-4">
                {sale.company && sale.grade ? (
                  <GradeBadge company={sale.company} grade={sale.grade} />
                ) : (
                  <span className="text-ink-muted text-xs">{sale.condition ?? "Raw"}</span>
                )}
              </td>
              <td className="py-3 text-ink-muted">{sale.platform}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
