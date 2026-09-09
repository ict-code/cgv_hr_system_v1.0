"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const loginSchema = z.object({
  loginId: z.string().min(1, "Login ID is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginForm) {
    setServerError(null);
    const res = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      setServerError("Invalid login ID or password.");
      return;
    }

    router.push("/employees");
    router.refresh();
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 font-sans">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="border rounded-lg p-6 w-full max-w-sm flex flex-col gap-4"
      >
        <h1 className="text-xl font-semibold">EGAPS Modern — Sign in</h1>

        <div className="flex flex-col gap-1">
          <label htmlFor="loginId" className="text-sm font-medium">
            Login ID
          </label>
          <input
            id="loginId"
            type="text"
            className="border rounded px-3 py-2"
            {...register("loginId")}
          />
          {errors.loginId && (
            <p className="text-sm text-red-600">{errors.loginId.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="border rounded px-3 py-2"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-black text-white rounded px-3 py-2 disabled:opacity-50"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
