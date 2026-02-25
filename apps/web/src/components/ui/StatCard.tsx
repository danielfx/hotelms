interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}

export function StatCard({ icon, label, value, sub, accent = "#3B82F6" }: StatCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
        <span className="text-xl rounded-xl p-1.5" style={{ background: accent + "18" }}>{icon}</span>
      </div>
      <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}
