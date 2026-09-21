import { CalendarClock, Users, Wallet, type LucideIcon } from "lucide-react";

export type SystemId = "pmis" | "alms" | "gps";

export interface AppSystem {
  id: SystemId;
  label: string;
  short: string;
  icon: LucideIcon;
  href: string;
  // Route prefixes that belong to this system. PMIS is the fallback for
  // everything not claimed by another system.
  prefixes: string[];
}

export const SYSTEMS: AppSystem[] = [
  {
    id: "pmis",
    label: "Personnel Management and Information System",
    short: "PMIS",
    icon: Users,
    href: "/dashboard",
    prefixes: [],
  },
  {
    id: "alms",
    label: "Attendance and Leaves Monitoring System",
    short: "ALMS",
    icon: CalendarClock,
    href: "/attendance",
    prefixes: ["/attendance"],
  },
  {
    id: "gps",
    label: "Government Payroll System",
    short: "GPS",
    icon: Wallet,
    href: "/payroll",
    prefixes: ["/payroll"],
  },
];

export function systemForPath(pathname: string): SystemId {
  const match = SYSTEMS.find((s) => s.prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`)));
  return match?.id ?? "pmis";
}
