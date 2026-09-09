"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { apiFetch } from "../../../lib/api";
import type { Employee } from "../../../lib/types";

export default function EmployeesPage() {
  const employees = useQuery({
    queryKey: ["employees"],
    queryFn: () => apiFetch<Employee[]>("/employees"),
  });

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Employees</h1>
        <Link href="/employees/new" className="bg-black text-white rounded px-3 py-2 text-sm">
          New employee
        </Link>
      </div>

      <div className="border rounded-lg divide-y">
        {employees.isLoading && <p className="p-4">Loading…</p>}
        {employees.isError && (
          <p className="p-4 text-red-600">{(employees.error as Error).message}</p>
        )}
        {employees.data?.length === 0 && <p className="p-4 text-gray-500">No employees yet.</p>}
        {employees.data?.map((e) => (
          <Link
            key={e.id}
            href={`/employees/${e.id}`}
            className="p-3 flex gap-3 hover:bg-gray-50"
          >
            <span className="text-gray-500 w-20">{e.empNo}</span>
            <span>
              {e.lastName}, {e.firstName}
            </span>
            {e.department && <span className="text-gray-400 ml-auto">{e.department.deptDesc}</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}
