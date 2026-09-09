"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetch } from "../../../lib/api";
import type { Position } from "../../../lib/types";

export default function PositionsPage() {
  const queryClient = useQueryClient();
  const positions = useQuery({
    queryKey: ["positions"],
    queryFn: () => apiFetch<Position[]>("/positions"),
  });

  const [positionCode, setPositionCode] = useState("");
  const [positionDesc, setPositionDesc] = useState("");
  const [shortDesc, setShortDesc] = useState("");

  const createPosition = useMutation({
    mutationFn: () =>
      apiFetch<Position>("/positions", {
        method: "POST",
        body: JSON.stringify({
          positionCode: Number(positionCode),
          positionDesc,
          shortDesc: shortDesc || undefined,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      setPositionCode("");
      setPositionDesc("");
      setShortDesc("");
    },
  });

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-xl font-semibold">Positions</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createPosition.mutate();
        }}
        className="border rounded-lg p-4 flex flex-col gap-3"
      >
        <h2 className="font-medium">New position</h2>
        <div className="flex gap-3">
          <input
            placeholder="Position code"
            value={positionCode}
            onChange={(e) => setPositionCode(e.target.value)}
            required
            className="border rounded px-3 py-2 w-32"
          />
          <input
            placeholder="Description"
            value={positionDesc}
            onChange={(e) => setPositionDesc(e.target.value)}
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
        {createPosition.isError && (
          <p className="text-sm text-red-600">{(createPosition.error as Error).message}</p>
        )}
        <button
          type="submit"
          disabled={createPosition.isPending}
          className="bg-black text-white rounded px-3 py-2 w-fit disabled:opacity-50"
        >
          {createPosition.isPending ? "Adding…" : "Add position"}
        </button>
      </form>

      <div className="border rounded-lg divide-y">
        {positions.isLoading && <p className="p-4">Loading…</p>}
        {positions.data?.length === 0 && <p className="p-4 text-gray-500">No positions yet.</p>}
        {positions.data?.map((p) => (
          <div key={p.id} className="p-3 flex gap-3">
            <span className="text-gray-500 w-16">{p.positionCode}</span>
            <span>{p.positionDesc}</span>
            {p.shortDesc && <span className="text-gray-400">({p.shortDesc})</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
