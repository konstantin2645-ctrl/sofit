"use client";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

export async function api<T = unknown>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(url, {
    ...rest,
    headers: json !== undefined ? { "Content-Type": "application/json", ...(rest.headers ?? {}) } : rest.headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    // Hard navigation on purpose: the session is gone, drop all client state.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname)}`;
    throw new ApiError("Сессия истекла", 401);
  }
  if (!res.ok) {
    const fields: Record<string, string> = {};
    if (Array.isArray(data.details)) for (const d of data.details) fields[d.path] = d.message;
    throw new ApiError(data.error ?? `Ошибка ${res.status}`, res.status, fields);
  }
  return data as T;
}
