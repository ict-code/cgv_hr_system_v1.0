import {
  Banknote,
  BarChart3,
  Bell,
  Bookmark,
  Briefcase,
  Building2,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  Database,
  FileBarChart,
  FileText,
  Flag,
  GraduationCap,
  Heart,
  IdCard,
  Landmark,
  LayoutDashboard,
  ListChecks,
  MapPin,
  MapPinned,
  Percent,
  Search,
  Settings,
  ShieldCheck,
  Upload,
  UserCog,
  UserPlus,
  UserRound,
  Users,
  Wrench,
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

// Screens from the legacy eGAPS/PMIS system that don't have a real page yet
// point here instead of a 404 — the nav shell mirrors the legacy taxonomy in
// full even though most of it isn't built out yet.
function soon(title: string, section: string): string {
  return `/coming-soon?title=${encodeURIComponent(title)}&section=${encodeURIComponent(section)}`;
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: null,
    icon: LayoutDashboard,
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Personnel File",
    icon: UserRound,
    items: [
      // Family Background / Educational Background / Eligibility / Work
      // Experience / Training are tabs on the employee detail page now
      // (reached from here), not separate nav entries.
      { label: "Personal Data Sheet Records", href: "/employees", icon: UserRound },
      { label: "Import Service Records", href: "/service-records/import", icon: Upload },
      { label: "Update Employment Status Process", href: soon("Update Employment Status Process", "Personnel File"), icon: UserCog },
    ],
  },
  {
    title: "Plantilla & Appointments File",
    icon: ClipboardList,
    items: [
      { label: "Plantilla Positions File", href: "/plantilla", icon: ClipboardList },
      { label: "Plantilla Appointment — Regular/Elected", href: "/plantilla-appointments", icon: FileText },
      { label: "Consultant/Honorary Appointment File", href: soon("Consultant/Honorary Appointment File", "Plantilla & Appointments File"), icon: IdCard },
      { label: "Setup Employment Period", href: soon("Setup Employment Period", "Plantilla & Appointments File — Casual/Job Order"), icon: CalendarClock },
      { label: "Casual Plantilla Appointment File", href: "/casual-appointments", icon: FileText },
      { label: "Contractual Appointment File", href: "/contractual-appointments", icon: FileText },
    ],
  },
  {
    title: "Miscellaneous Schedule",
    icon: CalendarClock,
    items: [
      { label: "Vacant Position File", href: soon("Vacant Position File", "Miscellaneous Schedule"), icon: Briefcase },
      { label: "Schedule of Salary Adjustment", href: soon("Schedule of Salary Adjustment", "Miscellaneous Schedule"), icon: Percent },
      { label: "Employee's Withholding Tax / Pagibig Rate", href: soon("Employee's Withholding Tax / Pagibig Rate", "Miscellaneous Schedule"), icon: Banknote },
      { label: "Employee's Hiring Date", href: soon("Employee's Hiring Date", "Miscellaneous Schedule"), icon: CalendarDays },
    ],
  },
  {
    title: "Applicant's Records",
    icon: UserPlus,
    items: [{ label: "Applicants File", href: soon("Applicants File", "Applicant's Records"), icon: UserPlus }],
  },
  {
    title: "Inquiries",
    icon: Search,
    items: [
      { label: "Inquiry by Employee Name", href: soon("Inquiry by Employee Name", "Inquiries"), icon: Search },
      { label: "Inquiry by ID No.", href: soon("Inquiry by ID No.", "Inquiries"), icon: Search },
      { label: "Inquiry by Home Address", href: soon("Inquiry by Home Address", "Inquiries"), icon: Search },
      { label: "Inquiry by Skills", href: soon("Inquiry by Skills", "Inquiries"), icon: Search },
      { label: "Inquiry by Educational Background", href: soon("Inquiry by Educational Background", "Inquiries"), icon: Search },
      { label: "Inquiry by Eligibility Record", href: soon("Inquiry by Eligibility Record", "Inquiries"), icon: Search },
      { label: "Inquiry by Training/Seminar Attended", href: soon("Inquiry by Training/Seminar Attended", "Inquiries"), icon: Search },
      { label: "Inquiry by Birth Date", href: soon("Inquiry by Birth Date", "Inquiries"), icon: Search },
    ],
  },
  {
    title: "Reports",
    icon: BarChart3,
    items: [
      { label: "Personnel Listing Report", href: soon("Personnel Listing Report", "Reports"), icon: FileBarChart },
      { label: "Statistical Report", href: soon("Statistical Report", "Reports"), icon: BarChart3 },
      { label: "List of Retireable Employees", href: soon("List of Retireable Employees", "Reports"), icon: FileBarChart },
      { label: "Vacant Position by Office", href: soon("Vacant Position by Office", "Reports"), icon: FileBarChart },
      { label: "Certificate of Employment", href: soon("Certificate of Employment", "Reports"), icon: FileText },
      { label: "CSC HR Complement Report", href: soon("CSC HR Complement Report", "Reports"), icon: FileBarChart },
      { label: "Loyalty Pay Employee Listing", href: soon("Loyalty Pay Employee Listing", "Reports"), icon: Bookmark },
      { label: "Summary of Inactive Employees", href: soon("Summary of Inactive Employees", "Reports"), icon: FileBarChart },
      { label: "Periodic Separation Report", href: soon("Periodic Separation Report", "Reports"), icon: FileBarChart },
      { label: "Master File Listing", href: soon("Master File Listing", "Reports"), icon: FileBarChart },
      { label: "Master File Listing Report", href: soon("Master File Listing Report", "Reports"), icon: FileBarChart },
    ],
  },
  {
    title: "Master Data",
    icon: Database,
    items: [
      { label: "System Parameter", href: soon("System Parameter", "Master Data"), icon: Settings },
      { label: "Offices File", href: "/departments", icon: Landmark },
      { label: "Positions File", href: "/positions", icon: Briefcase },
      { label: "Employment Status File", href: "/employment-statuses", icon: UserCog },
      { label: "Appointment Status File", href: "/appointment-statuses", icon: FileText },
      { label: "Salary Grade File", href: "/salary-grades", icon: Banknote },
      { label: "Work Assignments File", href: soon("Work Assignments File", "Master Data"), icon: Briefcase },
      { label: "Job Description File", href: soon("Job Description File", "Master Data"), icon: FileText },
      { label: "College Courses File", href: soon("College Courses File", "Master Data"), icon: GraduationCap },
      { label: "Province File", href: soon("Province File", "Master Data"), icon: MapPinned },
      { label: "Locality File (City/Municipality)", href: soon("Locality File (City/Municipality)", "Master Data"), icon: MapPin },
      { label: "Barangay File", href: soon("Barangay File", "Master Data"), icon: MapPin },
      { label: "PWD Type File", href: soon("PWD Type File", "Master Data"), icon: Heart },
      { label: "Signatories File", href: soon("Signatories File", "Master Data"), icon: IdCard },
      { label: "Country File", href: soon("Country File", "Master Data"), icon: Flag },
      { label: "Genders File", href: soon("Genders File", "Master Data"), icon: Users },
      { label: "Religions File", href: soon("Religions File", "Master Data"), icon: Bell },
      { label: "Skills File", href: soon("Skills File", "Master Data"), icon: Wrench },
      { label: "Requirements List File", href: soon("Requirements List File", "Master Data"), icon: ListChecks },
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
