"use client";

import { useQuery } from "@tanstack/react-query";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type Employee = {
  id: string;
  empNo: number;
  lastName: string;
  firstName: string;
};

async function fetchHealth() {
  const res = await fetch(`${API_URL}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error(`health check failed: ${res.status}`);
  return res.json() as Promise<{ status: string; timestamp: string }>;
}

async function fetchEmployees() {
  const res = await fetch(`${API_URL}/employees`, { cache: "no-store" });
  if (!res.ok) throw new Error(`employees fetch failed: ${res.status}`);
  return res.json() as Promise<Employee[]>;
}

export default function Home() {
  const health = useQuery({ queryKey: ["health"], queryFn: fetchHealth });
  const employees = useQuery({ queryKey: ["employees"], queryFn: fetchEmployees });

  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-6 p-8 font-sans">
      <h1 className="text-2xl font-semibold">EGAPS Modern</h1>
      <p className="text-sm text-gray-500">Personnel module scaffold — Next.js → NestJS → Prisma → PostgreSQL</p>

      <div className="border rounded-lg p-4 w-full max-w-md">
        <h2 className="font-medium mb-2">API health</h2>
        {health.isLoading && <p>Checking…</p>}
        {health.isError && <p className="text-red-600">Could not reach API: {(health.error as Error).message}</p>}
        {health.data && (
          <p className="text-green-600">
            {health.data.status} — {health.data.timestamp}
          </p>
        )}
      </div>

      <div className="border rounded-lg p-4 w-full max-w-md">
        <h2 className="font-medium mb-2">Employees ({employees.data?.length ?? 0})</h2>
        {employees.isLoading && <p>Loading…</p>}
        {employees.isError && <p className="text-red-600">Could not load employees: {(employees.error as Error).message}</p>}
        {employees.data && employees.data.length === 0 && (
          <p className="text-gray-500">No employees yet — schema is scaffolded, data migration hasn&apos;t run.</p>
        )}
        <ul className="list-disc list-inside">
          {employees.data?.map((e) => (
            <li key={e.id}>
              {e.empNo} — {e.lastName}, {e.firstName}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
