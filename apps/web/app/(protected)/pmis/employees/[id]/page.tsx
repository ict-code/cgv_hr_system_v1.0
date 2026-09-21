"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Upload } from "lucide-react";
import Link from "next/link";
import { use, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiDownload, apiFetch, apiFetchAll, generateIdempotencyKey } from "@/lib/api";
import {
  downloadServiceRecordTemplate,
  parseFlexibleDate,
  parseServiceRecordWorkbook,
  type ServiceRecordPayload,
} from "@/lib/service-record-import";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  LEARNING_DEVELOPMENT_TYPES,
  LEARNING_DEVELOPMENT_TYPE_LABELS,
  PAY_MODE_LABELS,
  PAY_MODES,
  WORK_LEVEL_LABELS,
  WORK_LEVELS,
  type AppointmentStatusCode,
  type Department,
  type EmployeeDetail,
  type EmployeeEducation,
  type EmployeeEligibility,
  type EmploymentStatusCode,
  type EmployeeTraining,
  type EmployeeVoluntaryWork,
  type EmployeeWorkExperience,
  type Position,
  type SalaryGrade,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { AppointmentStatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
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
  status: z.string().min(1, "Required"),
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
  { key: "voluntary-work", label: "Voluntary Work" },
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
      <div className="print:hidden">
        <Link
          href="/pmis/employees"
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

      <div className="flex flex-wrap gap-1 border-b border-[var(--color-border)] print:hidden">
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
      {tab === "voluntary-work" && <VoluntaryWorkTab employee={emp} />}
      {tab === "service-record" && <ServiceRecordTab employee={emp} />}
    </div>
  );
}

