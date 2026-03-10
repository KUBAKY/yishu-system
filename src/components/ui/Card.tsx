import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

export function Card({ className, glow = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-(--color-xuangray)/95 border border-gold-line/35 p-6 transition-all duration-300 backdrop-blur-sm",
        glow && "shadow-[0_0_24px_rgba(140,106,42,0.18)] hover:shadow-[0_0_36px_rgba(140,106,42,0.28)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 flex items-center gap-3", className)} {...props}>{children}</div>;
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-xuanpaper/80 leading-relaxed", className)} {...props}>{children}</div>;
}
