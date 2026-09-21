"use client";

import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBranding } from "@/hooks/use-branding";
import { useCurrentUser } from "@/hooks/use-current-user";
import { SYSTEMS, systemForPath } from "./systems";

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user } = useCurrentUser();
  const branding = useBranding();
  const system = SYSTEMS.find((s) => s.id === systemForPath(pathname))!;

  async function handleLogout() {
    await fetch("/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-emerald-900 bg-[#04271d] px-6">
      {/* md+: branding and user live in the sidebar, so this bar just names the current system. */}
      <div className="hidden min-w-0 items-baseline gap-3 md:flex">
        <span className="text-sm font-semibold text-white">{system.title}</span>
        <span className="truncate font-mono text-[11px] uppercase tracking-wider text-emerald-300/60">{system.subtitle}</span>
      </div>

      {/* Below md the sidebar is hidden, so keep branding + sign out here. */}
      <div className="flex w-full items-center justify-between md:hidden">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={branding.logoSrc} alt="Logo" width={32} height={32} className="h-8 w-8 rounded-lg object-contain" />
          <div>
            <p className="text-sm font-bold leading-tight text-white">{branding.title}</p>
            <p className="font-mono text-[10px] uppercase leading-tight tracking-wider text-emerald-300/60">{branding.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white">{user?.fullName}</span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
