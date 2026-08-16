import { clsx } from "clsx";
import { forwardRef, type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center font-medium transition-all duration-200",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          "disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-ink text-cream hover:bg-ink/90 active:scale-[0.98]":
              variant === "primary",
            "bg-cream-dark text-ink hover:bg-border active:scale-[0.98]":
              variant === "secondary",
            "text-ink hover:bg-cream-dark/80": variant === "ghost",
            "border border-border-strong text-ink hover:border-ink hover:bg-surface":
              variant === "outline",
            "text-sm px-3 py-1.5 gap-1.5": size === "sm",
            "text-sm px-5 py-2.5 gap-2": size === "md",
            "text-base px-7 py-3.5 gap-2.5": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
