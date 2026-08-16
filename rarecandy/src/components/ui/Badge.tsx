import { clsx } from "clsx";
import type { GradeCompany } from "@/lib/types";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "success" | "danger" | "outline";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase",
        {
          "bg-cream-dark text-ink-muted": variant === "default",
          "bg-accent/10 text-accent": variant === "accent",
          "bg-success/10 text-success": variant === "success",
          "bg-danger/10 text-danger": variant === "danger",
          "border border-border text-ink-muted": variant === "outline",
        },
        className
      )}
    >
      {children}
    </span>
  );
}

interface GradeBadgeProps {
  company: GradeCompany;
  grade: string;
  size?: "sm" | "md";
}

const companyColors: Record<GradeCompany, string> = {
  PSA: "bg-psa text-white",
  BGS: "bg-bgs text-white",
  CGC: "bg-cgc text-white",
};

export function GradeBadge({ company, grade, size = "sm" }: GradeBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 font-mono font-medium",
        companyColors[company],
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-sm"
      )}
    >
      <span className="opacity-80">{company}</span>
      <span>{grade}</span>
    </span>
  );
}
