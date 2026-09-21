"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBranding } from "@/hooks/use-branding";
import { SYSTEMS, systemForPath } from "./systems";

export function Sidebar() {
  const pathname = usePathname();
  const active = systemForPath(pathname);
  const branding = useBranding();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-emerald-900 bg-[#04271d] transition-[width] md:flex print:hidden",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className={cn("flex h-14 shrink-0 items-center gap-2.5 border-b border-emerald-900", collapsed ? "justify-center" : "px-4")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={branding.logoSrc} alt="Logo" width={36} height={36} className="h-9 w-9 shrink-0 object-contain" />
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight text-white">{branding.title}</p>
            <p className="truncate text-xs leading-tight text-emerald-400">{branding.subtitle}</p>
          </div>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-3">
        {SYSTEMS.map((system) => {
          const Icon = system.icon;
          const isActive = system.id === active;
          return (
            <Link
              key={system.id}
              href={system.href}
              title={`${system.title} — ${system.subtitle}`}
              className={cn(
                "flex items-center gap-3 rounded-md px-2.5 py-2 transition-colors",
                collapsed && "justify-center",
                isActive ? "bg-emerald-600 text-white" : "text-emerald-100/80 hover:bg-emerald-900 hover:text-white",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
              {!collapsed && (
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-tight">{system.title}</span>
                  <span className={cn("block text-xs leading-snug", isActive ? "text-emerald-50/90" : "text-emerald-100/60")}>
                    {system.subtitle}
                  </span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={cn(
          "m-2 flex items-center gap-3 rounded-md px-2.5 py-2 text-sm text-emerald-100/70 hover:bg-emerald-900 hover:text-white",
          collapsed && "justify-center",
        )}
      >
        {collapsed ? <PanelLeftOpen className="h-5 w-5 shrink-0" /> : <PanelLeftClose className="h-5 w-5 shrink-0" />}
        {!collapsed && <span>Collapse</span>}
      </button>
    </aside>
  );
}
