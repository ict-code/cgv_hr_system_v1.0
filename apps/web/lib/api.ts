const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.message ?? `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/**
 * For dropdown/select data that needs "everything", not a page of it — list
 * endpoints are paginated (default pageSize 20), so this asks for a single
 * large page instead. Not for rendering a paginated table; use apiFetch with
 * a PaginatedResult<T> type for that.
 */
export async function apiFetchAll<T>(path: string): Promise<T[]> {
  const separator = path.includes("?") ? "&" : "?";
  const result = await apiFetch<{ data: T[] }>(`${path}${separator}pageSize=1000`);
  return result.data;
}

/**
 * For endpoints that return a binary file (e.g. a generated .docx) rather
 * than JSON. Triggers a browser download of the response body.
 */
export async function apiDownload(path: string, init: RequestInit, filename: string): Promise<void> {
  const res = await fetch(`${API_URL}${path}`, { ...init, cache: "no-store" });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.message ?? `Request failed: ${res.status}`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
