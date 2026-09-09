import { Briefcase, Building2, Database, UserRound, type LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  title: string | null;
  icon: LucideIcon;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  { title: null, icon: UserRound, items: [{ label: "Employees", href: "/employees", icon: UserRound }] },
  {
    title: "Master Data",
    icon: Database,
    items: [
      { label: "Departments", href: "/departments", icon: Building2 },
      { label: "Positions", href: "/positions", icon: Briefcase },
    ],
  },
];
