"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
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
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const save = useMutation({
    mutationFn: () => {
      const body: Record<string, string | number | undefined> = {};
      for (const field of fields) {
        const raw = form[field.key];
        body[field.key] = field.type === "number" ? (raw ? Number(raw) : undefined) : raw || undefined;
      }
      if (editingId) {
        return apiFetch<T>(`${apiPath}/${editingId}`, { method: "PATCH", body: JSON.stringify(body) });
      }
      return apiFetch<T>(apiPath, { method: "POST", body: JSON.stringify(body) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setForm({});
      setEditingId(null);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`${apiPath}/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  function startEdit(row: T) {
    const next: Record<string, string> = {};
    for (const field of fields) {
      const value = row[field.key as keyof T];
      if (value === null || value === undefined) {
        next[field.key] = "";
      } else if (field.type === "date" && typeof value === "string") {
        next[field.key] = value.slice(0, 10);
      } else {
        next[field.key] = String(value);
      }
    }
    setForm(next);
    setEditingId(row.id);
  }

  function cancelEdit() {
    setForm({});
    setEditingId(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key}>{col.label}</TableHead>
            ))}
            <TableHead className="w-16" />
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
            <TableRow key={row.id} className={row.id === editingId ? "bg-brand-50" : undefined}>
              {columns.map((col) => (
                <TableCell key={col.key}>{col.render ? col.render(row) : String(row[col.key] ?? "—")}</TableCell>
              ))}
              <TableCell>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(row)}
                    className="text-[var(--color-muted)] hover:text-foreground"
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove.mutate(row.id)}
                    className="text-[var(--color-muted)] hover:text-[var(--color-danger)]"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination page={page} pageCount={pageCount} totalItems={total} pageSize={PAGE_SIZE} onPageChange={setPage} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className={cn(
          "flex flex-wrap items-end gap-3 rounded-md border p-3",
          editingId ? "border-brand-300 bg-brand-50/40" : "border-[var(--color-border)]",
        )}
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
        <Button type="submit" size="sm" disabled={save.isPending}>
          {save.isPending ? "Saving…" : editingId ? "Save" : "Add"}
        </Button>
        {editingId && (
          <Button type="button" variant="outline" size="sm" onClick={cancelEdit}>
            <X className="h-3.5 w-3.5" />
            Cancel
          </Button>
        )}
        {save.isError && <p className="text-sm text-[var(--color-danger)]">{(save.error as Error).message}</p>}
      </form>
    </div>
  );
}
