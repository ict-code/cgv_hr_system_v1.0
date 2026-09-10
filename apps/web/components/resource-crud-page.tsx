"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const list = useQuery({
    queryKey: [apiPath],
    queryFn: () => apiFetch<T[]>(apiPath),
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
      setFormValues({});
      setDialogOpen(false);
    },
  });

  const rows = (list.data ?? []).filter((row) => {
    if (!search || !searchKeys) return true;
    return searchKeys.some((key) => String(row[key] ?? "").toLowerCase().includes(search.toLowerCase()));
  });

  return (
    <div className="flex flex-col gap-4">
      <TableCard
        title={title}
        search={searchKeys ? search : undefined}
        onSearchChange={searchKeys ? setSearch : undefined}
        headerExtra={
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            New
          </Button>
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
