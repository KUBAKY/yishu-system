import React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  maxLength?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, maxLength, value, onChange, ...props }, ref) => {
    // Handling character count if maxLength is provided
    const textLength = typeof value === 'string' ? value.length : 0;
    
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <div className="flex justify-between items-end">
            <label className="text-sm font-medium text-xuanpaper/70">
              {label}
            </label>
            {maxLength && (
              <span className="text-xs text-xuanpaper/40">
                {textLength}/{maxLength}
              </span>
            )}
          </div>
        )}
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md bg-xuangray px-3 py-2 text-sm text-xuanpaper",
            "border border-gold-line/30",
            "placeholder:text-xuanpaper/30",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-light focus-visible:border-gold-light",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors duration-200 resize-none",
            error && "border-red-500/50 focus-visible:ring-red-500/50 focus-visible:border-red-500/50",
            className
          )}
          ref={ref}
          maxLength={maxLength}
          value={value}
          onChange={onChange}
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
Textarea.displayName = "Textarea";

export { Textarea };
