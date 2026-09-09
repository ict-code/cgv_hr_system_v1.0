"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Role, UserRow } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [roleIds, setRoleIds] = useState<string[]>([]);

  const users = useQuery({
    queryKey: ["/users"],
    queryFn: () => apiFetch<UserRow[]>("/users"),
  });

  const roles = useQuery({
    queryKey: ["/roles"],
    queryFn: () => apiFetch<Role[]>("/roles"),
  });

  const createUser = useMutation({
    mutationFn: () =>
      apiFetch<UserRow>("/users", {
        method: "POST",
        body: JSON.stringify({ loginId, password, fullName, roleIds }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/users"] });
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
            {!users.isLoading && (users.data ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-[var(--color-muted)]">
                  No users yet.
                </TableCell>
              </TableRow>
            )}
            {users.data?.map((u) => (
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
