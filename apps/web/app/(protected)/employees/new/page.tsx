"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiFetch } from "../../../../lib/api";
import type { Department, Employee } from "../../../../lib/types";

const employeeSchema = z.object({
  empNo: z.coerce.number().int().positive(),
  lastName: z.string().min(1, "Required"),
  firstName: z.string().min(1, "Required"),
  middleName: z.string().optional(),
  sex: z.string().optional(),
  civilStatus: z.string().optional(),
  departmentId: z.string().optional(),
});

type EmployeeForm = z.infer<typeof employeeSchema>;

export default function NewEmployeePage() {
  const router = useRouter();
  const departments = useQuery({
    queryKey: ["departments"],
    queryFn: () => apiFetch<Department[]>("/departments"),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeForm>({ resolver: zodResolver(employeeSchema) });

  const createEmployee = useMutation({
    mutationFn: (values: EmployeeForm) =>
      apiFetch<Employee>("/employees", {
        method: "POST",
        body: JSON.stringify({
          ...values,
          departmentId: values.departmentId || undefined,
        }),
      }),
    onSuccess: (employee) => {
      router.push(`/employees/${employee.id}`);
    },
  });

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold mb-4">New employee</h1>

      <form
        onSubmit={handleSubmit((values) => createEmployee.mutate(values))}
        className="border rounded-lg p-4 flex flex-col gap-3"
      >
        <div className="flex gap-3">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-sm font-medium">Employee no.</label>
            <input className="border rounded px-3 py-2" {...register("empNo")} />
            {errors.empNo && <p className="text-sm text-red-600">{errors.empNo.message}</p>}
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-sm font-medium">Last name</label>
            <input className="border rounded px-3 py-2" {...register("lastName")} />
            {errors.lastName && <p className="text-sm text-red-600">{errors.lastName.message}</p>}
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-sm font-medium">First name</label>
            <input className="border rounded px-3 py-2" {...register("firstName")} />
            {errors.firstName && <p className="text-sm text-red-600">{errors.firstName.message}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Middle name</label>
          <input className="border rounded px-3 py-2" {...register("middleName")} />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-sm font-medium">Sex</label>
            <select className="border rounded px-3 py-2" {...register("sex")}>
              <option value="">—</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-sm font-medium">Civil status</label>
            <input className="border rounded px-3 py-2" {...register("civilStatus")} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Department</label>
          <select className="border rounded px-3 py-2" {...register("departmentId")}>
            <option value="">—</option>
            {departments.data?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.deptDesc}
              </option>
            ))}
          </select>
        </div>

        {createEmployee.isError && (
          <p className="text-sm text-red-600">{(createEmployee.error as Error).message}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || createEmployee.isPending}
          className="bg-black text-white rounded px-3 py-2 w-fit disabled:opacity-50"
        >
          {createEmployee.isPending ? "Creating…" : "Create employee"}
        </button>
      </form>
    </div>
  );
}
