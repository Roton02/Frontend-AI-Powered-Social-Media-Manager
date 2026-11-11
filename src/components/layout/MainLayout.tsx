"use client";

import React, { useState } from "react";
import { Sidebar, SidebarContent } from "./Sidebar";
import { Navbar } from "./Navbar";
import { BottomNav } from "./BottomNav";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        <BottomNav />

        {/* Mobile Sidebar Drawer */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-72 bg-slate-900 text-slate-300">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
