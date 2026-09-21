"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { apiFetch, apiFetchAll, generateIdempotencyKey } from "@/lib/api";
import {
  PAY_MODE_LABELS,
  PAY_MODES,
  REGULAR_ELECTED_STATUSES,
  WORK_LEVEL_LABELS,
  WORK_LEVELS,
  type AppointmentStatusCode,
  type Department,
  type Employee,
  type EmploymentStatusCode,
  type PaginatedResult,
  type Plantilla,
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type Props = {
  open: boolean;
  onClose: () => void;
  defaultDepartmentId?: string;
  onCreated: (employeeId: string) => void;
};

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function AddForm({ defaultDepartmentId, onCreated }: Omit<Props, "open" | "onClose">) {
  const queryClient = useQueryClient();
  // One key per open of the dialog: a double-click/retry replays the first
  // result instead of appointing twice.
  const idempotencyKey = useRef(generateIdempotencyKey());

  const [departmentId, setDepartmentId] = useState(defaultDepartmentId ?? "");
  const [plantillaId, setPlantillaId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [empSearch, setEmpSearch] = useState("");
  const [debouncedEmpSearch, setDebouncedEmpSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedEmpSearch(empSearch.trim()), 300);
    return () => clearTimeout(timer);
  }, [empSearch]);
  const [f, setF] = useState({
    status: "",
    effectDate: "",
    employmentStatus: "",
    payMode: "",
    workLevel: "",
    actualSalary: "",
    monthlyRate: "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  const departments = useQuery({
    queryKey: ["/departments"],
    queryFn: () => apiFetchAll<Department>("/departments"),
  });
  const appointmentStatuses = useQuery({
    queryKey: ["/appointment-statuses"],
    queryFn: () => apiFetchAll<AppointmentStatusCode>("/appointment-statuses"),
  });
  const employmentStatuses = useQuery({
    queryKey: ["/employment-statuses"],
    queryFn: () => apiFetchAll<EmploymentStatusCode>("/employment-statuses"),
  });
  const vacant = useQuery({
    queryKey: ["/plantilla", "vacant", departmentId],
    queryFn: () => apiFetchAll<Plantilla>(`/plantilla?departmentId=${departmentId}&vacant=true&sort=itemNo`),
    enabled: !!departmentId,
    // Vacancy changes the moment someone is appointed — don't serve a cached list.
    staleTime: 0,
  });

  const employees = useQuery({
    queryKey: ["/employees", "appoint-picker", debouncedEmpSearch],
    queryFn: () =>
      apiFetch<PaginatedResult<Employee>>(
        `/employees?inactive=false&pageSize=20&search=${encodeURIComponent(debouncedEmpSearch)}`,
      ),
    enabled: debouncedEmpSearch.length >= 2,
  });

  const selected = vacant.data?.find((p) => p.id === plantillaId);
  const entryStatuses = appointmentStatuses.data?.filter((s) => s.mode === "ENTRY" && s.active) ?? [];
  const empStatuses = employmentStatuses.data?.filter((s) => REGULAR_ELECTED_STATUSES.includes(s.code)) ?? [];

  const create = useMutation({
    mutationFn: () =>
      apiFetch<{ employeeId: string }>(`/plantilla/${plantillaId}/appoint-employee`, {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey.current },
        body: JSON.stringify({
          employeeId,
          status: f.status,
          effectDate: new Date(f.effectDate).toISOString(),
          employmentStatus: f.employmentStatus || undefined,
          payMode: f.payMode || undefined,
          workLevel: f.workLevel || undefined,
          actualSalary: f.actualSalary ? Number(f.actualSalary) : undefined,
          monthlyRate: f.monthlyRate ? Number(f.monthlyRate) : undefined,
        }),
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/plantilla"] });
      onCreated(result.employeeId);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        create.mutate();
      }}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
    >
      <Field id="ap-office" label="Office">
        <Select
          id="ap-office"
          required
          value={departmentId}
          onChange={(e) => {
            setDepartmentId(e.target.value);
            setPlantillaId("");
          }}
        >
          <option value="">—</option>
          {departments.data?.map((d) => (
            <option key={d.id} value={d.id}>
              {d.deptDesc}
            </option>
          ))}
        </Select>
      </Field>

      <Field id="ap-item" label="Vacant position">
        <Select id="ap-item" required value={plantillaId} disabled={!departmentId} onChange={(e) => setPlantillaId(e.target.value)}>
          <option value="">
            {!departmentId ? "Select an office first" : vacant.isLoading ? "Loading…" : vacant.data?.length ? "—" : "No vacant positions"}
          </option>
          {vacant.data?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.itemNo} — {p.position?.positionDesc ?? "No position"}
              {p.grade ? ` (SG ${p.grade})` : ""}
            </option>
          ))}
        </Select>
      </Field>

      {selected && (
        <p className="sm:col-span-2 rounded-md bg-brand-50 px-3 py-2 text-xs text-[var(--color-muted)]">
          Item {selected.itemNo} · Grade {selected.grade ?? "—"} / Step {selected.step ?? "—"} · Authorized{" "}
          {formatCurrency(selected.authSalary)} · Actual {formatCurrency(selected.actualSalary)}
        </p>
      )}

      <Field id="ap-empSearch" label="Find employee (name or ID)">
        <Input
          id="ap-empSearch"
          placeholder="Type at least 2 characters"
          value={empSearch}
          onChange={(e) => {
            setEmpSearch(e.target.value);
            setEmployeeId("");
          }}
        />
      </Field>
      <Field id="ap-employee" label="Employee (from Personnel File)">
        <Select id="ap-employee" required value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
          <option value="">
            {debouncedEmpSearch.length < 2
              ? "Search first"
              : employees.isLoading
                ? "Loading…"
                : employees.data?.data.length
                  ? "—"
                  : "No matching employees"}
          </option>
          {employees.data?.data.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.lastName}, {emp.firstName} — {emp.idNo || emp.biometricId || emp.empNo}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="ap-effectDate" label="Effective date">
        <Input id="ap-effectDate" type="date" required value={f.effectDate} onChange={set("effectDate")} />
      </Field>
      <Field id="ap-status" label="Appointment status">
        <Select id="ap-status" required value={f.status} onChange={set("status")}>
          <option value="">—</option>
          {entryStatuses.map((s) => (
            <option key={s.id} value={s.code}>
              {s.code} - {s.description}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="ap-empStatus" label="Employment status">
        <Select id="ap-empStatus" value={f.employmentStatus} onChange={set("employmentStatus")}>
          <option value="">—</option>
          {empStatuses.map((s) => (
            <option key={s.id} value={s.code}>
              {s.description}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="ap-payMode" label="Term of payment">
        <Select id="ap-payMode" value={f.payMode} onChange={set("payMode")}>
          <option value="">—</option>
          {PAY_MODES.map((m) => (
            <option key={m} value={m}>
              {PAY_MODE_LABELS[m]}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="ap-workLevel" label="Occupational level">
        <Select id="ap-workLevel" value={f.workLevel} onChange={set("workLevel")}>
          <option value="">—</option>
          {WORK_LEVELS.map((l) => (
            <option key={l} value={l}>
              {WORK_LEVEL_LABELS[l]}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="ap-actual" label="Actual rate (defaults to the item's)">
        <Input id="ap-actual" type="number" step="any" value={f.actualSalary} onChange={set("actualSalary")} />
      </Field>
      <Field id="ap-monthly" label="Monthly rate">
        <Input id="ap-monthly" type="number" step="any" value={f.monthlyRate} onChange={set("monthlyRate")} />
      </Field>

      {create.isError && <p className="sm:col-span-2 text-sm text-[var(--color-danger)]">{(create.error as Error).message}</p>}

      <Button type="submit" disabled={create.isPending || !plantillaId || !employeeId} className="sm:col-span-2 w-fit">
        {create.isPending ? "Appointing…" : "Appoint employee"}
      </Button>
    </form>
  );
}

export function AddPlantillaEmployeeDialog({ open, onClose, defaultDepartmentId, onCreated }: Props) {
  return (
    <Dialog open={open} onClose={onClose} title="Appoint employee to a vacant position" className="max-w-2xl">
      {open && <AddForm defaultDepartmentId={defaultDepartmentId} onCreated={onCreated} />}
    </Dialog>
  );
}
