"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch, apiFetchAll } from "@/lib/api";
import { exportRowsToExcel } from "@/lib/export-excel";
import type { PaginatedResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";

const PAGE_SIZE = 20;

export type ResourceField = {
  key: string;
  label: string;
  type: "text" | "number";
  required?: boolean;
};

// Naive `.replace(/s$/, "")` mangles "-es" plurals like "Statuses" ->
// "Statuse". Handle the common English plural endings properly.
function singularize(word: string): string {
  if (/ies$/i.test(word)) return word.slice(0, -3) + "y";
  if (/(ses|xes|zes|ches|shes)$/i.test(word)) return word.slice(0, -2);
  if (/s$/i.test(word)) return word.slice(0, -1);
  return word;
}

export type ResourceColumn<T> = {
  key: keyof T & string;
  label: string;
  render?: (row: T) => React.ReactNode;
};

export function ResourceCrudPage<T extends { id: string }>({
  title,
  apiPath,
  columns,
  fields,
  searchKeys,
}: {
  title: string;
  apiPath: string;
  columns: ResourceColumn<T>[];
  fields: ResourceField[];
  searchKeys?: (keyof T & string)[];
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const query = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
  if (searchKeys && debouncedSearch) query.set("search", debouncedSearch);
  const queryKey = [apiPath, page, debouncedSearch];

  const list = useQuery({
    queryKey,
    queryFn: () => apiFetch<PaginatedResult<T>>(`${apiPath}?${query.toString()}`),
  });

  const create = useMutation({
    mutationFn: () => {
      const body: Record<string, string | number | undefined> = {};
      for (const field of fields) {
        const raw = formValues[field.key];
        body[field.key] = field.type === "number" ? (raw ? Number(raw) : undefined) : raw || undefined;
      }
      return apiFetch<T>(apiPath, { method: "POST", body: JSON.stringify(body) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiPath] });
      // The new row sorts alphabetically and may land past page 1 — search
      // for it so it's actually visible instead of silently off-screen.
      const searchField = searchKeys?.find((key) => formValues[key]);
      if (searchField) setSearch(formValues[searchField]);
      setPage(1);
      setFormValues({});
      setDialogOpen(false);
    },
  });

  const rows = list.data?.data ?? [];
  const total = list.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function handleExport() {
    setExporting(true);
    try {
      const all = await apiFetchAll<T>(apiPath);
      await exportRowsToExcel({
        filename: `${title.toLowerCase().replace(/\s+/g, "-")}.xlsx`,
        sheetName: title,
        columns: columns.map((c) => ({ header: c.label, key: c.key })),
        rows: all.map((row) => Object.fromEntries(columns.map((c) => [c.key, row[c.key] ?? ""]))),
      });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <TableCard
        title={title}
        search={searchKeys ? search : undefined}
        onSearchChange={searchKeys ? setSearch : undefined}
        headerExtra={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
              <Download className="h-3.5 w-3.5" />
              {exporting ? "Exporting…" : "Export"}
            </Button>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              New
            </Button>
          </div>
        }
      >
        <Table bare>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading && (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-[var(--color-muted)]">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!list.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-[var(--color-muted)]">
                  No records yet.
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id}>
                {columns.map((col) => (
                  <TableCell key={col.key}>{col.render ? col.render(row) : String(row[col.key] ?? "—")}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination page={page} pageCount={pageCount} totalItems={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </TableCard>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={`New ${singularize(title)}`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
          className="flex flex-col gap-3"
        >
          {fields.map((field) => (
            <div key={field.key} className="flex flex-col gap-1.5">
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input
                id={field.key}
                type={field.type === "number" ? "number" : "text"}
                required={field.required}
                value={formValues[field.key] ?? ""}
                onChange={(e) => setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
              />
            </div>
          ))}
          {create.isError && <p className="text-sm text-[var(--color-danger)]">{(create.error as Error).message}</p>}
          <Button type="submit" disabled={create.isPending} className="mt-2">
            {create.isPending ? "Saving…" : "Save"}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
