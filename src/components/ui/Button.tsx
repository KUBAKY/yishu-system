"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "variant" | "size"> {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary:
        "bg-[var(--color-xuanqing)] text-[var(--color-gold-light)] border border-[var(--color-gold-dark)] shadow-[0_4px_12px_rgba(168,132,59,0.15)]",
      outline:
        "border border-[var(--color-gold-line)] text-[var(--color-gold-light)] hover:bg-[var(--color-gold-glow)] hover:border-[var(--color-gold-light)]",
      ghost: "text-[var(--color-xuanpaper)] hover:bg-white/5",
    };

    const sizes = {
      sm: "px-3.5 py-2 text-sm",
      md: "px-6 py-2.5 text-base",
      lg: "px-8 py-3.5 text-lg font-bold",
    };

    const tapAnimation =
      variant === "primary"
        ? { scale: 0.95, filter: "brightness(1.2) drop-shadow(0 0 8px rgba(159,42,34,0.6))" }
        : { scale: 0.95 };

    return (
      <motion.button
        ref={ref}
        whileTap={tapAnimation}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className={cn(
          "inline-flex items-center justify-center rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:pointer-events-none",
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
