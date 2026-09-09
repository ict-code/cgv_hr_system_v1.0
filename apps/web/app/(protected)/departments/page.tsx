"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetch } from "../../../lib/api";
import type { Department } from "../../../lib/types";

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const departments = useQuery({
    queryKey: ["departments"],
    queryFn: () => apiFetch<Department[]>("/departments"),
  });

  const [deptCode, setDeptCode] = useState("");
  const [deptDesc, setDeptDesc] = useState("");
  const [shortDesc, setShortDesc] = useState("");

  const createDepartment = useMutation({
    mutationFn: () =>
      apiFetch<Department>("/departments", {
        method: "POST",
        body: JSON.stringify({
          deptCode: Number(deptCode),
          deptDesc,
          shortDesc: shortDesc || undefined,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setDeptCode("");
      setDeptDesc("");
      setShortDesc("");
    },
  });

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-xl font-semibold">Departments</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createDepartment.mutate();
        }}
        className="border rounded-lg p-4 flex flex-col gap-3"
      >
        <h2 className="font-medium">New department</h2>
        <div className="flex gap-3">
          <input
            placeholder="Dept code"
            value={deptCode}
            onChange={(e) => setDeptCode(e.target.value)}
            required
            className="border rounded px-3 py-2 w-32"
          />
          <input
            placeholder="Description"
            value={deptDesc}
            onChange={(e) => setDeptDesc(e.target.value)}
            required
            className="border rounded px-3 py-2 flex-1"
          />
          <input
            placeholder="Short desc"
            value={shortDesc}
            onChange={(e) => setShortDesc(e.target.value)}
            className="border rounded px-3 py-2 w-32"
          />
        </div>
        {createDepartment.isError && (
          <p className="text-sm text-red-600">{(createDepartment.error as Error).message}</p>
        )}
        <button
          type="submit"
          disabled={createDepartment.isPending}
          className="bg-black text-white rounded px-3 py-2 w-fit disabled:opacity-50"
        >
          {createDepartment.isPending ? "Adding…" : "Add department"}
        </button>
      </form>

      <div className="border rounded-lg divide-y">
        {departments.isLoading && <p className="p-4">Loading…</p>}
        {departments.data?.length === 0 && <p className="p-4 text-gray-500">No departments yet.</p>}
        {departments.data?.map((d) => (
          <div key={d.id} className="p-3 flex gap-3">
            <span className="text-gray-500 w-16">{d.deptCode}</span>
            <span>{d.deptDesc}</span>
            {d.shortDesc && <span className="text-gray-400">({d.shortDesc})</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
