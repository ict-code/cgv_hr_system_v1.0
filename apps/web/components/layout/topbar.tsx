"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

export function Topbar() {
  const router = useRouter();
  const { data: user } = useCurrentUser();

  async function handleLogout() {
    await fetch("/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-emerald-800 bg-emerald-700 px-6">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Image src="/vigan-seal.png" alt="City of Vigan seal" width={36} height={36} className="h-9 w-9" priority />
          <div>
            <p className="text-sm font-semibold leading-tight text-white">CGV - HRAS</p>
            <p className="text-xs leading-tight text-emerald-100">City Government of Vigan</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-800">
              {user ? initials(user.fullName) : ""}
            </span>
            <div className="text-left leading-tight">
              <p className="text-sm font-medium text-white">{user?.fullName}</p>
              <p className="text-xs text-emerald-100">{user?.loginId}</p>
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
