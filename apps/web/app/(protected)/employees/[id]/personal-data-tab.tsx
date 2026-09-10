"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Department, Division, EmployeeDetail, EmployeeSkill } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type FormState = Record<string, string>;

const DATE_FIELDS = new Set(["birthDate", "dateHired", "hiredDate", "appointDate"]);
const NUMBER_FIELDS = new Set(["height", "weight"]);
const BOOLEAN_FIELDS = new Set(["validated", "inactive"]);

function toFormState(emp: EmployeeDetail): FormState {
  const state: FormState = {};
  for (const [key, value] of Object.entries(emp)) {
    if (value === null || value === undefined) {
      state[key] = "";
    } else if (typeof value === "string" && DATE_FIELDS.has(key)) {
      state[key] = value.slice(0, 10);
    } else if (typeof value === "boolean") {
      state[key] = String(value);
    } else if (typeof value !== "object") {
      state[key] = String(value);
    }
  }
  return state;
}

function Field({
  form,
  setForm,
  name,
  label,
  type = "text",
}: {
  form: FormState;
  setForm: (updater: (prev: FormState) => FormState) => void;
  name: string;
  label: string;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type={type}
        value={form[name] ?? ""}
        onChange={(e) => setForm((prev) => ({ ...prev, [name]: e.target.value }))}
      />
    </div>
  );
}

