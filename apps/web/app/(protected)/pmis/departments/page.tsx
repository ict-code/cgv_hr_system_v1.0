"use client";

import { ResourceCrudPage } from "@/components/resource-crud-page";
import type { Department } from "@/lib/types";

export default function DepartmentsPage() {
  return (
    <ResourceCrudPage<Department>
      title="Departments"
      apiPath="/departments"
      searchKeys={["deptDesc", "shortDesc"]}
      columns={[
        { key: "deptCode", label: "Code" },
        { key: "deptDesc", label: "Description" },
        { key: "shortDesc", label: "Short" },
      ]}
      fields={[
        { key: "deptCode", label: "Department code", type: "number", required: true },
        { key: "deptDesc", label: "Description", type: "text", required: true },
        { key: "shortDesc", label: "Short description", type: "text" },
      ]}
    />
  );
}
