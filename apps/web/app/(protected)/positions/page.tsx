"use client";

import { ResourceCrudPage } from "@/components/resource-crud-page";
import type { Position } from "@/lib/types";

export default function PositionsPage() {
  return (
    <ResourceCrudPage<Position>
      title="Positions"
      apiPath="/positions"
      searchKeys={["positionDesc", "shortDesc"]}
      columns={[
        { key: "positionCode", label: "Code" },
        { key: "positionDesc", label: "Description" },
        { key: "shortDesc", label: "Short" },
      ]}
      fields={[
        { key: "positionCode", label: "Position code", type: "number", required: true },
        { key: "positionDesc", label: "Description", type: "text", required: true },
        { key: "shortDesc", label: "Short description", type: "text" },
      ]}
    />
  );
}
