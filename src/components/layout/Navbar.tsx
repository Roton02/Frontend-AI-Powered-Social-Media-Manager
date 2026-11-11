"use client";

import React from "react";
import Link from "next/link";
import { Bell, Search, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";

export function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user } = useAuth();

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden mr-2"
          onClick={onMenuClick}
        >
          <Menu size={24} />
        </Button>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="Search messages, posts, or customers..."
            className="pl-10 bg-slate-50 border-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/notifications">
          <Button variant="ghost" size="icon" className="relative">
            <Bell size={20} className="text-slate-600" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </Button>
        </Link>
        <div className="hidden sm:block h-8 w-px bg-slate-200 mx-2"></div>
        <Link href="/profile">
          <Button variant="ghost" className="flex items-center gap-2 px-3 py-2">
            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
              <User size={14} className="text-slate-500" />
            </div>
            <span className="text-sm font-medium text-slate-700 hidden sm:inline">
              {user?.userName || "My Account"}
            </span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
