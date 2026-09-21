"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBranding } from "@/hooks/use-branding";
import { useCurrentUser } from "@/hooks/use-current-user";

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

export function Topbar() {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const branding = useBranding();

  async function handleLogout() {
    await fetch("/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-emerald-900 bg-[#04271d] px-6">
      <div className="flex w-full items-center justify-between">
        {/* Branding lives in the sidebar on md+; shown here only where the sidebar is hidden. */}
        <div className="flex items-center gap-2.5 md:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={branding.logoSrc} alt="Logo" width={36} height={36} className="h-9 w-9 object-contain" />
          <div>
            <p className="text-sm font-semibold leading-tight text-white">{branding.title}</p>
            <p className="text-xs leading-tight text-emerald-400">{branding.subtitle}</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
              {user ? initials(user.fullName) : ""}
            </span>
            <div className="text-left leading-tight">
              <p className="text-sm font-medium text-foreground">{user?.fullName}</p>
              <p className="text-xs text-[var(--color-muted)]">{user?.loginId}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
