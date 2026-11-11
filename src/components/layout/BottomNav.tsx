"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/config/navigation";

export function BottomNav() {
  const pathname = usePathname();

  // We only show a subset of primary items in the bottom nav to avoid clutter
  const primaryItems = NAV_ITEMS.slice(0, 5);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-white border-t border-slate-200 dark:bg-slate-900 dark:border-slate-800 px-4 py-2">
        <nav className="flex items-center justify-around">
          {primaryItems.map((item) => {
            const Icon = (Icons as any)[item.icon];
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-colors",
                  isActive
                    ? "text-blue-600"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                )}
              >
                {Icon && <Icon size={20} />}
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
