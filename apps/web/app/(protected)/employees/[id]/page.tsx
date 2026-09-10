"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { use } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiFetch } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUSES,
  EMPLOYMENT_STATUSES,
  type Department,
  type EmployeeDetail,
  type Position,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { AppointmentStatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  employmentStatus: z.enum(EMPLOYMENT_STATUSES).optional().or(z.literal("")),
  actualSalary: optionalNumber(z.coerce.number()),
  monthlyRate: optionalNumber(z.coerce.number()),
  grade: optionalNumber(z.coerce.number().int()),
  stepNo: optionalNumber(z.coerce.number().int()),
  efficiencyRate: optionalNumber(z.coerce.number().int().min(1).max(5)),
});

type ChangeForm = z.infer<typeof changeSchema>;

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const employee = useQuery({
    queryKey: ["employees", id],
    queryFn: () => apiFetch<EmployeeDetail>(`/employees/${id}`),
  });

  const departments = useQuery({
    queryKey: ["/departments"],
    queryFn: () => apiFetch<Department[]>("/departments"),
  });

  const positions = useQuery({
    queryKey: ["/positions"],
    queryFn: () => apiFetch<Position[]>("/positions"),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangeForm>({ resolver: zodResolver(changeSchema) });

  const recordChange = useMutation({
    mutationFn: (values: ChangeForm) =>
      apiFetch(`/employees/${id}/appointments`, {
        method: "POST",
        body: JSON.stringify({
          ...values,
          departmentId: values.departmentId || undefined,
          positionId: values.positionId || undefined,
          employmentStatus: values.employmentStatus || undefined,
          effectDate: new Date(values.effectDate).toISOString(),
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", id] });
      reset();
    },
  });

  if (employee.isLoading) return <p className="text-sm text-[var(--color-muted)]">Loading…</p>;
  if (employee.isError) return <p className="text-sm text-[var(--color-danger)]">{(employee.error as Error).message}</p>;
  if (!employee.data) return null;

  const emp = employee.data;
  const currentAppointment = emp.appointments[0];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">
          {emp.lastName}, {emp.firstName} {emp.middleName ?? ""}
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          Emp. No. {emp.empNo} — {emp.department?.deptDesc ?? "No department"}
        </p>
      </div>

      {currentAppointment && (
        <Card>
          <CardHeader>
            <CardTitle>Current appointment</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-[var(--color-muted)]">Status</dt>
                <dd className="mt-0.5">
                  {currentAppointment.status ? <AppointmentStatusBadge status={currentAppointment.status} /> : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-muted)]">Department</dt>
                <dd className="mt-0.5">{currentAppointment.department?.deptDesc ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-muted)]">Position</dt>
                <dd className="mt-0.5">{currentAppointment.position?.positionDesc ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-muted)]">Salary</dt>
                <dd className="mt-0.5">{formatCurrency(currentAppointment.actualSalary)}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-muted)]">Grade / Step</dt>
                <dd className="mt-0.5">
                  {currentAppointment.grade ?? "—"} / {currentAppointment.stepNo ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-muted)]">Effective</dt>
                <dd className="mt-0.5">{formatDate(currentAppointment.effectDate)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

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
              <Label htmlFor="status">Change type</Label>
              <Select id="status" {...register("status")}>
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
              <Label htmlFor="effectDate">Effective date</Label>
              <Input id="effectDate" type="date" {...register("effectDate")} />
              {errors.effectDate && <p className="text-sm text-[var(--color-danger)]">{errors.effectDate.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="departmentId">Department</Label>
              <Select id="departmentId" {...register("departmentId")}>
                <option value="">(unchanged)</option>
                {departments.data?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.deptDesc}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="positionId">Position</Label>
              <Select id="positionId" {...register("positionId")}>
                <option value="">(unchanged)</option>
                {positions.data?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.positionDesc}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="employmentStatus">Employment status</Label>
              <Select id="employmentStatus" {...register("employmentStatus")}>
                <option value="">(unchanged)</option>
                {EMPLOYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="efficiencyRate">Efficiency rating (1-5)</Label>
              <Input id="efficiencyRate" {...register("efficiencyRate")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="actualSalary">Actual salary</Label>
              <Input id="actualSalary" {...register("actualSalary")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="monthlyRate">Monthly rate</Label>
              <Input id="monthlyRate" {...register("monthlyRate")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="grade">Grade</Label>
              <Input id="grade" {...register("grade")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="stepNo">Step</Label>
              <Input id="stepNo" {...register("stepNo")} />
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

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Change log</CardTitle>
        </CardHeader>
        <Table bare>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead>By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {emp.changeLogs.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-[var(--color-muted)]">
                  No changes recorded yet.
                </TableCell>
              </TableRow>
            )}
            {emp.changeLogs.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{formatDate(c.effectDate)}</TableCell>
                <TableCell>
                  {c.oldStatusCode ?? "—"} → {c.statusCode}
                </TableCell>
                <TableCell>
                  {formatCurrency(c.oldActlSalary)} → {formatCurrency(c.actlSalary)}
                </TableCell>
                <TableCell className="text-[var(--color-muted)]">{c.changedByUser?.fullName ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Service record</CardTitle>
        </CardHeader>
        <Table bare>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Department</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {emp.serviceRecords.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-[var(--color-muted)]">
                  No service history yet.
                </TableCell>
              </TableRow>
            )}
            {emp.serviceRecords.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  {formatDate(s.startDate)} – {s.endDate ? formatDate(s.endDate) : "present"}
                </TableCell>
                <TableCell>{s.positionSnapshot ?? "—"}</TableCell>
                <TableCell className="text-[var(--color-muted)]">{s.departmentSnapshot ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
