import { useQuery } from "@tanstack/react-query";
import { API_URL, apiFetch } from "@/lib/api";

export type Branding = {
  title: string;
  subtitle: string;
  hasLogo: boolean;
  updatedAt: string | null;
};

const DEFAULT_LOGO = "/vigan-seal.png";

export function useBranding() {
  const query = useQuery({
    queryKey: ["branding"],
    queryFn: () => apiFetch<Branding>("/branding"),
    staleTime: 5 * 60_000,
  });
  const data = query.data;
  // ?v= busts the browser's cache of the logo bytes whenever it's re-uploaded.
  const logoSrc = data?.hasLogo ? `${API_URL}/branding/logo?v=${encodeURIComponent(data.updatedAt ?? "")}` : DEFAULT_LOGO;
  return { ...query, title: data?.title ?? "HRAS", subtitle: data?.subtitle ?? "City Government of Vigan", logoSrc };
}
