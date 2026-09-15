"use client";

import { useQuery } from "@tanstack/react-query";
import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { apiFetchAll } from "@/lib/api";
import type { AppointmentStatusCode } from "@/lib/types";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", {
  variants: {
    variant: {
      default: "bg-slate-100 text-slate-600",
      success: "bg-[var(--color-success-bg)] text-[var(--color-success)]",
      warning: "bg-[var(--color-warning-bg)] text-[var(--color-warning)]",
      danger: "bg-[var(--color-danger-bg)] text-[var(--color-danger)]",
      info: "bg-[var(--color-info-bg)] text-[var(--color-info)]",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function AppointmentStatusBadge({ status }: { status: string }) {
  // Cached across every badge instance on the page — one request, not one
  // per badge. Live lookup against Master Data > Appointment Status File so
  // an edited/added description AND mode (Entry/Exit) shows up here without
  // a code change.
  const { data } = useQuery({
    queryKey: ["/appointment-statuses"],
    queryFn: () => apiFetchAll<AppointmentStatusCode>("/appointment-statuses"),
    staleTime: 5 * 60 * 1000,
  });
  const statusCode = data?.find((s) => s.code === status);

  const variant = statusCode?.mode === "EXIT" ? "danger" : statusCode?.mode === "ENTRY" ? "success" : "info";

  return (
    <Badge variant={variant} title={statusCode?.description}>
      {status}
    </Badge>
  );
}
