"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiFetch, apiFetchAll } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUSES,
  PAY_MODE_LABELS,
  PAY_MODES,
  WORK_LEVEL_LABELS,
  WORK_LEVELS,
  type Department,
  type EmployeeDetail,
  type EmployeeEducation,
  type EmployeeEligibility,
  type EmploymentStatusCode,
  type EmployeeTraining,
  type EmployeeWorkExperience,
  type Position,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { AppointmentStatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmployeeRecordsTab, type RecordColumn, type RecordField } from "@/components/employee-records-tab";
import { cn } from "@/lib/utils";
import { PersonalDataTab } from "./personal-data-tab";
import { FamilyBackgroundTab } from "./family-background-tab";

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
  efficiencyRate: optionalNumber(z.coerce.number().int().min(1).max(5)),
});

type ChangeForm = z.infer<typeof changeSchema>;

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "personal-data", label: "Personal Data" },
  { key: "family-background", label: "Family Background" },
  { key: "education", label: "Education" },
  { key: "eligibility", label: "Eligibility" },
  { key: "work-experience", label: "Work Experience" },
  { key: "training", label: "Training/Seminars" },
  { key: "service-record", label: "Service Record" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState<TabKey>("overview");

  const employee = useQuery({
    queryKey: ["employees", id],
    queryFn: () => apiFetch<EmployeeDetail>(`/employees/${id}`),
  });

  if (employee.isLoading) return <p className="text-sm text-[var(--color-muted)]">Loading…</p>;
  if (employee.isError) return <p className="text-sm text-[var(--color-danger)]">{(employee.error as Error).message}</p>;
  if (!employee.data) return null;

  const emp = employee.data;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href="/employees"
          className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-muted)] hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Employees
        </Link>
        <h1 className="text-xl font-bold text-foreground">
          {emp.lastName}, {emp.firstName} {emp.middleName ?? ""}
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          Employee ID {emp.idNo || emp.biometricId || emp.empNo} — {emp.department?.deptDesc ?? "No department"}
        </p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-[var(--color-border)]">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              tab === t.key
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-[var(--color-muted)] hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab employee={emp} />}
      {tab === "personal-data" && <PersonalDataTab employee={emp} />}
      {tab === "family-background" && <FamilyBackgroundTab employee={emp} />}
      {tab === "education" && <EducationTab employee={emp} />}
      {tab === "eligibility" && <EligibilityTab employee={emp} />}
      {tab === "work-experience" && <WorkExperienceTab employee={emp} />}
      {tab === "training" && <TrainingTab employee={emp} />}
      {tab === "service-record" && <ServiceRecordTab employee={emp} />}
    </div>
  );
}

function EducationTab({ employee }: { employee: EmployeeDetail }) {
  const columns: RecordColumn<EmployeeEducation>[] = [
    { key: "level", label: "Level" },
    { key: "schoolName", label: "School/University/College" },
    { key: "schoolYear", label: "School Year" },
    { key: "course", label: "Course/Degree", render: (row) => row.course ?? row.degree ?? "—" },
    { key: "honors", label: "Honors" },
  ];
  const fields: RecordField[] = [
    { key: "level", label: "Level", type: "text", required: true },
    { key: "schoolName", label: "School/University/College", type: "text", required: true },
    { key: "schoolYear", label: "School Year", type: "text" },
    { key: "course", label: "Course", type: "text" },
    { key: "degree", label: "Degree", type: "text" },
    { key: "honors", label: "Honor(s)", type: "text" },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Educational Background</CardTitle>
      </CardHeader>
      <CardContent>
        <EmployeeRecordsTab<EmployeeEducation>
          employeeId={employee.id}
          resourcePath="education"
          queryKeySuffix="education"
          columns={columns}
          fields={fields}
          emptyLabel="No education records yet."
        />
      </CardContent>
    </Card>
  );
}

function EligibilityTab({ employee }: { employee: EmployeeDetail }) {
  const columns: RecordColumn<EmployeeEligibility>[] = [
    { key: "examName", label: "Examination/BAR" },
    { key: "examDate", label: "Date(s)", render: (row) => formatDate(row.examDate) },
    { key: "examPlace", label: "Place of Examination" },
    { key: "rating", label: "Rating" },
  ];
  const fields: RecordField[] = [
    { key: "examName", label: "Examination/BAR", type: "text", required: true },
    { key: "examDate", label: "Examination Date", type: "date" },
    { key: "examPlace", label: "Place", type: "text" },
    { key: "rating", label: "Rating", type: "text" },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Eligibility Records</CardTitle>
      </CardHeader>
      <CardContent>
        <EmployeeRecordsTab<EmployeeEligibility>
          employeeId={employee.id}
          resourcePath="eligibility"
          queryKeySuffix="eligibility"
          columns={columns}
          fields={fields}
          emptyLabel="No eligibility records yet."
        />
      </CardContent>
    </Card>
  );
}

