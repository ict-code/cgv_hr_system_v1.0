import { CalendarClock, Users, Wallet, type LucideIcon } from "lucide-react";

export type SystemId = "pmis" | "alms" | "gps";

export interface AppSystem {
  id: SystemId;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  href: string;
  // Route prefixes that belong to this system. PMIS is the fallback for
  // everything not claimed by another system.
  prefixes: string[];
}

export const SYSTEMS: AppSystem[] = [
  {
    id: "pmis",
    title: "PMIS",
    subtitle: "Personnel Management and Information System",
    icon: Users,
    href: "/dashboard",
    prefixes: [],
  },
  {
    id: "alms",
    title: "ALMS",
    subtitle: "Attendance and Leaves Monitoring System",
    icon: CalendarClock,
    href: "/attendance",
    prefixes: ["/attendance"],
  },
  {
    id: "gps",
    title: "GPS",
    subtitle: "Government Payroll System",
    icon: Wallet,
    href: "/payroll",
    prefixes: ["/payroll"],
  },
];

export function systemForPath(pathname: string): SystemId {
  const match = SYSTEMS.find((s) => s.prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`)));
  return match?.id ?? "pmis";
}
