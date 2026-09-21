"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetchAll } from "@/lib/api";
import type { Employee } from "@/lib/types";
import { Select } from "@/components/ui/select";

/**
 * Dropdown of active employees from the Personnel File. `excludeEmploymentStatus`
 * (comma-separated codes) leaves out anyone whose current appointment already
 * has that employment status — they'd be edited from the list, not re-added.
 */
export function EmployeePicker({
  value,
  onChange,
  excludeEmploymentStatus,
}: {
  value: Employee | null;
  onChange: (employee: Employee | null) => void;
  excludeEmploymentStatus?: string;
}) {
  const [changing, setChanging] = useState(false);

  const employees = useQuery({
    queryKey: ["/employees", "employee-picker", excludeEmploymentStatus ?? ""],
    queryFn: () =>
      apiFetchAll<Employee>(
        `/employees?inactive=false${excludeEmploymentStatus ? `&notEmploymentStatus=${excludeEmploymentStatus}` : ""}`,
      ),
    staleTime: 0,
    enabled: !value || changing,
  });

  if (value && !changing) {
    return (
      <div className="flex items-center justify-between rounded-md border border-[var(--color-border)] bg-slate-50 px-3 py-2 text-sm">
        <span>
          {value.lastName}, {value.firstName} — {value.idNo || value.biometricId || value.empNo}
        </span>
        <button
          type="button"
          onClick={() => {
            setChanging(true);
            onChange(null);
          }}
          className="text-xs font-medium text-brand-600 hover:underline"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <Select
      value=""
      onChange={(e) => {
        const picked = employees.data?.find((emp) => emp.id === e.target.value) ?? null;
        onChange(picked);
        setChanging(false);
      }}
    >
      <option value="">{employees.isLoading ? "Loading…" : employees.data?.length ? "—" : "No employees available"}</option>
      {employees.data?.map((emp) => (
        <option key={emp.id} value={emp.id}>
          {emp.lastName}, {emp.firstName} — {emp.idNo || emp.biometricId || emp.empNo}
        </option>
      ))}
    </Select>
  );
}