function EducationTab({ employee }: { employee: EmployeeDetail }) {
  const columns: RecordColumn<EmployeeEducation>[] = [
    { key: "level", label: "Level" },
    { key: "schoolName", label: "School/University/College" },
    {
      key: "attendanceFrom",
      label: "Period of Attendance",
      render: (row) =>
        row.attendanceFrom || row.attendanceTo ? `${row.attendanceFrom ?? "—"} - ${row.attendanceTo ?? "—"}` : "—",
    },
    { key: "yearGraduated", label: "Year Graduated" },
    { key: "course", label: "Course/Degree", render: (row) => row.course ?? row.degree ?? "—" },
    { key: "honors", label: "Honors" },
  ];
  const fields: RecordField[] = [
    { key: "level", label: "Level", type: "text", required: true },
    { key: "schoolName", label: "School/University/College", type: "text", required: true },
    { key: "attendanceFrom", label: "Attendance From (year)", type: "number" },
    { key: "attendanceTo", label: "Attendance To (year)", type: "number" },
    { key: "yearGraduated", label: "Year Graduated", type: "number" },
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
    { key: "licenseNumber", label: "License No." },
    { key: "licenseValidity", label: "License Validity", render: (row) => formatDate(row.licenseValidity) },
  ];
  const fields: RecordField[] = [
    { key: "examName", label: "Examination/BAR", type: "text", required: true },
    { key: "examDate", label: "Examination Date", type: "date" },
    { key: "examPlace", label: "Place", type: "text" },
    { key: "rating", label: "Rating", type: "text" },
    { key: "licenseNumber", label: "License No.", type: "text" },
    { key: "licenseValidity", label: "License Date of Validity", type: "date" },
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
    {
      key: "periodCovered",
      label: "Period Covered",
      render: (row) =>
        row.startDate || row.endDate ? `${formatDate(row.startDate)} - ${formatDate(row.endDate)}` : "—",
    },
    { key: "conductor", label: "Conductor" },
    { key: "numberOfHours", label: "No. of Hours" },
    { key: "type", label: "Type of L&D", render: (row) => (row.type ? LEARNING_DEVELOPMENT_TYPE_LABELS[row.type] : "—") },
  ];
  const fields: RecordField[] = [
    { key: "trainingName", label: "Training/Study/Seminar", type: "text", required: true },
    { key: "startDate", label: "Start date (Period Covered from)", type: "date" },
    { key: "endDate", label: "End date (Period Covered to)", type: "date" },
    { key: "conductor", label: "Conductor", type: "text" },
    { key: "numberOfHours", label: "No. of Hours", type: "number" },
    {
      key: "type",
      label: "Type of L&D",
      type: "select",
      options: LEARNING_DEVELOPMENT_TYPES.map((t) => ({ value: t, label: LEARNING_DEVELOPMENT_TYPE_LABELS[t] })),
    },
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

function VoluntaryWorkTab({ employee }: { employee: EmployeeDetail }) {
  const columns: RecordColumn<EmployeeVoluntaryWork>[] = [
    { key: "organization", label: "Organization" },
    { key: "address", label: "Address" },
    { key: "startDate", label: "From", render: (row) => formatDate(row.startDate) },
    { key: "endDate", label: "To", render: (row) => formatDate(row.endDate) },
    { key: "numberOfHours", label: "No. of Hours" },
    { key: "position", label: "Position/Nature of Work" },
  ];
  const fields: RecordField[] = [
    { key: "organization", label: "Name of Organization", type: "text", required: true },
    { key: "address", label: "Address", type: "text" },
    { key: "startDate", label: "From", type: "date" },
    { key: "endDate", label: "To", type: "date" },
    { key: "numberOfHours", label: "No. of Hours", type: "number" },
    { key: "position", label: "Position/Nature of Work", type: "text" },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Voluntary Work / Civic Involvement</CardTitle>
      </CardHeader>
      <CardContent>
        <EmployeeRecordsTab<EmployeeVoluntaryWork>
          employeeId={employee.id}
          resourcePath="voluntary-work"
          queryKeySuffix="voluntary-work"
          columns={columns}
          fields={fields}
          emptyLabel="No voluntary work records yet."
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

  const appointmentStatuses = useQuery({
    queryKey: ["/appointment-statuses"],
    queryFn: () => apiFetchAll<AppointmentStatusCode>("/appointment-statuses"),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangeForm>({ resolver: zodResolver(changeSchema) });

  // Same key survives repeated submits of one pending change (a double-click
  // replays the original result instead of recording the change twice); a
  // fresh key is minted after each success so the next, distinct change for
  // this employee isn't mistaken for a resubmit of the last one.
  const recordChangeKey = useRef(generateIdempotencyKey());

  const recordChange = useMutation({
    mutationFn: (values: ChangeForm) =>
      apiFetch(`/employees/${id}/appointments`, {
        method: "POST",
        headers: { "Idempotency-Key": recordChangeKey.current },
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
      recordChangeKey.current = generateIdempotencyKey();
    },
  });

  const generatePds = useMutation({
    mutationFn: () =>
      apiDownload(
        `/employees/${id}/pds/export`,
        { method: "POST", headers: { "Content-Type": "application/json" } },
        `${emp.lastName}-${emp.firstName}-PDS.xlsx`,
      ),
  });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Personal Data Sheet</CardTitle>
          <Button size="sm" onClick={() => generatePds.mutate()} disabled={generatePds.isPending}>
            {generatePds.isPending ? "Generating…" : "Generate PDS"}
          </Button>
        </CardHeader>
        {generatePds.isError && (
          <CardContent className="pt-0">
            <p className="text-sm text-[var(--color-danger)]">{(generatePds.error as Error).message}</p>
          </CardContent>
        )}
      </Card>

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
                {appointmentStatuses.data?.map((s) => (
                  <option key={s.id} value={s.code}>
                    {s.code} - {s.description}
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
  const queryClient = useQueryClient();
  const [certifiedDate, setCertifiedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [signatoryName, setSignatoryName] = useState("");
  const [signatoryPosition, setSignatoryPosition] = useState("");
  const employmentStatuses = useQuery({
    queryKey: ["/employment-statuses"],
    queryFn: () => apiFetchAll<EmploymentStatusCode>("/employment-statuses"),
  });
  const departments = useQuery({
    queryKey: ["/departments"],
    queryFn: () => apiFetchAll<Department>("/departments"),
  });
  const positions = useQuery({
    queryKey: ["/positions"],
    queryFn: () => apiFetchAll<Position>("/positions"),
  });
  const salaryGrades = useQuery({
    queryKey: ["/salary-grades"],
    queryFn: () => apiFetchAll<SalaryGrade>("/salary-grades"),
  });

  const exportRecord = useMutation({
    mutationFn: () =>
      apiDownload(
        `/employees/${employee.id}/service-record/export`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            certifiedDate: certifiedDate ? formatDate(certifiedDate) : undefined,
            signatoryName: signatoryName || undefined,
            signatoryPosition: signatoryPosition || undefined,
          }),
        },
        `${employee.lastName}-${employee.firstName}-service-record.docx`,
      ),
  });

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<Record<string, string>>({});

  const addRecord = useMutation({
    mutationFn: async () => {
      const startDate = parseFlexibleDate(addForm.startDate ?? "");
      if (!startDate) throw new Error("From date is required");
      const payload: ServiceRecordPayload = {
        startDate,
        endDate: addForm.endDate ? parseFlexibleDate(addForm.endDate) : undefined,
        positionSnapshot: addForm.positionSnapshot || undefined,
        departmentSnapshot: addForm.departmentSnapshot || undefined,
        divisionSnapshot: addForm.divisionSnapshot || undefined,
        empStatusSnapshot: addForm.empStatusSnapshot || undefined,
        salarySnapshot: addForm.salarySnapshot ? Number(addForm.salarySnapshot) : undefined,
        actlSalarySnapshot: addForm.actlSalarySnapshot ? Number(addForm.actlSalarySnapshot) : undefined,
        grade: addForm.grade ? Number(addForm.grade) : undefined,
        step: addForm.step ? Number(addForm.step) : undefined,
        itemNo: addForm.itemNo || undefined,
        exitDate: addForm.exitDate ? parseFlexibleDate(addForm.exitDate) : undefined,
        exitCause: addForm.exitCause || undefined,
        leaveAbsence: addForm.leaveAbsence || undefined,
        remarks: addForm.remarks || undefined,
      };
      return apiFetch(`/employees/${employee.id}/service-records`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", employee.id] });
      setAddForm({});
      setAddOpen(false);
    },
  });

  const [csvOpen, setCsvOpen] = useState(false);
  const [csvFileName, setCsvFileName] = useState("");
  const [csvRecords, setCsvRecords] = useState<ServiceRecordPayload[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvParsing, setCsvParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleTemplateFile(file: File) {
    setCsvFileName(file.name);
    setCsvParsing(true);
    try {
      const { records, errors } = await parseServiceRecordWorkbook(file);
      setCsvRecords(records);
      setCsvErrors(errors);
    } catch {
      setCsvRecords([]);
      setCsvErrors(["Could not read this file — make sure it's the .xlsx template, not renamed or re-saved as .csv"]);
    } finally {
      setCsvParsing(false);
    }
  }

  const importCsv = useMutation({
    mutationFn: () =>
      apiFetch(`/employees/${employee.id}/service-records/import`, {
        method: "POST",
        body: JSON.stringify({ records: csvRecords }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", employee.id] });
      resetCsvDialog();
      setCsvOpen(false);
    },
  });

  function resetCsvDialog() {
    setCsvFileName("");
    setCsvRecords([]);
    setCsvErrors([]);
    setCsvParsing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Export service record</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="certifiedDate">Certified date</Label>
              <Input
                id="certifiedDate"
                type="date"
                value={certifiedDate}
                onChange={(e) => setCertifiedDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="signatoryName">Signatory name</Label>
              <Input
                id="signatoryName"
                value={signatoryName}
                onChange={(e) => setSignatoryName(e.target.value)}
                placeholder="e.g. Juan Dela Cruz"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="signatoryPosition">Signatory position</Label>
              <Input
                id="signatoryPosition"
                value={signatoryPosition}
                onChange={(e) => setSignatoryPosition(e.target.value)}
                placeholder="e.g. City HR Officer"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={() => exportRecord.mutate()} disabled={exportRecord.isPending}>
              {exportRecord.isPending ? "Exporting…" : "Export Service Record"}
            </Button>
            {exportRecord.isError && (
              <p className="text-sm text-[var(--color-danger)]">{(exportRecord.error as Error).message}</p>
            )}
          </div>
        </CardContent>
      </Card>

    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Service record</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCsvOpen(true)}>
            <Upload className="h-3.5 w-3.5" />
            Upload CSV
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Service Record
          </Button>
        </div>
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

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} title="Add service record" className="max-w-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addRecord.mutate();
          }}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sr-startDate">From date</Label>
            <Input
              id="sr-startDate"
              type="date"
              required
              value={addForm.startDate ?? ""}
              onChange={(e) => setAddForm((prev) => ({ ...prev, startDate: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sr-endDate">To date</Label>
            <Input
              id="sr-endDate"
              type="date"
              value={addForm.endDate ?? ""}
              onChange={(e) => setAddForm((prev) => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sr-position">Position / Designation</Label>
            <Input
              id="sr-position"
              value={addForm.positionSnapshot ?? ""}
              onChange={(e) => setAddForm((prev) => ({ ...prev, positionSnapshot: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sr-department">Office / Department</Label>
            <Input
              id="sr-department"
              value={addForm.departmentSnapshot ?? ""}
              onChange={(e) => setAddForm((prev) => ({ ...prev, departmentSnapshot: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sr-division">Division</Label>
            <Input
              id="sr-division"
              value={addForm.divisionSnapshot ?? ""}
              onChange={(e) => setAddForm((prev) => ({ ...prev, divisionSnapshot: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sr-empStatus">Employment status</Label>
            <Select
              id="sr-empStatus"
              value={addForm.empStatusSnapshot ?? ""}
              onChange={(e) => setAddForm((prev) => ({ ...prev, empStatusSnapshot: e.target.value }))}
            >
              <option value="">—</option>
              {employmentStatuses.data?.map((s) => (
                <option key={s.id} value={s.code}>
                  {s.description}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sr-monthlySalary">Monthly salary</Label>
            <Input
              id="sr-monthlySalary"
              type="number"
              step="0.01"
              value={addForm.salarySnapshot ?? ""}
              onChange={(e) => setAddForm((prev) => ({ ...prev, salarySnapshot: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sr-annualSalary">Annual salary</Label>
            <Input
              id="sr-annualSalary"
              type="number"
              step="0.01"
              value={addForm.actlSalarySnapshot ?? ""}
              onChange={(e) => setAddForm((prev) => ({ ...prev, actlSalarySnapshot: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sr-grade">Salary grade</Label>
            <Input
              id="sr-grade"
              value={addForm.grade ?? ""}
              onChange={(e) => setAddForm((prev) => ({ ...prev, grade: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sr-step">Step</Label>
            <Input
              id="sr-step"
              value={addForm.step ?? ""}
              onChange={(e) => setAddForm((prev) => ({ ...prev, step: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sr-itemNo">Item No.</Label>
            <Input
              id="sr-itemNo"
              value={addForm.itemNo ?? ""}
              onChange={(e) => setAddForm((prev) => ({ ...prev, itemNo: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sr-exitDate">Exit date</Label>
            <Input
              id="sr-exitDate"
              type="date"
              value={addForm.exitDate ?? ""}
              onChange={(e) => setAddForm((prev) => ({ ...prev, exitDate: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sr-exitCause">Exit cause</Label>
            <Input
              id="sr-exitCause"
              value={addForm.exitCause ?? ""}
              onChange={(e) => setAddForm((prev) => ({ ...prev, exitCause: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sr-leaveAbsence">Leave of absence</Label>
            <Input
              id="sr-leaveAbsence"
              value={addForm.leaveAbsence ?? ""}
              onChange={(e) => setAddForm((prev) => ({ ...prev, leaveAbsence: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="sr-remarks">Remarks</Label>
            <Input
              id="sr-remarks"
              value={addForm.remarks ?? ""}
              onChange={(e) => setAddForm((prev) => ({ ...prev, remarks: e.target.value }))}
            />
          </div>

          {addRecord.isError && (
            <p className="sm:col-span-2 text-sm text-[var(--color-danger)]">{(addRecord.error as Error).message}</p>
          )}

          <Button type="submit" disabled={addRecord.isPending} className="sm:col-span-2 w-fit">
            {addRecord.isPending ? "Saving…" : "Save"}
          </Button>
        </form>
      </Dialog>

      <Dialog
        open={csvOpen}
        onClose={() => {
          resetCsvDialog();
          setCsvOpen(false);
        }}
        title="Upload service record spreadsheet"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--color-muted)]">
            Download the blank template, fill in the missing service history rows in Excel, then upload the
            completed file here. Position/Designation, Office/Department, Employment Status, Salary Grade, and Step
            are dropdown lists in the template to prevent typos — click the cell and use the dropdown arrow, or
            start typing to jump to a matching entry. Dates must be in MM/DD/YYYY format.
          </p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => {
              const grades = salaryGrades.data ?? [];
              const gradeMax = Math.max(1, ...grades.map((g) => g.gradeNo));
              const stepMax = Math.max(1, ...grades.flatMap((g) => g.steps.map((s) => s.stepNo)));
              downloadServiceRecordTemplate({
                positions: positions.data ?? [],
                departments: departments.data ?? [],
                employmentStatuses: employmentStatuses.data ?? [],
                gradeMax,
                stepMax,
              });
            }}
          >
            Download template (.xlsx)
          </Button>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sr-csv-file">Filled-in spreadsheet</Label>
            <input
              id="sr-csv-file"
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleTemplateFile(file);
              }}
              className="text-sm"
            />
          </div>

          {csvFileName && (
            <div className="rounded-md border border-[var(--color-border)] bg-slate-50 p-3 text-sm">
              <p className="font-medium text-foreground">{csvFileName}</p>
              <p className="text-[var(--color-muted)]">
                {csvParsing ? "Reading file…" : `${csvRecords.length} record(s) ready to import`}
              </p>
              {csvErrors.length > 0 && (
                <ul className="mt-2 list-inside list-disc text-[var(--color-danger)]">
                  {csvErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {importCsv.isError && (
            <p className="text-sm text-[var(--color-danger)]">{(importCsv.error as Error).message}</p>
          )}

          <Button
            type="button"
            onClick={() => importCsv.mutate()}
            disabled={csvRecords.length === 0 || csvParsing || importCsv.isPending}
            className="w-fit"
          >
            {importCsv.isPending ? "Importing…" : `Import ${csvRecords.length} record(s)`}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
