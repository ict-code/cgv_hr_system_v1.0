import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export type CurrentUser = {
  id: string;
  loginId: string;
  fullName: string;
};

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiFetch<CurrentUser>("/auth/me"),
    retry: false,
  });
}
