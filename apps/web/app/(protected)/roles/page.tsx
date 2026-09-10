"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { PaginatedResult, Permission, Role } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";

const PAGE_SIZE = 20;

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissionIds, setPermissionIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const query = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
  if (debouncedSearch) query.set("search", debouncedSearch);

  const roles = useQuery({
    queryKey: ["/roles", page, debouncedSearch],
    queryFn: () => apiFetch<PaginatedResult<Role>>(`/roles?${query.toString()}`),
  });

  const rows = roles.data?.data ?? [];
  const total = roles.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const permissions = useQuery({
    queryKey: ["/permissions"],
    queryFn: () => apiFetch<Permission[]>("/permissions"),
  });

  const createRole = useMutation({
    mutationFn: () =>
      apiFetch<Role>("/roles", {
        method: "POST",
        body: JSON.stringify({ name, description: description || undefined, permissionIds }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/roles"] });
      // Sorted by name — search for the new row so it's not left off-screen on a later page.
      setSearch(name);
      setPage(1);
      setName("");
      setDescription("");
      setPermissionIds([]);
      setDialogOpen(false);
    },
  });

  function togglePermission(id: string) {
    setPermissionIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  const permissionsByModule = (permissions.data ?? []).reduce<Record<string, Permission[]>>((acc, perm) => {
    (acc[perm.module] ??= []).push(perm);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4">
      <TableCard
        title="Roles"
        search={search}
        onSearchChange={setSearch}
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
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Permissions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.isLoading && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-[var(--color-muted)]">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!roles.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-[var(--color-muted)]">
                  No roles yet.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.name}</TableCell>
                <TableCell className="text-[var(--color-muted)]">{r.description ?? "—"}</TableCell>
                <TableCell>{r.permissions.length}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination page={page} pageCount={pageCount} totalItems={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </TableCard>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="New Role" className="max-w-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createRole.mutate();
          }}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Permissions</Label>
            <div className="grid grid-cols-2 gap-3 rounded-md border border-[var(--color-border)] p-3 sm:grid-cols-3">
              {Object.entries(permissionsByModule).map(([module, perms]) => (
                <div key={module} className="flex flex-col gap-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">{module}</p>
                  {perms.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={permissionIds.includes(p.id)}
                        onChange={() => togglePermission(p.id)}
                      />
                      {p.action}
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>
          {createRole.isError && <p className="text-sm text-[var(--color-danger)]">{(createRole.error as Error).message}</p>}
          <Button type="submit" disabled={createRole.isPending} className="mt-2">
            {createRole.isPending ? "Saving…" : "Save"}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
