"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Fragment, useState } from "react";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { SalaryGrade } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";

const emptySteps = Array.from({ length: 10 }, () => ({ amount: "", monthlyRate: "" }));

export default function SalaryGradesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [gradeNo, setGradeNo] = useState("");
  const [steps, setSteps] = useState(emptySteps);

  const salaryGrades = useQuery({
    queryKey: ["/salary-grades"],
    queryFn: () => apiFetch<SalaryGrade[]>("/salary-grades"),
  });

  const create = useMutation({
    mutationFn: () =>
      apiFetch<SalaryGrade>("/salary-grades", {
        method: "POST",
        body: JSON.stringify({
          gradeNo: Number(gradeNo),
          steps: steps.map((s) => ({ amount: Number(s.amount), monthlyRate: Number(s.monthlyRate) })),
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/salary-grades"] });
      setGradeNo("");
      setSteps(emptySteps);
      setDialogOpen(false);
    },
  });

  function updateStep(index: number, field: "amount" | "monthlyRate", value: string) {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  return (
    <div className="flex flex-col gap-4">
      <TableCard
        title="Salary Grades"
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
              <TableHead>Grade</TableHead>
              <TableHead>Step 1</TableHead>
              <TableHead>Step 10</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salaryGrades.isLoading && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-[var(--color-muted)]">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!salaryGrades.isLoading && (salaryGrades.data ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-[var(--color-muted)]">
                  No salary grades yet.
                </TableCell>
              </TableRow>
            )}
            {salaryGrades.data?.map((g) => (
              <TableRow key={g.id}>
                <TableCell>{g.gradeNo}</TableCell>
                <TableCell>{formatCurrency(g.steps.find((s) => s.stepNo === 1)?.monthlyRate)}</TableCell>
                <TableCell>{formatCurrency(g.steps.find((s) => s.stepNo === 10)?.monthlyRate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
                  onChange={(e) => updateStep(i, "amount", e.target.value)}
                />
                <Input
                  type="number"
                  required
                  value={s.monthlyRate}
                  onChange={(e) => updateStep(i, "monthlyRate", e.target.value)}
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
