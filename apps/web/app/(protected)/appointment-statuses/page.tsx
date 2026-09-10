"use client";

import { ResourceCrudPage } from "@/components/resource-crud-page";
import type { AppointmentStatusCode } from "@/lib/types";

export default function AppointmentStatusesPage() {
  return (
    <ResourceCrudPage<AppointmentStatusCode>
      title="Appointment Statuses"
      apiPath="/appointment-statuses"
      searchKeys={["code", "description"]}
      columns={[
        { key: "code", label: "Code" },
        { key: "description", label: "Description" },
      ]}
      fields={[
        { key: "code", label: "Code", type: "text", required: true },
        { key: "description", label: "Description", type: "text", required: true },
      ]}
    />
  );
}
