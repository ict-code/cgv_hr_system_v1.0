import { Topbar } from "@/components/layout/topbar";
import { NavBar } from "@/components/layout/nav-bar";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar />
      <NavBar />
      <main className="flex-1 overflow-x-auto p-4">
        <div className="mx-auto w-full max-w-[1400px]">{children}</div>
      </main>
    </div>
  );
}
