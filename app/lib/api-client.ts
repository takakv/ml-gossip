const API_URL = import.meta.env.VITE_API_URL as string;

type JSendBody<T> =
  | { status: "success"; data: T }
  | { status: "fail"; data: any }
  | { status: "error"; message: string };

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const hasBody = response.status !== 204 && response.status !== 304;
  const body: JSendBody<T> | null = hasBody
    ? await response.json().catch(() => null)
    : null;

  if (!response.ok) {
    let message = `Serveriga suhtlemine ebaõnnestus (${response.status})`;
    if (body?.status === "error") {
      message = body.message;
    } else if (body?.status === "fail" && body.data?.message) {
      message = body.data.message;
    }
    throw new ApiError(
      message,
      response.status,
      body && "data" in body ? body.data : undefined,
    );
  }

  return (body && body.status === "success" ? body.data : null) as T;
}

function buildHeaders(
  init: RequestInit,
  defaults: Record<string, string>,
): Headers {
  const headers = new Headers(init.headers);
  for (const [key, value] of Object.entries(defaults)) {
    if (!headers.has(key)) headers.set(key, value);
  }
  return headers;
}

const jsonHeaders = (body: RequestInit["body"]): Record<string, string> =>
  body !== undefined && !(body instanceof FormData)
    ? { "Content-Type": "application/json" }
    : {};

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: buildHeaders(init, jsonHeaders(init.body)),
  });

  return parseResponse<T>(response);
}
