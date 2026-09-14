"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { apiFetch, apiFetchAll } from "@/lib/api";
import {
  downloadServiceRecordTemplate,
  parseServiceRecordWorkbook,
  type ServiceRecordPayloadWithEmpNo,
} from "@/lib/service-record-import";
import type { Department, EmploymentStatusCode, Position, SalaryGrade } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function ImportServiceRecordsPage() {
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
  const salaryGrades = useQuery({
    queryKey: ["/salary-grades"],
    queryFn: () => apiFetchAll<SalaryGrade>("/salary-grades"),
  });

  const [fileName, setFileName] = useState("");
  const [records, setRecords] = useState<ServiceRecordPayloadWithEmpNo[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setFileName(file.name);
    setParsing(true);
    try {
      const result = await parseServiceRecordWorkbook(file, { includeEmpNo: true });
      setRecords(result.records);
      setErrors(result.errors);
    } catch {
      setRecords([]);
      setErrors(["Could not read this file — make sure it's the .xlsx template, not renamed or re-saved as .csv"]);
    } finally {
      setParsing(false);
    }
  }

  function reset() {
    setFileName("");
    setRecords([]);
    setErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const importAll = useMutation({
    mutationFn: () =>
      apiFetch<{ imported: number; unmatchedEmpNos: number[] }>("/service-records/import", {
        method: "POST",
        body: JSON.stringify({ records }),
      }),
    onSuccess: () => {
      reset();
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Import Service Records — All Employees</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Fill in missing service history for many employees at once, instead of one at a time from each employee's
          own Service Record tab.
        </p>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Upload spreadsheet</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-[var(--color-muted)]">
            Download the blank template, fill in one row per service record — each row needs the employee's Employee
            No. to know who it belongs to. Position/Designation, Office/Department, Employment Status, Salary
            Grade, and Step are dropdown lists in the template to prevent typos. Dates must be in MM/DD/YYYY format.
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
                includeEmpNo: true,
                filename: "service-records-all-employees-template.xlsx",
              });
            }}
          >
            Download template (.xlsx)
          </Button>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sr-import-file">Filled-in spreadsheet</Label>
            <input
              id="sr-import-file"
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
              className="text-sm"
            />
          </div>

          {fileName && (
            <div className="rounded-md border border-[var(--color-border)] bg-slate-50 p-3 text-sm">
              <p className="font-medium text-foreground">{fileName}</p>
              <p className="text-[var(--color-muted)]">
                {parsing ? "Reading file…" : `${records.length} record(s) ready to import`}
              </p>
              {errors.length > 0 && (
                <ul className="mt-2 list-inside list-disc text-[var(--color-danger)]">
                  {errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {importAll.isError && (
            <p className="text-sm text-[var(--color-danger)]">{(importAll.error as Error).message}</p>
          )}

          {importAll.isSuccess && (
            <div className="rounded-md border border-[var(--color-border)] bg-slate-50 p-3 text-sm">
              <p className="font-medium text-foreground">Imported {importAll.data.imported} record(s).</p>
              {importAll.data.unmatchedEmpNos.length > 0 && (
                <p className="text-[var(--color-danger)]">
                  {importAll.data.unmatchedEmpNos.length} row(s) skipped — no employee found with Employee No.{" "}
                  {importAll.data.unmatchedEmpNos.join(", ")}.
                </p>
              )}
            </div>
          )}

          <Button
            type="button"
            onClick={() => importAll.mutate()}
            disabled={records.length === 0 || parsing || importAll.isPending}
            className="w-fit"
          >
            {importAll.isPending ? "Importing…" : `Import ${records.length} record(s)`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
