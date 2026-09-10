"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Banknote,
  Briefcase,
  Building2,
  ClipboardList,
  FileText,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { PaginatedResult } from "@/lib/types";
import { Card } from "@/components/ui/card";

function useCount(path: string) {
  return useQuery({
    queryKey: [path, "count"],
    queryFn: () => apiFetch<PaginatedResult<unknown>>(`${path}?page=1&pageSize=1`),
    select: (result) => result.total,
  });
}

function StatCard({ label, href, icon: Icon, count }: { label: string; href: string; icon: LucideIcon; count: number | undefined }) {
  return (
    <Link href={href}>
      <Card className="flex items-center gap-4 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/40">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        <div>
          <p className="text-2xl font-bold text-foreground">{count ?? "—"}</p>
          <p className="text-sm text-[var(--color-muted)]">{label}</p>
        </div>
      </Card>
    </Link>
  );
}

function QuickLink({ label, description, href, icon: Icon }: { label: string; description: string; href: string; icon: LucideIcon }) {
  return (
    <Link href={href}>
      <Card className="flex items-center gap-3 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/40">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-[var(--color-muted)]">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const { data: user } = useCurrentUser();

  const employees = useCount("/employees");
  const departments = useCount("/departments");
  const positions = useCount("/positions");
  const plantilla = useCount("/plantilla");
  const appointmentStatuses = useCount("/appointment-statuses");
  const roles = useCount("/roles");

  const firstName = user?.fullName?.split(" ")[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">{firstName ? `Welcome, ${firstName}` : "Welcome"}</h1>
        <p className="text-sm text-[var(--color-muted)]">City Government of Vigan — EGAPS Modern Personnel Information System</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Employees" href="/employees" icon={UserRound} count={employees.data} />
        <StatCard label="Departments" href="/departments" icon={Building2} count={departments.data} />
        <StatCard label="Positions" href="/positions" icon={Briefcase} count={positions.data} />
        <StatCard label="Plantilla Items" href="/plantilla" icon={ClipboardList} count={plantilla.data} />
        <StatCard label="Appointment Statuses" href="/appointment-statuses" icon={FileText} count={appointmentStatuses.data} />
        <StatCard label="Roles" href="/roles" icon={ShieldCheck} count={roles.data} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">Quick links</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLink label="Personal Data Sheet Records" description="Browse and manage employees" href="/employees" icon={UserRound} />
          <QuickLink label="Plantilla Positions File" description="Item numbers, salary and grade" href="/plantilla" icon={ClipboardList} />
          <QuickLink label="Salary Grade File" description="Salary schedules and step rates" href="/salary-grades" icon={Banknote} />
          <QuickLink label="Offices File" description="Departments and offices" href="/departments" icon={Building2} />
          <QuickLink label="Positions File" description="Plantilla position titles" href="/positions" icon={Briefcase} />
          <QuickLink label="Appointment Status File" description="Appointment status codes" href="/appointment-statuses" icon={FileText} />
        </div>
      </div>
    </div>
  );
}
