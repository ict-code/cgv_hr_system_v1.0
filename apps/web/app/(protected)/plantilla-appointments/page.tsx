"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiFetch, apiFetchAll } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUSES,
  PAY_MODE_LABELS,
  PAY_MODES,
  REGULAR_ELECTED_STATUSES,
  WORK_LEVEL_LABELS,
  WORK_LEVELS,
  type Department,
  type Employee,
  type EmployeeDetail,
  type EmploymentStatusCode,
  type PaginatedResult,
  type Position,
} from "@/lib/types";
import { AppointmentStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

// An untouched number input's RHF value is "" (not undefined), which
// z.coerce.number() turns into NaN and rejects — even when the field is
// .optional(). Preprocess "" to undefined first so leaving an optional
// numeric field blank actually validates as "not provided".
function optionalNumber(schema: z.ZodNumber) {
  return z.preprocess((val) => (val === "" ? undefined : val), schema.optional());
}

const changeSchema = z.object({
  status: z.enum(APPOINTMENT_STATUSES),
  effectDate: z.string().min(1, "Required"),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
  employmentStatus: z.string().optional(),
  payMode: z.enum(PAY_MODES).optional().or(z.literal("")),
  workLevel: z.enum(WORK_LEVELS).optional().or(z.literal("")),
  actualSalary: optionalNumber(z.coerce.number()),
  monthlyRate: optionalNumber(z.coerce.number()),
  grade: optionalNumber(z.coerce.number().int()),
  stepNo: optionalNumber(z.coerce.number().int()),
});

type ChangeForm = z.infer<typeof changeSchema>;

export default function PlantillaAppointmentsPage() {
  const [departmentId, setDepartmentId] = useState("");
  const [activeFilter, setActiveFilter] = useState<"active" | "inactive">("active");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
    inactive: String(activeFilter === "inactive"),
    employmentStatus: REGULAR_ELECTED_STATUSES.join(","),
  });
  if (departmentId) query.set("departmentId", departmentId);
  if (debouncedSearch) query.set("search", debouncedSearch);

  const list = useQuery({
    queryKey: ["/employees", "plantilla-appointments", departmentId, activeFilter, debouncedSearch, page],
    queryFn: () => apiFetch<PaginatedResult<Employee>>(`/employees?${query.toString()}`),
  });

  const rows = list.data?.data ?? [];
  const total = list.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Regular/Elected</h1>
        <p className="text-sm text-[var(--color-muted)]">Browse by office and record appointment changes.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="gap-2 pb-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deptFilter">Office</Label>
              <Select id="deptFilter" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
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
                  name="activeFilter"
                  checked={activeFilter === "active"}
                  onChange={() => setActiveFilter("active")}
                />
                Active
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="activeFilter"
                  checked={activeFilter === "inactive"}
                  onChange={() => setActiveFilter("inactive")}
                />
                In-Active
              </label>
            </div>
            <Input placeholder="Search name or employee ID" value={search} onChange={(e) => setSearch(e.target.value)} />
          </CardHeader>
          <div className="max-h-[60vh] overflow-y-auto border-t border-[var(--color-border)]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left">
                <tr>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Item No.</th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Employee Name</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                    Monthly Salary
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {list.isLoading && (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-center text-[var(--color-muted)]">
                      Loading…
                    </td>
                  </tr>
                )}
                {!list.isLoading && rows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-center text-[var(--color-muted)]">
                      No employees found.
                    </td>
                  </tr>
                )}
                {rows.map((emp) => {
                  const current = emp.appointments?.[0];
                  return (
                    <tr
                      key={emp.id}
                      onClick={() => setSelectedId(emp.id)}
                      className={cn(
                        "cursor-pointer hover:bg-brand-50",
                        selectedId === emp.id && "bg-brand-50 font-medium",
                      )}
                    >
                      <td className="px-3 py-2">{current?.itemNo ?? "—"}</td>
                      <td className="px-3 py-2">
                        {emp.lastName}, {emp.firstName}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatCurrency(current?.monthlyRate ?? current?.actualSalary)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-[var(--color-border)]">
            <Pagination page={page} pageCount={pageCount} totalItems={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </div>
        </Card>

        {selectedId ? (
          <AppointmentDetail employeeId={selectedId} />
        ) : (
          <Card className="flex items-center justify-center p-10 text-sm text-[var(--color-muted)]">
            Select an employee from the list to view or record an appointment change.
          </Card>
        )}
      </div>
    </div>
  );
}

function AppointmentDetail({ employeeId }: { employeeId: string }) {
  const queryClient = useQueryClient();

  const employee = useQuery({
    queryKey: ["employees", employeeId],
    queryFn: () => apiFetch<EmployeeDetail>(`/employees/${employeeId}`),
  });

  const departments = useQuery({
    queryKey: ["/departments"],
    queryFn: () => apiFetchAll<Department>("/departments"),
  });

  const positions = useQuery({
    queryKey: ["/positions"],
    queryFn: () => apiFetchAll<Position>("/positions"),
  });

  const employmentStatuses = useQuery({
    queryKey: ["/employment-statuses"],
    queryFn: () => apiFetchAll<EmploymentStatusCode>("/employment-statuses"),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangeForm>({ resolver: zodResolver(changeSchema) });

  const recordChange = useMutation({
    mutationFn: (values: ChangeForm) =>
      apiFetch(`/employees/${employeeId}/appointments`, {
        method: "POST",
        body: JSON.stringify({
          ...values,
          departmentId: values.departmentId || undefined,
          positionId: values.positionId || undefined,
          employmentStatus: values.employmentStatus || undefined,
          payMode: values.payMode || undefined,
          workLevel: values.workLevel || undefined,
          effectDate: new Date(values.effectDate).toISOString(),
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", employeeId] });
      queryClient.invalidateQueries({ queryKey: ["/employees", "plantilla-appointments"] });
      reset();
    },
  });

  if (employee.isLoading) return <Card className="p-6 text-sm text-[var(--color-muted)]">Loading…</Card>;
  if (employee.isError || !employee.data) {
    return <Card className="p-6 text-sm text-[var(--color-danger)]">Could not load this employee.</Card>;
  }

  const emp = employee.data;
  const current = emp.appointments[0];
  const employmentStatusDesc = employmentStatuses.data?.find((s) => s.code === current?.employmentStatus)?.description;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {emp.lastName}, {emp.firstName} {emp.middleName ?? ""} — {emp.idNo || emp.biometricId || emp.empNo}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {current ? (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-[var(--color-muted)]">Appointment Status</dt>
                <dd className="mt-0.5">{current.status ? <AppointmentStatusBadge status={current.status} /> : "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-muted)]">Employment Status</dt>
                <dd className="mt-0.5">{employmentStatusDesc ?? current.employmentStatus ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-muted)]">Term of Payment</dt>
                <dd className="mt-0.5">{current.payMode ? PAY_MODE_LABELS[current.payMode] : "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-muted)]">Occupational Level</dt>
                <dd className="mt-0.5">{current.workLevel ? WORK_LEVEL_LABELS[current.workLevel] : "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-muted)]">Item No.</dt>
                <dd className="mt-0.5">{current.itemNo ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-muted)]">Effectivity Date</dt>
                <dd className="mt-0.5">{formatDate(current.effectDate)}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-muted)]">Office</dt>
                <dd className="mt-0.5">{current.department?.deptDesc ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-muted)]">Position</dt>
                <dd className="mt-0.5">{current.position?.positionDesc ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-muted)]">Job Description</dt>
                <dd className="mt-0.5">{emp.jobDescription ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-muted)]">Salary Grade / Step</dt>
                <dd className="mt-0.5">
                  {current.grade ?? "—"} / {current.stepNo ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-muted)]">Authorized Rate</dt>
                <dd className="mt-0.5">{formatCurrency(current.authSalary)}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-muted)]">Actual Rate</dt>
                <dd className="mt-0.5">{formatCurrency(current.actualSalary)}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-muted)]">Monthly Rate</dt>
                <dd className="mt-0.5">{formatCurrency(current.monthlyRate)}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-muted)]">Tax Status</dt>
                <dd className="mt-0.5">{emp.taxStatus ?? "—"}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-[var(--color-muted)]">No appointment on record yet for this employee.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Record appointment change</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((values) => recordChange.mutate(values))}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pa-status">Change type</Label>
              <Select id="pa-status" {...register("status")}>
                <option value="">—</option>
                {APPOINTMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {APPOINTMENT_STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
              {errors.status && <p className="text-sm text-[var(--color-danger)]">{errors.status.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pa-effectDate">Effective date</Label>
              <Input id="pa-effectDate" type="date" {...register("effectDate")} />
              {errors.effectDate && <p className="text-sm text-[var(--color-danger)]">{errors.effectDate.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pa-departmentId">Office</Label>
              <Select id="pa-departmentId" {...register("departmentId")}>
                <option value="">(unchanged)</option>
                {departments.data?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.deptDesc}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pa-positionId">Position</Label>
              <Select id="pa-positionId" {...register("positionId")}>
                <option value="">(unchanged)</option>
                {positions.data?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.positionDesc}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pa-employmentStatus">Employment status</Label>
              <Select id="pa-employmentStatus" {...register("employmentStatus")}>
                <option value="">(unchanged)</option>
                {employmentStatuses.data?.map((s) => (
                  <option key={s.id} value={s.code}>
                    {s.description}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pa-payMode">Term of payment</Label>
              <Select id="pa-payMode" {...register("payMode")}>
                <option value="">(unchanged)</option>
                {PAY_MODES.map((m) => (
                  <option key={m} value={m}>
                    {PAY_MODE_LABELS[m]}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pa-workLevel">Occupational level</Label>
              <Select id="pa-workLevel" {...register("workLevel")}>
                <option value="">(unchanged)</option>
                {WORK_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {WORK_LEVEL_LABELS[l]}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pa-grade">Salary grade</Label>
              <Input id="pa-grade" {...register("grade")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pa-stepNo">Step</Label>
              <Input id="pa-stepNo" {...register("stepNo")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pa-actualSalary">Actual rate</Label>
              <Input id="pa-actualSalary" {...register("actualSalary")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pa-monthlyRate">Monthly rate</Label>
              <Input id="pa-monthlyRate" {...register("monthlyRate")} />
            </div>

            {Object.keys(errors).length > 0 && (
              <p className="sm:col-span-2 text-sm text-[var(--color-danger)]">
                {Object.values(errors)
                  .map((e) => e?.message)
                  .filter(Boolean)
                  .join(" · ") || "Check the highlighted fields."}
              </p>
            )}

            {recordChange.isError && (
              <p className="sm:col-span-2 text-sm text-[var(--color-danger)]">{(recordChange.error as Error).message}</p>
            )}

            <Button type="submit" disabled={isSubmitting || recordChange.isPending} className="sm:col-span-2 w-fit">
              {recordChange.isPending ? "Recording…" : "Record change"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
