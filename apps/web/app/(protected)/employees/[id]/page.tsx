"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { use } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiFetch } from "../../../../lib/api";
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUSES,
  EMPLOYMENT_STATUSES,
  type Department,
  type EmployeeDetail,
  type Position,
} from "../../../../lib/types";

const changeSchema = z.object({
  status: z.enum(APPOINTMENT_STATUSES),
  effectDate: z.string().min(1, "Required"),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
  employmentStatus: z.enum(EMPLOYMENT_STATUSES).optional().or(z.literal("")),
  actualSalary: z.coerce.number().optional(),
  monthlyRate: z.coerce.number().optional(),
  grade: z.coerce.number().int().optional(),
  stepNo: z.coerce.number().int().optional(),
  efficiencyRate: z.coerce.number().int().min(1).max(5).optional(),
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
    queryKey: ["departments"],
    queryFn: () => apiFetch<Department[]>("/departments"),
  });

  const positions = useQuery({
    queryKey: ["positions"],
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

  if (employee.isLoading) return <p>Loading…</p>;
  if (employee.isError) return <p className="text-red-600">{(employee.error as Error).message}</p>;
  if (!employee.data) return null;

  const emp = employee.data;
  const currentAppointment = emp.appointments[0];

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold">
          {emp.lastName}, {emp.firstName} {emp.middleName ?? ""}
        </h1>
        <p className="text-gray-500 text-sm">
          Emp. No. {emp.empNo} — {emp.department?.deptDesc ?? "No department"}
        </p>
      </div>

      {currentAppointment && (
        <section className="border rounded-lg p-4">
          <h2 className="font-medium mb-2">Current appointment</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <dt className="text-gray-500">Status</dt>
            <dd>
              {currentAppointment.status
                ? APPOINTMENT_STATUS_LABELS[currentAppointment.status] ?? currentAppointment.status
                : "—"}
            </dd>
            <dt className="text-gray-500">Department</dt>
            <dd>{currentAppointment.department?.deptDesc ?? "—"}</dd>
            <dt className="text-gray-500">Position</dt>
            <dd>{currentAppointment.position?.positionDesc ?? "—"}</dd>
            <dt className="text-gray-500">Salary</dt>
            <dd>{currentAppointment.actualSalary ?? "—"}</dd>
            <dt className="text-gray-500">Grade / Step</dt>
            <dd>
              {currentAppointment.grade ?? "—"} / {currentAppointment.stepNo ?? "—"}
            </dd>
            <dt className="text-gray-500">Effective</dt>
            <dd>{currentAppointment.effectDate?.slice(0, 10) ?? "—"}</dd>
          </dl>
        </section>
      )}

      <section className="border rounded-lg p-4">
        <h2 className="font-medium mb-3">Record appointment change</h2>
        <form
          onSubmit={handleSubmit((values) => recordChange.mutate(values))}
          className="grid grid-cols-2 gap-3"
        >
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Change type</label>
            <select className="border rounded px-3 py-2" {...register("status")}>
              <option value="">—</option>
              {APPOINTMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {APPOINTMENT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            {errors.status && <p className="text-sm text-red-600">{errors.status.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Effective date</label>
            <input type="date" className="border rounded px-3 py-2" {...register("effectDate")} />
            {errors.effectDate && (
              <p className="text-sm text-red-600">{errors.effectDate.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Department</label>
            <select className="border rounded px-3 py-2" {...register("departmentId")}>
              <option value="">(unchanged)</option>
              {departments.data?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.deptDesc}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Position</label>
            <select className="border rounded px-3 py-2" {...register("positionId")}>
              <option value="">(unchanged)</option>
              {positions.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.positionDesc}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Employment status</label>
            <select className="border rounded px-3 py-2" {...register("employmentStatus")}>
              <option value="">(unchanged)</option>
              {EMPLOYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Efficiency rating (1-5)</label>
            <input className="border rounded px-3 py-2" {...register("efficiencyRate")} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Actual salary</label>
            <input className="border rounded px-3 py-2" {...register("actualSalary")} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Monthly rate</label>
            <input className="border rounded px-3 py-2" {...register("monthlyRate")} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Grade</label>
            <input className="border rounded px-3 py-2" {...register("grade")} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Step</label>
            <input className="border rounded px-3 py-2" {...register("stepNo")} />
          </div>

          {recordChange.isError && (
            <p className="col-span-2 text-sm text-red-600">
              {(recordChange.error as Error).message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || recordChange.isPending}
            className="col-span-2 bg-black text-white rounded px-3 py-2 w-fit disabled:opacity-50"
          >
            {recordChange.isPending ? "Recording…" : "Record change"}
          </button>
        </form>
      </section>

      <section className="border rounded-lg p-4">
        <h2 className="font-medium mb-2">Change log</h2>
        <div className="divide-y text-sm">
          {emp.changeLogs.length === 0 && <p className="text-gray-500">No changes recorded yet.</p>}
          {emp.changeLogs.map((c) => (
            <div key={c.id} className="py-2 flex gap-4">
              <span className="text-gray-500 w-24">{c.effectDate.slice(0, 10)}</span>
              <span className="w-16">
                {c.oldStatusCode ?? "—"} → {c.statusCode}
              </span>
              <span>
                {c.oldActlSalary ?? "—"} → {c.actlSalary ?? "—"}
              </span>
              {c.changedByUser && (
                <span className="text-gray-400 ml-auto">by {c.changedByUser.fullName}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="border rounded-lg p-4">
        <h2 className="font-medium mb-2">Service record</h2>
        <div className="divide-y text-sm">
          {emp.serviceRecords.length === 0 && <p className="text-gray-500">No service history yet.</p>}
          {emp.serviceRecords.map((s) => (
            <div key={s.id} className="py-2 flex gap-4">
              <span className="text-gray-500 w-40">
                {s.startDate.slice(0, 10)} – {s.endDate ? s.endDate.slice(0, 10) : "present"}
              </span>
              <span>{s.positionSnapshot ?? "—"}</span>
              <span className="text-gray-400">{s.departmentSnapshot ?? "—"}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
