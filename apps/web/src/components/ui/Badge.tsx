import { cn } from "@/lib/utils";

interface BadgeProps {
  label: string;
  bg: string;
  text: string;
  dot?: string;
  className?: string;
}

export function Badge({ label, bg, text, dot, className }: BadgeProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold", className)}
      style={{ background: bg, color: text }}>
      {dot && <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: dot }} />}
      {label}
    </span>
  );
}
