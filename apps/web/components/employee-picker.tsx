"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Employee, PaginatedResult } from "@/lib/types";
import { Input } from "@/components/ui/input";

export function EmployeePicker({
  value,
  onChange,
}: {
  value: Employee | null;
  onChange: (employee: Employee | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const results = useQuery({
    queryKey: ["employee-picker", query],
    queryFn: () => apiFetch<PaginatedResult<Employee>>(`/employees?search=${encodeURIComponent(query)}&pageSize=8`),
    enabled: query.trim().length >= 2,
  });

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-md border border-[var(--color-border)] bg-slate-50 px-3 py-2 text-sm">
        <span>
          {value.lastName}, {value.firstName} — {value.idNo || value.biometricId || value.empNo}
        </span>
        <button type="button" onClick={() => onChange(null)} className="text-xs font-medium text-brand-600 hover:underline">
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        placeholder="Search employee name or ID…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-md border border-[var(--color-border)] bg-white shadow-lg">
          {results.isLoading && <div className="px-3 py-2 text-sm text-[var(--color-muted)]">Searching…</div>}
          {!results.isLoading && (results.data?.data.length ?? 0) === 0 && (
            <div className="px-3 py-2 text-sm text-[var(--color-muted)]">No matches.</div>
          )}
          {results.data?.data.map((emp) => (
            <button
              key={emp.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(emp);
                setOpen(false);
                setQuery("");
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
            >
              {emp.lastName}, {emp.firstName} — {emp.idNo || emp.biometricId || emp.empNo}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