export function PersonalDataTab({ employee }: { employee: EmployeeDetail }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(() => toFormState(employee));
  const [skillName, setSkillName] = useState("");

  const departments = useQuery({
    queryKey: ["/departments"],
    queryFn: () => apiFetch<Department[]>("/departments"),
  });

  const divisions = useQuery({
    queryKey: ["/divisions"],
    // No standalone divisions endpoint exists yet (Division has no CRUD module) —
    // divisions are entered as free selections is out of scope here; leaving the
    // select empty is fine since divisionId is optional and the field still works
    // once a Divisions admin screen exists.
    queryFn: () => Promise.resolve<Division[]>([]),
  });

  const save = useMutation({
    mutationFn: () => {
      const body: Record<string, unknown> = {};
      for (const [key, raw] of Object.entries(form)) {
        if (key === "id" || key === "empNo" || key === "createdAt" || key === "updatedAt") continue;
        if (raw === "") {
          continue;
        }
        if (NUMBER_FIELDS.has(key)) body[key] = Number(raw);
        else if (BOOLEAN_FIELDS.has(key)) body[key] = raw === "true";
        else body[key] = raw;
      }
      return apiFetch(`/employees/${employee.id}`, { method: "PATCH", body: JSON.stringify(body) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees", employee.id] }),
  });

  const skills = useQuery({
    queryKey: ["employees", employee.id, "skills"],
    queryFn: () => apiFetch<EmployeeSkill[]>(`/employees/${employee.id}/skills`),
    initialData: employee.skills,
  });

  const addSkill = useMutation({
    mutationFn: () =>
      apiFetch<EmployeeSkill>(`/employees/${employee.id}/skills`, {
        method: "POST",
        body: JSON.stringify({ name: skillName }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", employee.id, "skills"] });
      setSkillName("");
    },
  });

  const removeSkill = useMutation({
    mutationFn: (id: string) => apiFetch(`/employees/${employee.id}/skills/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees", employee.id, "skills"] }),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      className="flex flex-col gap-4"
    >
      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field form={form} setForm={setForm} name="lastName" label="Last name" />
          <Field form={form} setForm={setForm} name="firstName" label="First name" />
          <Field form={form} setForm={setForm} name="middleName" label="Middle name" />
          <Field form={form} setForm={setForm} name="suffix" label="Suffix" />
          <Field form={form} setForm={setForm} name="birthDate" label="Birth date" type="date" />
          <Field form={form} setForm={setForm} name="birthPlace" label="Birth place" />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sex">Sex</Label>
            <Select id="sex" value={form.sex ?? ""} onChange={(e) => setForm((p) => ({ ...p, sex: e.target.value }))}>
              <option value="">—</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </Select>
          </div>
          <Field form={form} setForm={setForm} name="civilStatus" label="Civil status" />
          <Field form={form} setForm={setForm} name="nationality" label="Nationality" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Physical / Identification</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field form={form} setForm={setForm} name="height" label="Height (m)" type="number" />
          <Field form={form} setForm={setForm} name="weight" label="Weight (kg)" type="number" />
          <Field form={form} setForm={setForm} name="bloodType" label="Blood type" />
          <Field form={form} setForm={setForm} name="idNo" label="I.D. No." />
          <Field form={form} setForm={setForm} name="biometricId" label="Biometric ID" />
          <Field form={form} setForm={setForm} name="pwdType" label="PWD type" />
          <Field form={form} setForm={setForm} name="religion" label="Religion" />
          <Field form={form} setForm={setForm} name="country" label="Country" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Work</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="departmentId">Department</Label>
            <Select
              id="departmentId"
              value={form.departmentId ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, departmentId: e.target.value }))}
            >
              <option value="">—</option>
              {departments.data?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.deptDesc}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="divisionId">Section / Division</Label>
            <Select
              id="divisionId"
              value={form.divisionId ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, divisionId: e.target.value }))}
            >
              <option value="">—</option>
              {divisions.data?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.divDesc}
                </option>
              ))}
            </Select>
          </div>
          <Field form={form} setForm={setForm} name="jobDescription" label="Job description" />
          <Field form={form} setForm={setForm} name="dateHired" label="Date hired" type="date" />
          <Field form={form} setForm={setForm} name="appointDate" label="Appointment date" type="date" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Present Address</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Field form={form} setForm={setForm} name="addrUnitNo" label="Unit no." />
          <Field form={form} setForm={setForm} name="addrStreet" label="Street" />
          <Field form={form} setForm={setForm} name="addrPhase" label="Phase" />
          <Field form={form} setForm={setForm} name="addrBlockNo" label="Blk no." />
          <Field form={form} setForm={setForm} name="addrLot" label="Lot no." />
          <Field form={form} setForm={setForm} name="addrBarangay" label="Barangay" />
          <Field form={form} setForm={setForm} name="addrLocality" label="Locality" />
          <Field form={form} setForm={setForm} name="addrProvince" label="Province" />
          <Field form={form} setForm={setForm} name="addrZip" label="Zip code" />
          <Field form={form} setForm={setForm} name="addrTelNo" label="Tel no." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permanent Address</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field form={form} setForm={setForm} name="permanentAddress" label="Permanent address" />
          <Field form={form} setForm={setForm} name="permanentTelNo" label="Tel no." />
          <Field form={form} setForm={setForm} name="permanentZipCode" label="Zip code" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact &amp; Government IDs</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field form={form} setForm={setForm} name="emailAddress" label="Email address" />
          <Field form={form} setForm={setForm} name="telNo" label="Tel no." />
          <Field form={form} setForm={setForm} name="cellNo" label="Mobile no." />
          <Field form={form} setForm={setForm} name="tin" label="TIN" />
          <Field form={form} setForm={setForm} name="gsisNo" label="GSIS BP No." />
          <Field form={form} setForm={setForm} name="pagibigNo" label="Pagibig No." />
          <Field form={form} setForm={setForm} name="philhealthNo" label="PhilHealth No." />
          <Field form={form} setForm={setForm} name="bankAccountNo" label="Bank Acct. No." />
          <Field form={form} setForm={setForm} name="taxStatus" label="Tax status" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {skills.data?.length === 0 && <p className="text-sm text-[var(--color-muted)]">No skills recorded yet.</p>}
            {skills.data?.map((s) => (
              <span
                key={s.id}
                className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
              >
                {s.name}
                <button
                  type="button"
                  onClick={() => removeSkill.mutate(s.id)}
                  aria-label={`Remove ${s.name}`}
                  className="text-slate-400 hover:text-[var(--color-danger)]"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="skillName">Add a skill</Label>
              <Input id="skillName" value={skillName} onChange={(e) => setSkillName(e.target.value)} className="w-56" />
            </div>
            <Button
              type="button"
              size="sm"
              disabled={!skillName || addSkill.isPending}
              onClick={() => addSkill.mutate()}
            >
              {addSkill.isPending ? "Adding…" : "Add"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Validation</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="validated">Validated</Label>
            <Select
              id="validated"
              value={form.validated ?? "false"}
              onChange={(e) => setForm((p) => ({ ...p, validated: e.target.value }))}
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </Select>
          </div>
          <Field form={form} setForm={setForm} name="validatedBy" label="Validated by" />
          <Field form={form} setForm={setForm} name="remarks" label="Remarks" />
        </CardContent>
      </Card>

      {save.isError && <p className="text-sm text-[var(--color-danger)]">{(save.error as Error).message}</p>}
      {save.isSuccess && <p className="text-sm text-[var(--color-success)]">Saved.</p>}

      <Button type="submit" disabled={save.isPending} className="w-fit">
        {save.isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
