"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiFetch, apiFetchAll } from "@/lib/api";
import type { Department, Employee } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

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
    queryKey: ["/departments"],
    queryFn: () => apiFetchAll<Department>("/departments"),
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
      <Card>
        <CardHeader>
          <CardTitle>New employee</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((values) => createEmployee.mutate(values))}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="empNo">Employee no.</Label>
              <Input id="empNo" {...register("empNo")} />
              {errors.empNo && <p className="text-sm text-[var(--color-danger)]">{errors.empNo.message}</p>}
            </div>

            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" {...register("lastName")} />
                {errors.lastName && <p className="text-sm text-[var(--color-danger)]">{errors.lastName.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" {...register("firstName")} />
                {errors.firstName && <p className="text-sm text-[var(--color-danger)]">{errors.firstName.message}</p>}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="middleName">Middle name</Label>
              <Input id="middleName" {...register("middleName")} />
            </div>

            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <Label htmlFor="sex">Sex</Label>
                <Select id="sex" {...register("sex")}>
                  <option value="">—</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <Label htmlFor="civilStatus">Civil status</Label>
                <Input id="civilStatus" {...register("civilStatus")} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="departmentId">Department</Label>
              <Select id="departmentId" {...register("departmentId")}>
                <option value="">—</option>
                {departments.data?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.deptDesc}
                  </option>
                ))}
              </Select>
            </div>

            {createEmployee.isError && (
              <p className="text-sm text-[var(--color-danger)]">{(createEmployee.error as Error).message}</p>
            )}

            <Button type="submit" disabled={isSubmitting || createEmployee.isPending} className="mt-2 w-fit">
              {createEmployee.isPending ? "Creating…" : "Create employee"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