function WorkExperienceTab({ employee }: { employee: EmployeeDetail }) {
  const columns: RecordColumn<EmployeeWorkExperience>[] = [
    { key: "startDate", label: "From", render: (row) => formatDate(row.startDate) },
    { key: "endDate", label: "To", render: (row) => formatDate(row.endDate) },
    { key: "position", label: "Position" },
    { key: "company", label: "Company/Office" },
    { key: "salary", label: "Salary", render: (row) => formatCurrency(row.salary) },
    { key: "salaryUnit", label: "per" },
    { key: "employmentStatus", label: "Employment Status" },
  ];
  const fields: RecordField[] = [
    { key: "company", label: "Company/Office", type: "text", required: true },
    { key: "position", label: "Position", type: "text" },
    { key: "startDate", label: "From", type: "date" },
    { key: "endDate", label: "To", type: "date" },
    { key: "salary", label: "Salary", type: "number" },
    { key: "salaryUnit", label: "per (Monthly/Daily)", type: "text" },
    { key: "employmentStatus", label: "Employment Status", type: "text" },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Work Experience Records</CardTitle>
      </CardHeader>
      <CardContent>
        <EmployeeRecordsTab<EmployeeWorkExperience>
          employeeId={employee.id}
          resourcePath="work-experience"
          queryKeySuffix="work-experience"
          columns={columns}
          fields={fields}
          emptyLabel="No work experience records yet."
        />
      </CardContent>
    </Card>
  );
}

function TrainingTab({ employee }: { employee: EmployeeDetail }) {
  const columns: RecordColumn<EmployeeTraining>[] = [
    { key: "trainingName", label: "Training/Study/Seminar" },
    { key: "periodCovered", label: "Period Covered" },
    { key: "conductor", label: "Conductor" },
    { key: "numberOfHours", label: "No. of Hours" },
  ];
  const fields: RecordField[] = [
    { key: "trainingName", label: "Training/Study/Seminar", type: "text", required: true },
    { key: "startDate", label: "Start date", type: "date" },
    { key: "endDate", label: "End date", type: "date" },
    { key: "conductor", label: "Conductor", type: "text" },
    { key: "periodCovered", label: "Period Covered", type: "text" },
    { key: "numberOfHours", label: "No. of Hours", type: "number" },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Training/Study/Seminar Records</CardTitle>
      </CardHeader>
      <CardContent>
        <EmployeeRecordsTab<EmployeeTraining>
          employeeId={employee.id}
          resourcePath="training"
          queryKeySuffix="training"
          columns={columns}
          fields={fields}
          emptyLabel="No training records yet."
        />
      </CardContent>
    </Card>
  );
}

function OverviewTab({ employee }: { employee: EmployeeDetail }) {
  const id = employee.id;
  const queryClient = useQueryClient();
  const emp = employee;
  const currentAppointment = emp.appointments[0];

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
      apiFetch(`/employees/${id}/appointments`, {
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
      queryClient.invalidateQueries({ queryKey: ["employees", id] });
      reset();
    },
  });

  return (
    <div className="flex flex-col gap-4">
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
                <dt className="text-xs text-[var(--color-muted)]">Employment status</dt>
                <dd className="mt-0.5">
                  {employmentStatuses.data?.find((s) => s.code === currentAppointment.employmentStatus)?.description ??
                    currentAppointment.employmentStatus ??
                    "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-muted)]">Term of payment</dt>
                <dd className="mt-0.5">
                  {currentAppointment.payMode ? PAY_MODE_LABELS[currentAppointment.payMode] : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-muted)]">Occupational level</dt>
                <dd className="mt-0.5">
                  {currentAppointment.workLevel ? WORK_LEVEL_LABELS[currentAppointment.workLevel] : "—"}
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
                {employmentStatuses.data?.map((s) => (
                  <option key={s.id} value={s.code}>
                    {s.description}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="payMode">Term of payment</Label>
              <Select id="payMode" {...register("payMode")}>
                <option value="">(unchanged)</option>
                {PAY_MODES.map((m) => (
                  <option key={m} value={m}>
                    {PAY_MODE_LABELS[m]}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="workLevel">Occupational level</Label>
              <Select id="workLevel" {...register("workLevel")}>
                <option value="">(unchanged)</option>
                {WORK_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {WORK_LEVEL_LABELS[l]}
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
    </div>
  );
}

function ServiceRecordTab({ employee }: { employee: EmployeeDetail }) {
  const employmentStatuses = useQuery({
    queryKey: ["/employment-statuses"],
    queryFn: () => apiFetchAll<EmploymentStatusCode>("/employment-statuses"),
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Service record</CardTitle>
      </CardHeader>
      <Table bare>
        <TableHeader>
          <TableRow>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Salary</TableHead>
            <TableHead>Office / Department</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employee.serviceRecords.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-[var(--color-muted)]">
                No service history yet.
              </TableCell>
            </TableRow>
          )}
          {employee.serviceRecords.map((s) => (
            <TableRow key={s.id}>
              <TableCell>{formatDate(s.startDate)}</TableCell>
              <TableCell>{s.endDate ? formatDate(s.endDate) : "Present"}</TableCell>
              <TableCell>{s.positionSnapshot ?? "—"}</TableCell>
              <TableCell>
                {employmentStatuses.data?.find((es) => es.code === s.empStatusSnapshot)?.description ??
                  s.empStatusSnapshot ??
                  "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {s.salarySnapshot ? `${formatCurrency(s.salarySnapshot)}${s.salaryUnitSnapshot ? ` / ${s.salaryUnitSnapshot}` : ""}` : "—"}
              </TableCell>
              <TableCell className="text-[var(--color-muted)]">{s.departmentSnapshot ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
