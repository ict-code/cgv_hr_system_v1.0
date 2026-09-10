"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch, apiFetchAll } from "@/lib/api";
import type { PaginatedResult, Role, UserRow } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";

const PAGE_SIZE = 20;

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [roleIds, setRoleIds] = useState<string[]>([]);
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

  const users = useQuery({
    queryKey: ["/users", page, debouncedSearch],
    queryFn: () => apiFetch<PaginatedResult<UserRow>>(`/users?${query.toString()}`),
  });

  const rows = users.data?.data ?? [];
  const total = users.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const roles = useQuery({
    queryKey: ["/roles"],
    queryFn: () => apiFetchAll<Role>("/roles"),
  });

  const createUser = useMutation({
    mutationFn: () =>
      apiFetch<UserRow>("/users", {
        method: "POST",
        body: JSON.stringify({ loginId, password, fullName, roleIds }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/users"] });
      // Sorted by full name — search for the new row so it's not left off-screen on a later page.
      setSearch(fullName);
      setPage(1);
      setLoginId("");
      setPassword("");
      setFullName("");
      setRoleIds([]);
      setDialogOpen(false);
    },
  });

  function toggleRole(roleId: string) {
    setRoleIds((prev) => (prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]));
  }

  return (
    <div className="flex flex-col gap-4">
      <TableCard
        title="Users"
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
              <TableHead>Login ID</TableHead>
              <TableHead>Full name</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-[var(--color-muted)]">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!users.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-[var(--color-muted)]">
                  No users yet.
                </TableCell>
              </TableRow>
            )}
            {rows.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.loginId}</TableCell>
                <TableCell>{u.fullName}</TableCell>
                <TableCell className="flex flex-wrap gap-1">
                  {u.roles.map((ur) => (
                    <Badge key={ur.role.id}>{ur.role.name}</Badge>
                  ))}
                </TableCell>
                <TableCell>
                  <Badge variant={u.active ? "success" : "default"}>{u.active ? "Active" : "Inactive"}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination page={page} pageCount={pageCount} totalItems={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </TableCard>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="New User">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createUser.mutate();
          }}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="loginId">Login ID</Label>
            <Input id="loginId" required value={loginId} onChange={(e) => setLoginId(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Roles</Label>
            <div className="flex flex-col gap-1.5 rounded-md border border-[var(--color-border)] p-2.5">
              {roles.data?.map((r) => (
                <label key={r.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={roleIds.includes(r.id)} onChange={() => toggleRole(r.id)} />
                  {r.name}
                </label>
              ))}
            </div>
          </div>
          {createUser.isError && <p className="text-sm text-[var(--color-danger)]">{(createUser.error as Error).message}</p>}
          <Button type="submit" disabled={createUser.isPending} className="mt-2">
            {createUser.isPending ? "Saving…" : "Save"}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
