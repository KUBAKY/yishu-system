import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary:
        "bg-[linear-gradient(135deg,var(--color-gold-dark),var(--color-gold-light))] text-[var(--color-xuanqing)] hover:brightness-110 shadow-[0_10px_24px_rgba(168,132,59,0.28)]",
      outline:
        "border border-[var(--color-gold-line)] text-[var(--color-gold-light)] hover:bg-[var(--color-gold-glow)] hover:border-[var(--color-gold-light)]",
      ghost: "text-[var(--color-xuanpaper)] hover:bg-white/5",
    };

    const sizes = {
      sm: "px-3.5 py-2 text-sm",
      md: "px-6 py-2.5 text-base",
      lg: "px-8 py-3.5 text-lg font-bold",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
