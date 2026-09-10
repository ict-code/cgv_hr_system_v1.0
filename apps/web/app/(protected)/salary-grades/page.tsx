"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { apiFetch, apiFetchAll } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { PaginatedResult, SalaryGrade, SalaryGradeTable } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";

const PAGE_SIZE = 50;

// The real schedule only ever populates steps 1-8 (steps 9-10 exist in the
// schema/legacy EXTENT=10 array but are unused for every grade on record).
const STEP_COUNT = 8;

const emptySteps = Array.from({ length: 10 }, () => ({ amount: "", monthlyRate: "" }));
const emptyTableForm = { name: "", effectiveDate: "", description: "" };

function EditableStepCell({
  gradeId,
  stepNo,
  amount,
  editable,
}: {
  gradeId: string;
  stepNo: number;
  amount: number;
  editable: boolean;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(amount));

  const update = useMutation({
    mutationFn: (newAmount: number) =>
      apiFetch(`/salary-grades/${gradeId}/steps/${stepNo}`, {
        method: "PATCH",
        body: JSON.stringify({ amount: newAmount }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/salary-grades"] });
      setEditing(false);
    },
  });

  function commit() {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      setValue(String(amount));
      setEditing(false);
      return;
    }
    if (parsed === amount) {
      setEditing(false);
      return;
    }
    update.mutate(parsed);
  }

  if (!editable) {
    return <span className="block px-2 py-1.5 text-right tabular-nums">{formatCurrency(amount)}</span>;
  }

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        step="0.01"
        value={value}
        disabled={update.isPending}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setValue(String(amount));
            setEditing(false);
          }
        }}
        className="w-full rounded-sm border border-[var(--color-brand-500,#2563eb)] bg-white px-2 py-1.5 text-right text-sm tabular-nums outline-none"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setValue(String(amount));
        setEditing(true);
      }}
      className="block w-full rounded-sm px-2 py-1.5 text-right tabular-nums hover:bg-brand-50"
    >
      {formatCurrency(amount)}
    </button>
  );
}

