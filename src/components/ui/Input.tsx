import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type = "text", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-xuanpaper/70">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-11 w-full bg-transparent px-3 py-2 text-sm text-xuanpaper",
            "border-b border-gold-line/50",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-xuanpaper/30",
            "focus-visible:outline-none focus-visible:border-gold-light focus-visible:shadow-[inset_0_-1px_0_rgba(168,132,59,0.8)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-all duration-200",
            error && "border-red-500/50 focus-visible:border-red-500 focus-visible:shadow-[inset_0_-1px_0_rgba(239,68,68,0.8)]",
            className
          )}
          ref={ref}
          {...props}
        />
        {(error || helperText) && (
          <p
            className={cn(
              "text-xs mt-1",
              error ? "text-red-400" : "text-xuanpaper/50"
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
