"use client";

import { ReactNode, useState } from "react";
import Sidebar from "@/components/mycomponents/Sidebar";
import Header from "@/components/mycomponents/Header";
import GlassBackground from "@/components/ui/GlassBackground";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="relative min-h-screen">

      {/* ✅ BACKGROUND GLOBAL */}
      <GlassBackground />

      {/* SIDEBAR */}
      <Sidebar open={open} />

      {/* MAIN */}
      <div
        className={`flex flex-col transition-all duration-300
        ${open ? "ml-64" : "ml-20"}`}
      >
        {/* HEADER */}
        <Header onToggle={() => setOpen(!open)} />

        {/* CONTENT */}
        <main className="h-[calc(100vh-64px)] overflow-y-auto p-2 bg-transparent">
          {children}
        </main>
      </div>
    </div>
  );
}