"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    name: "推演",
    path: "/start",
    icon: (isActive: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isActive ? "1" : "2"} strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path>
      </svg>
    )
  },
  {
    name: "案例",
    path: "/cases",
    icon: (isActive: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isActive ? "1" : "2"} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
      </svg>
    )
  },
  {
    name: "罗盘",
    path: "/tools/compass",
    icon: (isActive: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isActive ? "1" : "2"} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
      </svg>
    )
  },
  {
    name: "我的",
    path: "/account",
    icon: (isActive: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isActive ? "1" : "2"} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    )
  }
];

export function TabBar() {
  const pathname = usePathname();

  // Hide TabBar on landing page
  if (pathname === "/") {
    return null;
  }

  return (
    <>
      {/* Spacer for bottom padding */}
      <div className="h-16 w-full" aria-hidden="true" />
      
      {/* Fixed TabBar */}
      <div className="fixed bottom-0 left-0 z-40 w-full h-16 bg-xuanbg/80 backdrop-blur-md border-t border-gold-line/20 safe-area-bottom">
        <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(item.path + "/");
            return (
              <Link
                key={item.path}
                href={item.path}
                className="inline-flex flex-col items-center justify-center px-5 hover:bg-white/5 transition-colors group"
              >
                <div className={cn(
                  "mb-1 transition-all duration-300",
                  isActive ? "text-gold-light scale-110" : "text-xuanpaper/50 group-hover:text-xuanpaper/80"
                )}>
                  {item.icon(isActive)}
                </div>
                <span className={cn(
                  "text-[10px]",
                  isActive ? "text-gold-light font-bold" : "text-xuanpaper/50 group-hover:text-xuanpaper/80"
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
