"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Employee, PaginatedResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";

const PAGE_SIZE = 20;

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const query = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
  if (debouncedSearch) query.set("search", debouncedSearch);

  const employees = useQuery({
    queryKey: ["employees", page, debouncedSearch],
    queryFn: () => apiFetch<PaginatedResult<Employee>>(`/employees?${query.toString()}`),
  });

  const rows = employees.data?.data ?? [];
  const total = employees.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <TableCard
      title="Employees"
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search name or employee ID"
      headerExtra={
        <Link href="/employees/new">
          <Button size="sm">
            <Plus className="h-3.5 w-3.5" />
            New employee
          </Button>
        </Link>
      }
    >
      <Table bare>
        <TableHeader>
          <TableRow>
            <TableHead>Employee ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Department</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.isLoading && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-[var(--color-muted)]">
                Loading…
              </TableCell>
            </TableRow>
          )}
          {employees.isError && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-[var(--color-danger)]">
                {(employees.error as Error).message}
              </TableCell>
            </TableRow>
          )}
          {!employees.isLoading && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-[var(--color-muted)]">
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
              <TableCell className="text-[var(--color-muted)]">{e.department?.deptDesc ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination page={page} pageCount={pageCount} totalItems={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </TableCard>
  );
}
