"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBranding } from "@/hooks/use-branding";
import { useCurrentUser } from "@/hooks/use-current-user";
import { SYSTEMS, systemForPath } from "./systems";

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const active = systemForPath(pathname);
  const branding = useBranding();
  const { data: user } = useCurrentUser();

  async function handleLogout() {
    await fetch("/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-emerald-900 bg-[#04271d] md:flex print:hidden">
      <div className="flex items-center gap-3 px-5 pb-4 pt-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={branding.logoSrc} alt="Logo" width={36} height={36} className="h-9 w-9 shrink-0 rounded-lg object-contain" />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold leading-tight tracking-tight text-white">{branding.title}</p>
          <p className="truncate font-mono text-[10px] uppercase leading-tight tracking-wider text-emerald-300/60">
            {branding.subtitle}
          </p>
        </div>
      </div>
      <div className="mx-5 border-t border-emerald-900" />

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        <p className="mb-1 px-2 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300/40">Systems</p>
        {SYSTEMS.map((system) => {
          const Icon = system.icon;
          const isActive = system.id === active;
          return (
            <Link
              key={system.id}
              href={system.href}
              title={`${system.title} — ${system.subtitle}`}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                isActive ? "bg-emerald-500/15 text-emerald-300" : "text-emerald-50/75 hover:bg-emerald-900/60 hover:text-white",
              )}
            >
              {isActive && <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-emerald-400" />}
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight">{system.title}</span>
                <span className={cn("mt-0.5 block text-[11px] leading-snug", isActive ? "text-emerald-200/70" : "text-emerald-100/45")}>
                  {system.subtitle}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mx-5 border-t border-emerald-900" />
      <div className="flex items-center gap-3 px-5 py-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
          {user ? initials(user.fullName) : ""}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-semibold text-white">{user?.fullName}</p>
          <p className="truncate text-xs text-emerald-100/50">{user?.loginId}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Sign out"
          title="Sign out"
          className="rounded-md p-1.5 text-emerald-100/60 hover:bg-emerald-900 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
