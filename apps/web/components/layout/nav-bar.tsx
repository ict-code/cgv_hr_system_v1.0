"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { NAV_SECTIONS, type NavSection } from "./nav-config";

function isSectionActive(section: NavSection, pathname: string): boolean {
  return section.items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}

export function NavBar() {
  const pathname = usePathname();
  const { data: user } = useCurrentUser();
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [lastPathname, setLastPathname] = useState(pathname);
  const navRef = useRef<HTMLElement>(null);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpenSection(null);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenSection(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const permissions = user?.permissions ?? [];
  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.requiredPermission || permissions.includes(item.requiredPermission)),
  })).filter((section) => section.items.length > 0);

  return (
    <nav ref={navRef} className="relative flex min-h-12 border-b border-[var(--color-border)] bg-white px-4">
      <div className="flex w-full flex-wrap items-center gap-x-1">
        {sections.map((section, index) => {
          // Menus for the last few sections open leftward so they stay inside the viewport.
          const alignRight = index >= sections.length - 3;
          const key = section.title ?? section.items[0].href;
          const active = isSectionActive(section, pathname);
          const Icon = section.icon;

          if (section.items.length === 1 && !section.title) {
            const item = section.items[0];
            return (
              <Link
                key={key}
                href={item.href}
                className={cn(
                  "flex h-12 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors",
                  active ? "border-brand-500 text-brand-600" : "border-transparent text-[var(--color-muted)] hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                {item.label}
              </Link>
            );
          }

          const isOpen = openSection === key;
          return (
            <div key={key} className="relative">
              <button
                type="button"
                onClick={() => setOpenSection(isOpen ? null : key)}
                className={cn(
                  "flex h-12 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors",
                  active ? "border-brand-500 text-brand-600" : "border-transparent text-[var(--color-muted)] hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                {section.title}
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} />
              </button>
              {isOpen && (
                <div className={cn("absolute top-full z-20 mt-1 max-h-[75vh] w-80 overflow-y-auto rounded-md border border-[var(--color-border)] bg-white py-1.5 shadow-lg", alignRight ? "right-0" : "left-0")}>
                  {section.items.map((item) => {
                    const itemActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const ItemIcon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-start gap-2.5 px-3 py-1.5 text-sm leading-snug",
                          itemActive ? "bg-brand-50 text-brand-700" : "text-foreground hover:bg-slate-50",
                        )}
                      >
                        <ItemIcon className={cn("h-4 w-4 shrink-0 translate-y-0.5", itemActive ? "text-brand-500" : "text-slate-400")} strokeWidth={2} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
