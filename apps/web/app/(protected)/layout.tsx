import { Topbar } from "@/components/layout/topbar";
import { NavBar } from "@/components/layout/nav-bar";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-40 print:hidden">
        <Topbar />
        <NavBar />
      </div>
      <main className="flex-1 overflow-x-auto px-6 py-4 print:overflow-visible print:p-0">
        <div className="mx-auto max-w-7xl print:max-w-none">{children}</div>
      </main>
    </div>
  );
}
