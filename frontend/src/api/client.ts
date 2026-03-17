const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

function buildUrl(path: string, params?: Record<string, string>): string {
  const fullPath = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const url = fullPath.startsWith('http')
    ? new URL(fullPath)
    : new URL(fullPath, window.location.origin);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

async function request<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string> } = {}
): Promise<T> {
  const { params, ...init } = options;
  const url = buildUrl(path, params);

  const token = localStorage.getItem('hrms-auth')
    ? (JSON.parse(localStorage.getItem('hrms-auth') ?? '{}')?.state?.accessToken as string)
    : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...init.headers,
  };

  const res = await fetch(url, { ...init, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data?.error?.message ?? res.statusText) as Error & { code?: string };
    (err as Error & { code: string }).code = data?.error?.code;
    throw err;
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, params?: Record<string, string>) =>
    request<T>(path, { method: 'GET', params }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),

  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),

  /** Multipart upload (do not set Content-Type; browser sets boundary) */
  uploadFile: async <T>(path: string, formData: FormData): Promise<T> => {
    const url = buildUrl(path);
    const token = localStorage.getItem('hrms-auth')
      ? (JSON.parse(localStorage.getItem('hrms-auth') ?? '{}')?.state?.accessToken as string)
      : null;
    const headers: HeadersInit = { ...(token && { Authorization: `Bearer ${token}` }) };
    const res = await fetch(url, { method: 'POST', body: formData, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data?.error?.message ?? res.statusText) as Error & { code?: string };
      (err as Error & { code: string }).code = data?.error?.code;
      throw err;
    }
    return data as T;
  },
};
