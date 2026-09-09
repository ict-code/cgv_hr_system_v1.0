import {
  Banknote,
  Briefcase,
  Building2,
  ClipboardList,
  Database,
  ShieldCheck,
  UserCog,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  requiredPermission?: string;
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
      { label: "Plantilla", href: "/plantilla", icon: ClipboardList },
      { label: "Salary Grades", href: "/salary-grades", icon: Banknote },
    ],
  },
  {
    title: "Administration",
    icon: ShieldCheck,
    items: [
      { label: "Users", href: "/users", icon: UserCog, requiredPermission: "users:view" },
      { label: "Roles", href: "/roles", icon: ShieldCheck, requiredPermission: "roles:view" },
    ],
  },
];
