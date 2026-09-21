import { redirect } from "next/navigation";

// New employee is a popup on the employees list now; keep old links working.
export default function NewEmployeePage() {
  redirect("/employees");
}
