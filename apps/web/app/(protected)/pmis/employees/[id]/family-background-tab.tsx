"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { EmployeeDetail } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmployeeRecordsTab, type RecordColumn, type RecordField } from "@/components/employee-records-tab";
import type { Dependent } from "@/lib/types";

const FIELDS = ["fatherName", "fatherBirthPlace", "motherName", "motherBirthPlace", "spouseName", "spouseWork"] as const;

const dependentColumns: RecordColumn<Dependent>[] = [
  { key: "name", label: "Child's name" },
  { key: "birthDate", label: "Birth date", render: (row) => formatDate(row.birthDate) },
  { key: "age", label: "Age" },
];

const dependentFields: RecordField[] = [
  { key: "name", label: "Child's name", type: "text", required: true },
  { key: "birthDate", label: "Birth date", type: "date" },
  { key: "age", label: "Age", type: "number" },
];

export function FamilyBackgroundTab({ employee }: { employee: EmployeeDetail }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() =>
    Object.fromEntries(FIELDS.map((f) => [f, employee[f] ?? ""])) as Record<(typeof FIELDS)[number], string>,
  );

  const save = useMutation({
    mutationFn: () => {
      const body: Record<string, string | undefined> = {};
      for (const key of FIELDS) {
        body[key] = form[key] || undefined;
      }
      return apiFetch(`/employees/${employee.id}`, { method: "PATCH", body: JSON.stringify(body) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees", employee.id] }),
  });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Family Background</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fatherName">Father&apos;s name</Label>
              <Input id="fatherName" value={form.fatherName} onChange={(e) => setForm((p) => ({ ...p, fatherName: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fatherBirthPlace">Father&apos;s birth place</Label>
              <Input
                id="fatherBirthPlace"
                value={form.fatherBirthPlace}
                onChange={(e) => setForm((p) => ({ ...p, fatherBirthPlace: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="motherName">Mother&apos;s name</Label>
              <Input id="motherName" value={form.motherName} onChange={(e) => setForm((p) => ({ ...p, motherName: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="motherBirthPlace">Mother&apos;s birth place</Label>
              <Input
                id="motherBirthPlace"
                value={form.motherBirthPlace}
                onChange={(e) => setForm((p) => ({ ...p, motherBirthPlace: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="spouseName">Spouse name</Label>
              <Input id="spouseName" value={form.spouseName} onChange={(e) => setForm((p) => ({ ...p, spouseName: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="spouseWork">Spouse occupation</Label>
              <Input id="spouseWork" value={form.spouseWork} onChange={(e) => setForm((p) => ({ ...p, spouseWork: e.target.value }))} />
            </div>

            {save.isError && (
              <p className="sm:col-span-2 text-sm text-[var(--color-danger)]">{(save.error as Error).message}</p>
            )}

            <Button type="submit" disabled={save.isPending} className="w-fit">
              {save.isPending ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Children</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeRecordsTab<Dependent>
            employeeId={employee.id}
            resourcePath="dependents"
            queryKeySuffix="dependents"
            columns={dependentColumns}
            fields={dependentFields}
            emptyLabel="No children recorded yet."
          />
        </CardContent>
      </Card>
    </div>
  );
}
