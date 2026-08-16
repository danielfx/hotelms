import type { GradedPopulation } from "@/lib/types";
import { formatCompact } from "@/lib/utils";

interface GradedPopulationTableProps {
  data: GradedPopulation[];
}

const companyColors: Record<string, string> = {
  PSA: "text-psa",
  BGS: "text-bgs",
  CGC: "text-cgc",
};

export function GradedPopulationTable({ data }: GradedPopulationTableProps) {
  const grouped = data.reduce(
    (acc, item) => {
      if (!acc[item.company]) acc[item.company] = [];
      acc[item.company].push(item);
      return acc;
    },
    {} as Record<string, GradedPopulation[]>
  );

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([company, grades]) => (
        <div key={company}>
          <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${companyColors[company]}`}>
            {company} Population
          </h4>
          <div className="space-y-2">
            {grades.map((g) => {
              const totalPop = g.population + g.higherGrades;
              const pct = totalPop > 0 ? (g.population / totalPop) * 100 : 0;
              return (
                <div key={`${g.company}-${g.grade}`} className="flex items-center gap-3">
                  <span className="w-10 font-mono text-sm font-medium">{g.grade}</span>
                  <div className="flex-1 h-2 bg-cream-dark overflow-hidden">
                    <div
                      className="h-full bg-accent/60 transition-all duration-500"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <span className="w-16 text-right font-mono text-xs text-ink-muted">
                    {formatCompact(g.population)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
