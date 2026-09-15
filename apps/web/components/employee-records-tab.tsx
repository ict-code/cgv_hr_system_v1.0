"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PAGE_SIZE = 10;

export type RecordField = {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  required?: boolean;
  options?: { value: string; label: string }[];
};

export type RecordColumn<T> = {
  key: keyof T & string;
  label: string;
  render?: (row: T) => React.ReactNode;
};

export function EmployeeRecordsTab<T extends { id: string }>({
  employeeId,
  resourcePath,
  queryKeySuffix,
  columns,
  fields,
  emptyLabel,
}: {
  employeeId: string;
  resourcePath: string;
  queryKeySuffix: string;
  columns: RecordColumn<T>[];
  fields: RecordField[];
  emptyLabel: string;
}) {
  const queryClient = useQueryClient();
  const apiPath = `/employees/${employeeId}/${resourcePath}`;
  const queryKey = ["employees", employeeId, queryKeySuffix];
  const [form, setForm] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);

  const list = useQuery({
    queryKey,
    queryFn: () => apiFetch<T[]>(apiPath),
  });

  const allRows = list.data ?? [];
  const total = allRows.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rows = allRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const create = useMutation({
    mutationFn: () => {
      const body: Record<string, string | number | undefined> = {};
      for (const field of fields) {
        const raw = form[field.key];
        body[field.key] = field.type === "number" ? (raw ? Number(raw) : undefined) : raw || undefined;
      }
      return apiFetch<T>(apiPath, { method: "POST", body: JSON.stringify(body) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setForm({});
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`${apiPath}/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key}>{col.label}</TableHead>
            ))}
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.isLoading && (
            <TableRow>
              <TableCell colSpan={columns.length + 1} className="text-center text-[var(--color-muted)]">
                Loading…
              </TableCell>
            </TableRow>
          )}
          {!list.isLoading && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length + 1} className="text-center text-[var(--color-muted)]">
                {emptyLabel}
              </TableCell>
            </TableRow>
          )}
          {rows.map((row) => (
            <TableRow key={row.id}>
              {columns.map((col) => (
                <TableCell key={col.key}>{col.render ? col.render(row) : String(row[col.key] ?? "—")}</TableCell>
              ))}
              <TableCell>
                <button
                  type="button"
                  onClick={() => remove.mutate(row.id)}
                  className="text-[var(--color-muted)] hover:text-[var(--color-danger)]"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination page={page} pageCount={pageCount} totalItems={total} pageSize={PAGE_SIZE} onPageChange={setPage} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="flex flex-wrap items-end gap-3 rounded-md border border-[var(--color-border)] p-3"
      >
        {fields.map((field) => (
          <div key={field.key} className="flex flex-col gap-1.5">
            <Label htmlFor={field.key}>{field.label}</Label>
            {field.type === "select" ? (
              <Select
                id={field.key}
                required={field.required}
                value={form[field.key] ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                className="w-44"
              >
                <option value="">—</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                id={field.key}
                type={field.type}
                required={field.required}
                value={form[field.key] ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                className="w-44"
              />
            )}
          </div>
        ))}
        <Button type="submit" size="sm" disabled={create.isPending}>
          {create.isPending ? "Adding…" : "Add"}
        </Button>
        {create.isError && <p className="text-sm text-[var(--color-danger)]">{(create.error as Error).message}</p>}
      </form>
    </div>
  );
}
