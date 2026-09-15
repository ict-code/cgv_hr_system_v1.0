"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch, apiFetchAll } from "@/lib/api";
import { exportRowsToExcel } from "@/lib/export-excel";
import type { Department, Employee, PaginatedResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";

const PAGE_SIZE = 20;

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [activeFilter, setActiveFilter] = useState<"active" | "inactive">("active");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const departments = useQuery({
    queryKey: ["/departments"],
    queryFn: () => apiFetchAll<Department>("/departments"),
  });

  async function handleExport() {
    setExporting(true);
    try {
      const all = await apiFetchAll<Employee>("/employees");
      await exportRowsToExcel({
        filename: "employees.xlsx",
        sheetName: "Employees",
        columns: [
          { header: "Employee ID", key: "employeeId" },
          { header: "Last Name", key: "lastName" },
          { header: "First Name", key: "firstName" },
          { header: "Middle Name", key: "middleName" },
          { header: "Position", key: "position" },
          { header: "Department", key: "department" },
        ],
        rows: all.map((e) => ({
          employeeId: e.idNo || e.biometricId || e.empNo,
          lastName: e.lastName,
          firstName: e.firstName,
          middleName: e.middleName ?? "",
          position: e.appointments?.[0]?.position?.positionDesc ?? "",
          department: e.department?.deptDesc ?? "",
        })),
      });
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, departmentId, activeFilter]);

  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
    inactive: String(activeFilter === "inactive"),
  });
  if (debouncedSearch) query.set("search", debouncedSearch);
  if (departmentId) query.set("departmentId", departmentId);

  const employees = useQuery({
    queryKey: ["employees", page, debouncedSearch, departmentId, activeFilter],
    queryFn: () => apiFetch<PaginatedResult<Employee>>(`/employees?${query.toString()}`),
  });

  const rows = employees.data?.data ?? [];
  const total = employees.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-[var(--color-border)] bg-white p-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="deptFilter" className="shrink-0">
            Office:
          </Label>
          <Select id="deptFilter" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="w-auto min-w-56">
            <option value="">All Offices</option>
            {departments.data?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.deptDesc}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="employeesActiveFilter"
              checked={activeFilter === "active"}
              onChange={() => setActiveFilter("active")}
            />
            Active
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="employeesActiveFilter"
              checked={activeFilter === "inactive"}
              onChange={() => setActiveFilter("inactive")}
            />
            In-Active
          </label>
        </div>
      </div>

      <TableCard
      title="Employees"
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search name or employee ID"
      headerExtra={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
            <Download className="h-3.5 w-3.5" />
            {exporting ? "Exporting…" : "Export"}
          </Button>
          <Link href="/employees/new">
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" />
              New employee
            </Button>
          </Link>
        </div>
      }
    >
      <Table bare>
        <TableHeader>
          <TableRow>
            <TableHead>Employee ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Department</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.isLoading && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-[var(--color-muted)]">
                Loading…
              </TableCell>
            </TableRow>
          )}
          {employees.isError && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-[var(--color-danger)]">
                {(employees.error as Error).message}
              </TableCell>
            </TableRow>
          )}
          {!employees.isLoading && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-[var(--color-muted)]">
                No employees yet.
              </TableCell>
            </TableRow>
          )}
          {rows.map((e) => (
            <TableRow key={e.id} className="cursor-pointer">
              <TableCell>
                <Link href={`/employees/${e.id}`} className="block text-brand-600 hover:underline">
                  {e.idNo || e.biometricId || e.empNo}
                </Link>
              </TableCell>
              <TableCell>
                <Link href={`/employees/${e.id}`} className="block">
                  {e.lastName}, {e.firstName}
                </Link>
              </TableCell>
              <TableCell className="text-[var(--color-muted)]">
                {e.appointments?.[0]?.position?.positionDesc ?? "—"}
              </TableCell>
              <TableCell className="text-[var(--color-muted)]">{e.department?.deptDesc ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination page={page} pageCount={pageCount} totalItems={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </TableCard>
    </div>
  );
}
