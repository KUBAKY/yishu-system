"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface SelectProps {
  label?: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
}

export function Select({
  label,
  options,
  value,
  onChange,
  placeholder = "请选择",
  error,
  className
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("flex flex-col gap-1.5 w-full relative", className)} ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-xuanpaper/70">
          {label}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-md bg-xuangray px-3 py-2 text-sm",
          "border border-gold-line/30",
          "focus:outline-none focus:ring-1 focus:ring-gold-light focus:border-gold-light",
          "transition-colors duration-200",
          error && "border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50",
          selectedOption ? "text-xuanpaper" : "text-xuanpaper/30"
        )}
      >
        <span className="truncate">{selectedOption?.label || placeholder}</span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" height="16" 
          viewBox="0 0 24 24" fill="none" 
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
          className={cn("transition-transform duration-200", isOpen && "rotate-180")}
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full z-50 rounded-md bg-xuangray border border-gold-line/20 shadow-lg overflow-hidden max-h-60 overflow-y-auto">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "w-full text-left px-3 py-2 text-sm transition-colors",
                  option.value === value 
                    ? "bg-gold-dark/20 text-gold-light" 
                    : "text-xuanpaper hover:bg-white/5"
                )}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
            {options.length === 0 && (
              <div className="px-3 py-2 text-sm text-xuanpaper/50 text-center">
                无可用选项
              </div>
            )}
          </div>
        </div>
      )}
      
      {error && (
        <p className="text-xs mt-1 text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
