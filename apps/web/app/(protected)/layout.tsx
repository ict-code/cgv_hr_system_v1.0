"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex-1 flex flex-col">
      <nav className="border-b px-6 py-3 flex items-center gap-6 font-sans">
        <span className="font-semibold">EGAPS Modern</span>
        <Link href="/employees" className="text-sm hover:underline">
          Employees
        </Link>
        <Link href="/departments" className="text-sm hover:underline">
          Departments
        </Link>
        <Link href="/positions" className="text-sm hover:underline">
          Positions
        </Link>
        <button onClick={handleLogout} className="text-sm hover:underline ml-auto">
          Logout
        </button>
      </nav>
      <div className="flex-1 p-6 font-sans">{children}</div>
    </div>
  );
}
