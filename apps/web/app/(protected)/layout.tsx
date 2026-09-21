import { Topbar } from "@/components/layout/topbar";
import { Sidebar } from "@/components/layout/sidebar";
import { SystemNav } from "@/components/layout/system-nav";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-40 print:hidden">
          <Topbar />
          <SystemNav />
        </div>
        <main className="flex-1 overflow-x-auto px-6 py-4 print:overflow-visible print:p-0">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
