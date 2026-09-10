"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Fragment, useState } from "react";
import { apiFetch, apiFetchAll } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { PaginatedResult, SalaryGrade } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";

const PAGE_SIZE = 50;

// The real schedule only ever populates steps 1-8 (steps 9-10 exist in the
// schema/legacy EXTENT=10 array but are unused for every grade on record).
const STEP_COUNT = 8;

const emptySteps = Array.from({ length: 10 }, () => ({ amount: "", monthlyRate: "" }));

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
  const canEdit = currentUser?.permissions.includes("salaryGrades:edit") ?? false;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [gradeNo, setGradeNo] = useState("");
  const [steps, setSteps] = useState(emptySteps);
  const [page, setPage] = useState(1);

  const salaryGrades = useQuery({
    queryKey: ["/salary-grades", page],
    queryFn: () => apiFetch<PaginatedResult<SalaryGrade>>(`/salary-grades?page=${page}&pageSize=${PAGE_SIZE}`),
  });

  const rows = salaryGrades.data?.data ?? [];
  const total = salaryGrades.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const create = useMutation({
    mutationFn: () =>
      apiFetch<SalaryGrade>("/salary-grades", {
        method: "POST",
        body: JSON.stringify({
          gradeNo: Number(gradeNo),
          steps: steps.map((s) => ({ amount: Number(s.amount), monthlyRate: Number(s.monthlyRate) })),
        }),
      }),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/salary-grades"] });
      // Sorted by grade no. — jump to the page that will actually contain the new row.
      const all = await apiFetchAll<SalaryGrade>("/salary-grades");
      const index = all.findIndex((g) => g.gradeNo === Number(gradeNo));
      if (index >= 0) setPage(Math.floor(index / PAGE_SIZE) + 1);
      setGradeNo("");
      setSteps(emptySteps);
      setDialogOpen(false);
    },
  });

  function updateNewStep(index: number, field: "amount" | "monthlyRate", value: string) {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  return (
    <div className="flex flex-col gap-4">
      <TableCard
        title="Salary Grade File"
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
                <TableHead className="w-20">Grade No.</TableHead>
                {Array.from({ length: STEP_COUNT }, (_, i) => (
                  <TableHead key={i} className="text-right">
                    Step {i + 1}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {salaryGrades.isLoading && (
                <TableRow>
                  <TableCell colSpan={STEP_COUNT + 1} className="text-center text-[var(--color-muted)]">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!salaryGrades.isLoading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={STEP_COUNT + 1} className="text-center text-[var(--color-muted)]">
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        <Pagination page={page} pageCount={pageCount} totalItems={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </TableCard>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="New Salary Grade" className="max-w-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
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

          {create.isError && <p className="text-sm text-[var(--color-danger)]">{(create.error as Error).message}</p>}
          <Button type="submit" disabled={create.isPending} className="mt-2 w-fit">
            {create.isPending ? "Saving…" : "Save"}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
