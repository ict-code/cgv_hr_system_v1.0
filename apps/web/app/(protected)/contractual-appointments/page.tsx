"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiFetch, apiFetchAll } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  CONTRACTUAL_STATUSES,
  PAY_MODE_LABELS,
  PAY_MODES,
  type AppointmentStatusCode,
  type Department,
  type Employee,
  type PaginatedResult,
  type Position,
} from "@/lib/types";
import { useCurrentUser } from "@/hooks/use-current-user";
import { EmployeePicker } from "@/components/employee-picker";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";

const PAGE_SIZE = 20;

function optionalNumber(schema: z.ZodNumber) {
  return z.preprocess((val) => (val === "" ? undefined : val), schema.optional());
}

const formSchema = z.object({
  status: z.string().min(1, "Required"),
  effectDate: z.string().min(1, "Required"),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
  actualSalary: optionalNumber(z.coerce.number()),
  payMode: z.enum(PAY_MODES).optional().or(z.literal("")),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ContractualAppointmentsPage() {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const canEdit = currentUser?.permissions.includes("personnel:edit") ?? false;

  const [departmentId, setDepartmentId] = useState("");
  const [activeFilter, setActiveFilter] = useState<"active" | "inactive">("active");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogEmployee, setDialogEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, departmentId, activeFilter]);

  const departments = useQuery({
    queryKey: ["/departments"],
    queryFn: () => apiFetchAll<Department>("/departments"),
  });

  const positions = useQuery({
    queryKey: ["/positions"],
    queryFn: () => apiFetchAll<Position>("/positions"),
  });

  const appointmentStatuses = useQuery({
    queryKey: ["/appointment-statuses"],
    queryFn: () => apiFetchAll<AppointmentStatusCode>("/appointment-statuses"),
  });

  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
    inactive: String(activeFilter === "inactive"),
    employmentStatus: CONTRACTUAL_STATUSES.join(","),
  });
  if (departmentId) query.set("departmentId", departmentId);
  if (debouncedSearch) query.set("search", debouncedSearch);

  const list = useQuery({
    queryKey: ["/employees", "contractual-appointments", departmentId, activeFilter, debouncedSearch, page],
    queryFn: () => apiFetch<PaginatedResult<Employee>>(`/employees?${query.toString()}`),
  });

  const rows = list.data?.data ?? [];
  const total = list.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  const save = useMutation({
    mutationFn: (values: FormValues) => {
      if (!dialogEmployee) throw new Error("Select an employee first.");
      return apiFetch(`/employees/${dialogEmployee.id}/appointments`, {
        method: "POST",
        body: JSON.stringify({
          ...values,
          departmentId: values.departmentId || undefined,
          positionId: values.positionId || undefined,
          payMode: values.payMode || undefined,
          employmentStatus: "CL",
          effectDate: new Date(values.effectDate).toISOString(),
          startDate: values.startDate ? new Date(values.startDate).toISOString() : undefined,
          endDate: values.endDate ? new Date(values.endDate).toISOString() : undefined,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/employees", "contractual-appointments"] });
      closeDialog();
    },
  });

  const remove = useMutation({
    mutationFn: (employeeId: string) => apiFetch(`/employees/${employeeId}/appointments`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/employees", "contractual-appointments"] }),
  });

  function closeDialog() {
    setDialogOpen(false);
    setDialogEmployee(null);
    reset({});
  }

  function openNewDialog() {
    setDialogEmployee(null);
    reset({ status: undefined, effectDate: "", departmentId: "", positionId: "", actualSalary: undefined, payMode: "", startDate: "", endDate: "" });
    setDialogOpen(true);
  }

  function openEditDialog(emp: Employee) {
    const current = emp.appointments?.[0];
    setDialogEmployee(emp);
    reset({
      status: (current?.status as FormValues["status"]) ?? undefined,
      effectDate: current?.effectDate?.slice(0, 10) ?? "",
      departmentId: current?.departmentId ?? "",
      positionId: current?.positionId ?? "",
      actualSalary: current?.actualSalary ? Number(current.actualSalary) : undefined,
      payMode: (current?.payMode as FormValues["payMode"]) ?? "",
      startDate: current?.startDate?.slice(0, 10) ?? "",
      endDate: current?.endDate?.slice(0, 10) ?? "",
    });
    setDialogOpen(true);
  }

  function handleDelete(emp: Employee) {
    if (window.confirm(`Delete the current appointment for ${emp.lastName}, ${emp.firstName}?`)) {
      remove.mutate(emp.id);
    }
  }

  function periodCovered(startDate: string | null | undefined, endDate: string | null | undefined) {
    if (!startDate && !endDate) return "—";
    return `${startDate ? formatDate(startDate) : "—"} - ${endDate ? formatDate(endDate) : "—"}`;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Contract Appointment Records (Contractual/Job Order)</h1>
        <p className="text-sm text-[var(--color-muted)]">Contractual and Job Order engagements.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--color-border)] bg-white p-3">
        <Label htmlFor="deptFilter" className="shrink-0">
          Department:
        </Label>
        <Select id="deptFilter" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="w-auto min-w-56">
          <option value="">All Departments</option>
          {departments.data?.map((d) => (
            <option key={d.id} value={d.id}>
              {d.deptDesc}
            </option>
          ))}
        </Select>
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input type="radio" name="activeFilter" checked={activeFilter === "active"} onChange={() => setActiveFilter("active")} />
            Active
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" name="activeFilter" checked={activeFilter === "inactive"} onChange={() => setActiveFilter("inactive")} />
            In-Active
          </label>
        </div>
      </div>

      <TableCard
        title="Contractual / Job Order Appointments"
        search={search}
        onSearchChange={setSearch}
        headerExtra={
          canEdit && (
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
              <TableHead>Employee Name</TableHead>
              <TableHead>Effectivity Date</TableHead>
              <TableHead>Position</TableHead>
              <TableHead className="text-right">Salary Rate</TableHead>
              <TableHead>Base Unit</TableHead>
              <TableHead>Period Covered</TableHead>
              {canEdit && <TableHead className="w-20" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-[var(--color-muted)]">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!list.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-[var(--color-muted)]">
                  No contractual/job order appointments found.
                </TableCell>
              </TableRow>
            )}
            {rows.map((emp) => {
              const current = emp.appointments?.[0];
              return (
                <TableRow key={emp.id}>
                  <TableCell>
                    {emp.lastName}, {emp.firstName}
                  </TableCell>
                  <TableCell>{current?.effectDate ? formatDate(current.effectDate) : "—"}</TableCell>
                  <TableCell>{current?.position?.positionDesc ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(current?.actualSalary)}</TableCell>
                  <TableCell>{current?.payMode ? PAY_MODE_LABELS[current.payMode] : "—"}</TableCell>
                  <TableCell>{periodCovered(current?.startDate, current?.endDate)}</TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditDialog(emp)}
                          aria-label={`Edit ${emp.lastName}`}
                          className="text-[var(--color-muted)] hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(emp)}
                          aria-label={`Delete ${emp.lastName}`}
                          className="text-[var(--color-muted)] hover:text-[var(--color-danger)]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <Pagination page={page} pageCount={pageCount} totalItems={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </TableCard>

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        title={dialogEmployee ? "Edit Contractual Appointment" : "New Contractual Appointment"}
      >
        <form onSubmit={handleSubmit((values) => save.mutate(values))} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Employee</Label>
            <EmployeePicker value={dialogEmployee} onChange={setDialogEmployee} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="co-status">Change type</Label>
              <Select id="co-status" {...register("status")}>
                <option value="">—</option>
                {appointmentStatuses.data?.map((s) => (
                  <option key={s.id} value={s.code}>
                    {s.code} - {s.description}
                  </option>
                ))}
              </Select>
              {errors.status && <p className="text-sm text-[var(--color-danger)]">{errors.status.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="co-effectDate">Effective date</Label>
              <Input id="co-effectDate" type="date" {...register("effectDate")} />
              {errors.effectDate && <p className="text-sm text-[var(--color-danger)]">{errors.effectDate.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="co-departmentId">Department</Label>
              <Select id="co-departmentId" {...register("departmentId")}>
                <option value="">(unchanged)</option>
                {departments.data?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.deptDesc}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="co-positionId">Position</Label>
              <Select id="co-positionId" {...register("positionId")}>
                <option value="">(unchanged)</option>
                {positions.data?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.positionDesc}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="co-actualSalary">Salary rate</Label>
              <Input id="co-actualSalary" {...register("actualSalary")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="co-payMode">Base unit</Label>
              <Select id="co-payMode" {...register("payMode")}>
                <option value="">(unchanged)</option>
                {PAY_MODES.map((m) => (
                  <option key={m} value={m}>
                    {PAY_MODE_LABELS[m]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="co-startDate">Period start</Label>
              <Input id="co-startDate" type="date" {...register("startDate")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="co-endDate">Period end</Label>
              <Input id="co-endDate" type="date" {...register("endDate")} />
            </div>
          </div>

          {save.isError && <p className="text-sm text-[var(--color-danger)]">{(save.error as Error).message}</p>}
          <Button type="submit" disabled={isSubmitting || save.isPending} className="mt-2 w-fit">
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