export default function SalaryGradesPage() {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const permissions = currentUser?.permissions ?? [];
  const canCreate = permissions.includes("salaryGrades:create");
  const canEdit = permissions.includes("salaryGrades:edit");
  const canDelete = permissions.includes("salaryGrades:delete");

  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [gradeNo, setGradeNo] = useState("");
  const [steps, setSteps] = useState(emptySteps);

  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(false);
  const [tableForm, setTableForm] = useState(emptyTableForm);

  const tables = useQuery({
    queryKey: ["/salary-grade-tables"],
    queryFn: () => apiFetchAll<SalaryGradeTable>("/salary-grade-tables"),
  });

  useEffect(() => {
    if (!selectedTableId && tables.data && tables.data.length > 0) {
      setSelectedTableId(tables.data[0].id);
    }
  }, [tables.data, selectedTableId]);

  const selectedTable = tables.data?.find((t) => t.id === selectedTableId) ?? null;

  const salaryGrades = useQuery({
    queryKey: ["/salary-grades", selectedTableId, page],
    queryFn: () =>
      apiFetch<PaginatedResult<SalaryGrade>>(
        `/salary-grades?salaryGradeTableId=${selectedTableId}&page=${page}&pageSize=${PAGE_SIZE}`,
      ),
    enabled: !!selectedTableId,
  });

  const rows = salaryGrades.data?.data ?? [];
  const total = salaryGrades.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const createGrade = useMutation({
    mutationFn: () =>
      apiFetch<SalaryGrade>("/salary-grades", {
        method: "POST",
        body: JSON.stringify({
          salaryGradeTableId: selectedTableId,
          gradeNo: Number(gradeNo),
          steps: steps.map((s) => ({ amount: Number(s.amount), monthlyRate: Number(s.monthlyRate) })),
        }),
      }),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/salary-grades"] });
      // Sorted by grade no. — jump to the page that will actually contain the new row.
      const all = await apiFetchAll<SalaryGrade>(`/salary-grades?salaryGradeTableId=${selectedTableId}`);
      const index = all.findIndex((g) => g.gradeNo === Number(gradeNo));
      if (index >= 0) setPage(Math.floor(index / PAGE_SIZE) + 1);
      setGradeNo("");
      setSteps(emptySteps);
      setGradeDialogOpen(false);
    },
  });

  const deleteGrade = useMutation({
    mutationFn: (id: string) => apiFetch(`/salary-grades/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/salary-grades"] }),
  });

  const createTable = useMutation({
    mutationFn: () =>
      apiFetch<SalaryGradeTable>("/salary-grade-tables", {
        method: "POST",
        body: JSON.stringify({
          name: tableForm.name,
          effectiveDate: tableForm.effectiveDate || undefined,
          description: tableForm.description || undefined,
        }),
      }),
    onSuccess: async (table) => {
      await queryClient.invalidateQueries({ queryKey: ["/salary-grade-tables"] });
      setSelectedTableId(table.id);
      setPage(1);
      setTableForm(emptyTableForm);
      setTableDialogOpen(false);
    },
  });

  const updateTable = useMutation({
    mutationFn: () =>
      apiFetch<SalaryGradeTable>(`/salary-grade-tables/${selectedTableId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: tableForm.name,
          effectiveDate: tableForm.effectiveDate || undefined,
          description: tableForm.description || undefined,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/salary-grade-tables"] });
      setTableForm(emptyTableForm);
      setTableDialogOpen(false);
    },
  });

  const deleteTable = useMutation({
    mutationFn: () => apiFetch(`/salary-grade-tables/${selectedTableId}`, { method: "DELETE" }),
    onSuccess: async () => {
      setSelectedTableId(null);
      setPage(1);
      await queryClient.invalidateQueries({ queryKey: ["/salary-grade-tables"] });
    },
  });

  function updateNewStep(index: number, field: "amount" | "monthlyRate", value: string) {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  function openNewTableDialog() {
    setEditingTable(false);
    setTableForm(emptyTableForm);
    setTableDialogOpen(true);
  }

  function openEditTableDialog() {
    if (!selectedTable) return;
    setEditingTable(true);
    setTableForm({
      name: selectedTable.name,
      effectiveDate: selectedTable.effectiveDate?.slice(0, 10) ?? "",
      description: selectedTable.description ?? "",
    });
    setTableDialogOpen(true);
  }

  function handleDeleteTable() {
    if (!selectedTable) return;
    if (!window.confirm(`Delete the "${selectedTable.name}" salary grade table and all ${total} of its grades? This cannot be undone.`)) {
      return;
    }
    deleteTable.mutate();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--color-border)] bg-white p-3">
        <Label htmlFor="tableSelect" className="shrink-0">
          Type:
        </Label>
        <Select
          id="tableSelect"
          value={selectedTableId ?? ""}
          onChange={(e) => {
            setSelectedTableId(e.target.value || null);
            setPage(1);
          }}
          className="w-auto min-w-56"
        >
          {tables.data?.length === 0 && <option value="">No tables yet</option>}
          {tables.data?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
        {canEdit && selectedTable && (
          <Button variant="outline" size="sm" onClick={openEditTableDialog}>
            <Pencil className="h-3.5 w-3.5" />
            Edit table
          </Button>
        )}
        {canDelete && selectedTable && (
          <Button variant="destructive" size="sm" onClick={handleDeleteTable} disabled={deleteTable.isPending}>
            <Trash2 className="h-3.5 w-3.5" />
            Delete table
          </Button>
        )}
        {canCreate && (
          <Button variant="outline" size="sm" onClick={openNewTableDialog}>
            <Plus className="h-3.5 w-3.5" />
            New table
          </Button>
        )}
      </div>

      <TableCard
        title="Salary Grade File"
        headerExtra={
          canCreate &&
          selectedTableId && (
            <Button size="sm" onClick={() => setGradeDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              New Grade
            </Button>
          )
        }
      >
        <Table bare>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Grade No.</TableHead>
              {Array.from({ length: STEP_COUNT }, (_, i) => (
                <TableHead key={i} className="text-right">
                  Step {i + 1}
                </TableHead>
              ))}
              {canDelete && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {!selectedTableId && (
              <TableRow>
                <TableCell colSpan={STEP_COUNT + 2} className="text-center text-[var(--color-muted)]">
                  No salary grade tables yet — create one to get started.
                </TableCell>
              </TableRow>
            )}
            {selectedTableId && salaryGrades.isLoading && (
              <TableRow>
                <TableCell colSpan={STEP_COUNT + 2} className="text-center text-[var(--color-muted)]">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {selectedTableId && !salaryGrades.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={STEP_COUNT + 2} className="text-center text-[var(--color-muted)]">
                  No salary grades yet.
                </TableCell>
              </TableRow>
            )}
            {rows.map((g) => (
              <TableRow key={g.id}>
                <TableCell className="font-semibold">{String(g.gradeNo).padStart(2, "0")}</TableCell>
                {Array.from({ length: STEP_COUNT }, (_, i) => {
                  const stepNo = i + 1;
                  const amount = g.steps.find((s) => s.stepNo === stepNo)?.amount ?? 0;
                  return (
                    <TableCell key={stepNo} className="p-0">
                      <EditableStepCell gradeId={g.id} stepNo={stepNo} amount={Number(amount)} editable={canEdit} />
                    </TableCell>
                  );
                })}
                {canDelete && (
                  <TableCell className="p-0 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete grade ${g.gradeNo}?`)) deleteGrade.mutate(g.id);
                      }}
                      aria-label={`Delete grade ${g.gradeNo}`}
                      className="text-[var(--color-muted)] hover:text-[var(--color-danger)]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {selectedTableId && (
          <Pagination page={page} pageCount={pageCount} totalItems={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
        )}
      </TableCard>

      <Dialog open={gradeDialogOpen} onClose={() => setGradeDialogOpen(false)} title="New Salary Grade" className="max-w-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createGrade.mutate();
          }}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1.5 max-w-40">
            <Label htmlFor="gradeNo">Grade no.</Label>
            <Input id="gradeNo" type="number" required value={gradeNo} onChange={(e) => setGradeNo(e.target.value)} />
          </div>

          <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Step</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Amount</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Monthly rate</span>
            {steps.map((s, i) => (
              <Fragment key={i}>
                <span className="text-[var(--color-muted)]">{i + 1}</span>
                <Input
                  type="number"
                  required
                  value={s.amount}
                  onChange={(e) => updateNewStep(i, "amount", e.target.value)}
                />
                <Input
                  type="number"
                  required
                  value={s.monthlyRate}
                  onChange={(e) => updateNewStep(i, "monthlyRate", e.target.value)}
                />
              </Fragment>
            ))}
          </div>

          {createGrade.isError && <p className="text-sm text-[var(--color-danger)]">{(createGrade.error as Error).message}</p>}
          <Button type="submit" disabled={createGrade.isPending} className="mt-2 w-fit">
            {createGrade.isPending ? "Saving…" : "Save"}
          </Button>
        </form>
      </Dialog>

      <Dialog
        open={tableDialogOpen}
        onClose={() => setTableDialogOpen(false)}
        title={editingTable ? "Edit Salary Grade Table" : "New Salary Grade Table"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editingTable) updateTable.mutate();
            else createTable.mutate();
          }}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tableName">Name</Label>
            <Input
              id="tableName"
              required
              placeholder='e.g. "2026 SSL 3rd Tranche - Health"'
              value={tableForm.name}
              onChange={(e) => setTableForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tableEffectiveDate">Effectivity date</Label>
            <Input
              id="tableEffectiveDate"
              type="date"
              value={tableForm.effectiveDate}
              onChange={(e) => setTableForm((f) => ({ ...f, effectiveDate: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tableDescription">Description</Label>
            <Input
              id="tableDescription"
              value={tableForm.description}
              onChange={(e) => setTableForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          {!editingTable && (
            <p className="text-xs text-[var(--color-muted)]">
              Starts empty — use "New Grade" afterward to add rows to it.
            </p>
          )}
          {(createTable.isError || updateTable.isError) && (
            <p className="text-sm text-[var(--color-danger)]">
              {((createTable.error ?? updateTable.error) as Error).message}
            </p>
          )}
          <Button type="submit" disabled={createTable.isPending || updateTable.isPending} className="mt-2 w-fit">
            {createTable.isPending || updateTable.isPending ? "Saving…" : "Save"}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
