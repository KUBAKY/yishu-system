import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

export function Card({ className, glow = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-xuangray/95 border border-gold-line p-6 transition-all duration-300 backdrop-blur-sm",
        glow && "shadow-[0_0_24px_rgba(140,106,42,0.18)] hover:shadow-[0_0_36px_rgba(140,106,42,0.35)]",
        className
      )}
      {...props}
    >
      {glow && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,132,59,0.15)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("relative z-10 mb-4 flex items-center gap-3", className)} {...props}>{children}</div>;
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("relative z-10 text-xuanpaper/80 leading-relaxed", className)} {...props}>{children}</div>;
}
