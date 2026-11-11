"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/config/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";

export function SidebarContent() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const { workspace } = useWorkspace();

  const initials = (user?.userName || "User")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
          P
        </div>
        <span className="text-xl font-bold text-white tracking-tight truncate">
          Pitret SaaS
        </span>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = (Icons as any)[item.icon];
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                isActive
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-800 hover:text-white"
              )}
            >
              {Icon && <Icon size={18} />}
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-4">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50">
          <div className="flex items-center gap-3 truncate">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-white">
              {initials}
            </div>
            <div className="truncate">
              <p className="text-sm font-medium text-white truncate">
                {user?.userName || "User"}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {workspace?.name || user?.role || "Member"}
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-slate-400 hover:text-white hover:bg-slate-800"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-slate-400 hover:text-white hover:bg-slate-800"
          onClick={logout}
        >
          <LogOut size={18} />
          <span>Log out</span>
        </Button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [width, setWidth] = useState(256);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (!isResizing) return;

    const onMouseMove = (e: MouseEvent) => {
      setWidth(e.clientX);
    };

    const onMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [isResizing]);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  return (
    <aside
      style={{ width: `${width}px` }}
      className="relative hidden md:flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800 transition-none"
    >
      <SidebarContent />
      <div
        onMouseDown={startResizing}
        className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors z-50"
      />
    </aside>
  );
}
