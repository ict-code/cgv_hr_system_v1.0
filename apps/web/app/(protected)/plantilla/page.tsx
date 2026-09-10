"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch, apiFetchAll } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { Department, PaginatedResult, Plantilla, Position } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";

const PAGE_SIZE = 20;

const emptyForm = {
  itemNo: "",
  departmentId: "",
  positionId: "",
  actualSalary: "",
  authSalary: "",
  grade: "",
  step: "",
};

export default function PlantillaPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
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

  const plantilla = useQuery({
    queryKey: ["/plantilla", page, debouncedSearch],
    queryFn: () => apiFetch<PaginatedResult<Plantilla>>(`/plantilla?${query.toString()}`),
  });

  const rows = plantilla.data?.data ?? [];
  const total = plantilla.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const departments = useQuery({
    queryKey: ["/departments"],
    queryFn: () => apiFetchAll<Department>("/departments"),
  });

  const positions = useQuery({
    queryKey: ["/positions"],
    queryFn: () => apiFetchAll<Position>("/positions"),
  });

  const create = useMutation({
    mutationFn: () =>
      apiFetch<Plantilla>("/plantilla", {
        method: "POST",
        body: JSON.stringify({
          itemNo: form.itemNo,
          departmentId: form.departmentId,
          positionId: form.positionId || undefined,
          actualSalary: form.actualSalary ? Number(form.actualSalary) : undefined,
          authSalary: form.authSalary ? Number(form.authSalary) : undefined,
          grade: form.grade ? Number(form.grade) : undefined,
          step: form.step ? Number(form.step) : undefined,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/plantilla"] });
      // Sorted by item no. — search for the new row so it's not left off-screen on a later page.
      setSearch(form.itemNo);
      setPage(1);
      setForm(emptyForm);
      setDialogOpen(false);
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <TableCard
        title="Plantilla"
        search={search}
        onSearchChange={setSearch}
        headerExtra={
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            New
          </Button>
        }
      >
        <Table bare>
          <TableHeader>
            <TableRow>
              <TableHead>Item No.</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead>Grade / Step</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plantilla.isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-[var(--color-muted)]">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!plantilla.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-[var(--color-muted)]">
                  No plantilla items yet.
                </TableCell>
              </TableRow>
            )}
            {rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.itemNo}</TableCell>
                <TableCell>{p.department?.deptDesc ?? "—"}</TableCell>
                <TableCell>{p.position?.positionDesc ?? "—"}</TableCell>
                <TableCell>{formatCurrency(p.actualSalary)}</TableCell>
                <TableCell>
                  {p.grade ?? "—"} / {p.step ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination page={page} pageCount={pageCount} totalItems={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </TableCard>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="New Plantilla Item">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="itemNo">Item no.</Label>
            <Input id="itemNo" required value={form.itemNo} onChange={(e) => setForm((f) => ({ ...f, itemNo: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="departmentId">Department</Label>
            <Select
              id="departmentId"
              required
              value={form.departmentId}
              onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
            >
              <option value="">—</option>
              {departments.data?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.deptDesc}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="positionId">Position</Label>
            <Select
              id="positionId"
              value={form.positionId}
              onChange={(e) => setForm((f) => ({ ...f, positionId: e.target.value }))}
            >
              <option value="">—</option>
              {positions.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.positionDesc}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="actualSalary">Actual salary</Label>
              <Input
                id="actualSalary"
                type="number"
                value={form.actualSalary}
                onChange={(e) => setForm((f) => ({ ...f, actualSalary: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="authSalary">Authorized salary</Label>
              <Input
                id="authSalary"
                type="number"
                value={form.authSalary}
                onChange={(e) => setForm((f) => ({ ...f, authSalary: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="grade">Grade</Label>
              <Input id="grade" type="number" value={form.grade} onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="step">Step</Label>
              <Input id="step" type="number" value={form.step} onChange={(e) => setForm((f) => ({ ...f, step: e.target.value }))} />
            </div>
          </div>
          {create.isError && <p className="text-sm text-[var(--color-danger)]">{(create.error as Error).message}</p>}
          <Button type="submit" disabled={create.isPending} className="mt-2">
            {create.isPending ? "Saving…" : "Save"}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
