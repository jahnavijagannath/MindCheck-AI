export type CustomFetchOptions = RequestInit & {
  responseType?: "json" | "text" | "blob" | "auto";
};

export type ErrorType<T = unknown> = ApiError<T>;
export type BodyType<T = unknown> = T;

export type AuthTokenGetter = () =>
  | Promise<string | null>
  | string
  | null;

const NO_BODY_STATUS = new Set([204, 205, 304]);
const DEFAULT_JSON_ACCEPT =
  "application/json, application/problem+json";

// ---------------------------------------------------------------------------
// Module-level config
// ---------------------------------------------------------------------------

let _baseUrl: string | null = null;
let _authTokenGetter: AuthTokenGetter | null = null;

export function setBaseUrl(url: string | null): void {
  _baseUrl = url ? url.replace(/\/+$/, "") : null;
}

export function setAuthTokenGetter(getter: AuthTokenGetter | null): void {
  _authTokenGetter = getter;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isRequest(input: RequestInfo | URL): input is Request {
  return typeof Request !== "undefined" && input instanceof Request;
}

function isUrl(input: RequestInfo |URL): input is URL {
  return typeof URL !== "undefined" && input instanceof URL;
}

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (isUrl(input)) return input.toString();
  return input.url;
}

function applyBaseUrl(input: RequestInfo | URL): RequestInfo | URL {
  if (!_baseUrl) return input;

  const url = resolveUrl(input);

  if (!url.startsWith("/")) {
    return input;
  }

  const fullUrl = `${_baseUrl}${url}`;

  if (typeof input === "string") {
    return fullUrl;
  }

  if (isUrl(input)) {
    return new URL(fullUrl);
  }

  return new Request(fullUrl, input);
}

function resolveMethod(
  input: RequestInfo | URL,
  explicit?: string
): string {
  if (explicit) return explicit.toUpperCase();

  if (isRequest(input)) {
    return input.method.toUpperCase();
  }

  return "GET";
}

function mergeHeaders(
  ...sources: Array<HeadersInit | undefined>
): Headers {
  const headers = new Headers();

  for (const source of sources) {
    if (!source) continue;

    new Headers(source).forEach((value, key) => {
      headers.set(key, value);
    });
  }

  return headers;
}

function getMediaType(headers: Headers): string | null {
  const value = headers.get("content-type");

  return value
    ? value.split(";")[0].trim().toLowerCase()
    : null;
}

function hasNoBody(
  response: Response,
  method: string
): boolean {
  if (method === "HEAD") return true;

  if (NO_BODY_STATUS.has(response.status)) return true;

  if (response.headers.get("content-length") === "0")
    return true;

  if (response.body === null) return true;

  return false;
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff
    ? text.slice(1)
    : text;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class ApiError<T = unknown> extends Error {
  readonly status: number;
  readonly data: T | null;
  readonly response: Response;
  readonly method: string;
  readonly url: string;

  constructor(
    response: Response,
    data: T | null,
    info: {
      method: string;
      url: string;
    }
  ) {
    super(`HTTP ${response.status} ${response.statusText}`);

    this.status = response.status;
    this.data = data;
    this.response = response;
    this.method = info.method;
    this.url = info.url;
  }
}

// ---------------------------------------------------------------------------
// Core Fetch
// ---------------------------------------------------------------------------

export async function customFetch<T = unknown>(
  input: RequestInfo | URL,
  options: CustomFetchOptions = {}
): Promise<T> {
  const resolvedInput = applyBaseUrl(input);

  const {
    responseType = "auto",
    headers: headersInit,
    ...init
  } = options;

  const method = resolveMethod(
    resolvedInput,
    init.method
  );

  const headers = mergeHeaders(
    isRequest(resolvedInput)
      ? resolvedInput.headers
      : undefined,
    headersInit
  );

  // Accept Header
  if (!headers.has("Accept")) {
    headers.set("Accept", DEFAULT_JSON_ACCEPT);
  }

  // JSON Content-Type
  if (
    init.body &&
    !headers.has("Content-Type") &&
    !(init.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }

  // Authorization Header
  if (_authTokenGetter && !headers.has("Authorization")) {
    const token = await _authTokenGetter();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  console.log(
    "Authorization Header:",
    headers.get("Authorization")
  );

  const response = await fetch(resolvedInput, {
    ...init,
    method,
    headers,
  });

  if (!response.ok) {
    throw new ApiError(
      response,
      await response.text(),
      {
        method,
        url: resolveUrl(resolvedInput),
      }
    );
  }

  if (hasNoBody(response, method)) {
    return null as T;
  }

  if (responseType === "text") {
    return (await response.text()) as T;
  }

  if (responseType === "blob") {
    return (await response.blob()) as T;
  }

  const raw = await response.text();

  const clean = stripBom(raw);

  if (clean.trim() === "") {
    return null as T;
  }

  try {
    return JSON.parse(clean);
  } catch {
    return clean as T;
  }
}