"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch, apiFetchAll } from "@/lib/api";
import { exportRowsToExcel } from "@/lib/export-excel";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { AppointmentStatusCode, PaginatedResult } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";

const PAGE_SIZE = 20;
const emptyForm = { code: "", description: "" };

export default function AppointmentStatusesPage() {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const permissions = currentUser?.permissions ?? [];
  const canCreate = permissions.includes("appointmentStatuses:create");
  const canEdit = permissions.includes("appointmentStatuses:edit");
  const canDelete = permissions.includes("appointmentStatuses:delete");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const query = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
  if (debouncedSearch) query.set("search", debouncedSearch);

  const list = useQuery({
    queryKey: ["/appointment-statuses", page, debouncedSearch],
    queryFn: () => apiFetch<PaginatedResult<AppointmentStatusCode>>(`/appointment-statuses?${query.toString()}`),
  });

  const rows = list.data?.data ?? [];
  const total = list.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const create = useMutation({
    mutationFn: () =>
      apiFetch<AppointmentStatusCode>("/appointment-statuses", {
        method: "POST",
        body: JSON.stringify(form),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/appointment-statuses"] });
      setForm(emptyForm);
      setDialogOpen(false);
    },
  });

  const update = useMutation({
    mutationFn: () =>
      apiFetch<AppointmentStatusCode>(`/appointment-statuses/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify(form),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/appointment-statuses"] });
      setForm(emptyForm);
      setEditingId(null);
      setDialogOpen(false);
    },
  });

  const toggleActive = useMutation({
    mutationFn: (row: AppointmentStatusCode) =>
      apiFetch<AppointmentStatusCode>(`/appointment-statuses/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !row.active }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/appointment-statuses"] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/appointment-statuses/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/appointment-statuses"] }),
  });

  function openNewDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(row: AppointmentStatusCode) {
    setEditingId(row.id);
    setForm({ code: row.code, description: row.description });
    setDialogOpen(true);
  }

  function handleDelete(row: AppointmentStatusCode) {
    if (window.confirm(`Delete appointment status "${row.code}"?`)) remove.mutate(row.id);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const all = await apiFetchAll<AppointmentStatusCode>("/appointment-statuses");
      await exportRowsToExcel({
        filename: "appointment-status-file.xlsx",
        sheetName: "Appointment Statuses",
        columns: [
          { header: "Code", key: "code" },
          { header: "Description", key: "description" },
          { header: "Status", key: "status" },
        ],
        rows: all.map((r) => ({ code: r.code, description: r.description, status: r.active ? "Active" : "Inactive" })),
      });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <TableCard
        title="Appointment Statuses"
        search={search}
        onSearchChange={setSearch}
        headerExtra={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
              <Download className="h-3.5 w-3.5" />
              {exporting ? "Exporting…" : "Export"}
            </Button>
            {canCreate && (
              <Button size="sm" onClick={openNewDialog}>
                <Plus className="h-3.5 w-3.5" />
                New
              </Button>
            )}
          </div>
        }
      >
        <Table bare>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              {(canEdit || canDelete) && <TableHead className="w-32" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-[var(--color-muted)]">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!list.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-[var(--color-muted)]">
                  No records yet.
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-semibold">{row.code}</TableCell>
                <TableCell>{row.description}</TableCell>
                <TableCell>
                  <Badge variant={row.active ? "success" : "default"}>{row.active ? "Active" : "Inactive"}</Badge>
                </TableCell>
                {(canEdit || canDelete) && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => openEditDialog(row)}
                          aria-label={`Edit ${row.code}`}
                          className="text-[var(--color-muted)] hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => toggleActive.mutate(row)}
                          disabled={toggleActive.isPending}
                          aria-label={row.active ? `Deactivate ${row.code}` : `Activate ${row.code}`}
                          className="text-[var(--color-muted)] hover:text-foreground"
                        >
                          <Power className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDelete(row)}
                          aria-label={`Delete ${row.code}`}
                          className="text-[var(--color-muted)] hover:text-[var(--color-danger)]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination page={page} pageCount={pageCount} totalItems={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </TableCard>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editingId ? "Edit Appointment Status" : "New Appointment Status"}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editingId) update.mutate();
            else create.mutate();
          }}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="code">Code</Label>
            <Input id="code" required value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              required
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          {(create.isError || update.isError) && (
            <p className="text-sm text-[var(--color-danger)]">{((create.error ?? update.error) as Error).message}</p>
          )}
          <Button type="submit" disabled={create.isPending || update.isPending} className="mt-2 w-fit">
            {create.isPending || update.isPending ? "Saving…" : "Save"}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
