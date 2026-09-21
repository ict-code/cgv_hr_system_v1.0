"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch, apiFetchAll } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
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

const SORT_OPTIONS = [
  { value: "itemNo", label: "Item No." },
  { value: "employeeName", label: "Incumbent Name" },
  { value: "division", label: "Division" },
  { value: "salary", label: "Salary" },
  { value: "grade", label: "Grade" },
] as const;

const emptyForm = {
  itemNo: "",
  oldItemNo: "",
  departmentId: "",
  positionId: "",
  actualSalary: "",
  authSalary: "",
  grade: "",
  step: "",
  partTime: false,
};

export default function PlantillaPage() {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const permissions = currentUser?.permissions ?? [];
  const canCreate = permissions.includes("plantilla:create");
  const canEdit = permissions.includes("plantilla:edit");
  const canDelete = permissions.includes("plantilla:delete");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]["value"]>("itemNo");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, departmentId, sort]);

  const query = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE), sort });
  if (debouncedSearch) query.set("search", debouncedSearch);
  if (departmentId) query.set("departmentId", departmentId);

  const plantilla = useQuery({
    queryKey: ["/plantilla", page, debouncedSearch, departmentId, sort],
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

  function toBody() {
    return {
      itemNo: form.itemNo,
      oldItemNo: form.oldItemNo || undefined,
      departmentId: form.departmentId,
      positionId: form.positionId || undefined,
      actualSalary: form.actualSalary ? Number(form.actualSalary) : undefined,
      authSalary: form.authSalary ? Number(form.authSalary) : undefined,
      grade: form.grade ? Number(form.grade) : undefined,
      step: form.step ? Number(form.step) : undefined,
      partTime: form.partTime,
    };
  }

  const create = useMutation({
    mutationFn: () => apiFetch<Plantilla>("/plantilla", { method: "POST", body: JSON.stringify(toBody()) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/plantilla"] });
      // Sorted by item no. by default — search for the new row so it's not left off-screen.
      setSort("itemNo");
      setSearch(form.itemNo);
      setPage(1);
      setForm(emptyForm);
      setDialogOpen(false);
    },
  });

  const update = useMutation({
    mutationFn: () =>
      apiFetch<Plantilla>(`/plantilla/${editingId}`, { method: "PATCH", body: JSON.stringify(toBody()) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/plantilla"] });
      setForm(emptyForm);
      setEditingId(null);
      setDialogOpen(false);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/plantilla/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/plantilla"] }),
  });

  function openNewDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(row: Plantilla) {
    setEditingId(row.id);
    setForm({
      itemNo: row.itemNo,
      oldItemNo: row.oldItemNo ?? "",
      departmentId: row.departmentId,
      positionId: row.positionId ?? "",
      actualSalary: row.actualSalary ?? "",
      authSalary: row.authSalary ?? "",
      grade: row.grade != null ? String(row.grade) : "",
      step: row.step != null ? String(row.step) : "",
      partTime: row.partTime,
    });
    setDialogOpen(true);
  }

  function handleDelete(row: Plantilla) {
    if (window.confirm(`Delete plantilla item ${row.itemNo}?`)) remove.mutate(row.id);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--color-border)] bg-white p-3">
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
        <Label htmlFor="sortBy" className="shrink-0">
          Sort:
        </Label>
        <Select
          id="sortBy"
          value={sort}
          onChange={(e) => setSort(e.target.value as (typeof SORT_OPTIONS)[number]["value"])}
          className="w-auto"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>

      <TableCard
        title="Plantilla Positions File"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search item no."
        headerExtra={
          canCreate && (
            <Button size="sm" onClick={openNewDialog}>
              <Plus className="h-3.5 w-3.5" />
              New
            </Button>
          )
        }
      >
        <Table bare>
          <TableHeader>
            <TableRow>
              <TableHead>Item No.</TableHead>
              <TableHead>Old Item No.</TableHead>
              <TableHead>Division</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Grade / Step</TableHead>
              <TableHead>Incumbent</TableHead>
              <TableHead className="text-right">Authorized Salary</TableHead>
              {(canEdit || canDelete) && <TableHead className="w-20" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {plantilla.isLoading && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-[var(--color-muted)]">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!plantilla.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-[var(--color-muted)]">
                  No plantilla items yet.
                </TableCell>
              </TableRow>
            )}
            {rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-semibold">{p.itemNo}</TableCell>
                <TableCell className="text-[var(--color-muted)]">{p.oldItemNo ?? "—"}</TableCell>
                <TableCell className="text-[var(--color-muted)]">{p.division?.divDesc ?? "—"}</TableCell>
                <TableCell>{p.position?.positionDesc ?? "—"}</TableCell>
                <TableCell>
                  {p.grade ?? "—"} / {p.step ?? "—"}
                </TableCell>
                <TableCell>
                  {p.employee ? (
                    `${p.employee.lastName}, ${p.employee.firstName}`
                  ) : (
                    <span className="text-[var(--color-muted)]">Vacant</span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(p.authSalary)}</TableCell>
                {(canEdit || canDelete) && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => openEditDialog(p)}
                          aria-label={`Edit ${p.itemNo}`}
                          className="text-[var(--color-muted)] hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          aria-label={`Delete ${p.itemNo}`}
                          className="text-[var(--color-muted)] hover:text-[var(--color-danger)]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination page={page} pageCount={pageCount} totalItems={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </TableCard>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingId ? "Edit Plantilla Item" : "New Plantilla Item"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editingId) update.mutate();
            else create.mutate();
          }}
          className="flex flex-col gap-3"
        >
          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="itemNo">Item no.</Label>
              <Input
                id="itemNo"
                required
                disabled={!!editingId}
                value={form.itemNo}
                onChange={(e) => setForm((f) => ({ ...f, itemNo: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="oldItemNo">Old item no.</Label>
              <Input
                id="oldItemNo"
                value={form.oldItemNo}
                onChange={(e) => setForm((f) => ({ ...f, oldItemNo: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="departmentId">Office</Label>
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.partTime}
              onChange={(e) => setForm((f) => ({ ...f, partTime: e.target.checked }))}
            />
            Part-time
          </label>
          {(create.isError || update.isError) && (
            <p className="text-sm text-[var(--color-danger)]">{((create.error ?? update.error) as Error).message}</p>
          )}
          <Button type="submit" disabled={create.isPending || update.isPending} className="mt-2">
            {create.isPending || update.isPending ? "Saving…" : "Save"}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
