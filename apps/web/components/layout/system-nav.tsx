"use client";

import { usePathname } from "next/navigation";
import { NavBar } from "./nav-bar";
import { systemForPath } from "./systems";

// The top menu bar belongs to PMIS only; the other systems get their own
// navigation when they're built.
export function SystemNav() {
  const pathname = usePathname();
  return systemForPath(pathname) === "pmis" ? <NavBar /> : null;
}
