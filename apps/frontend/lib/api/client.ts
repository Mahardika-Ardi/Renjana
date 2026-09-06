import { API_URL, AUTH_BASE_URL } from '../constants/url';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  body?: unknown;
  headers?: HeadersInit;
  skipAuthRetry?: boolean;
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}${AUTH_BASE_URL}/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
    }
  })();

  return refreshPromise;
}

async function request<T>(
  method: HttpMethod,
  endpoint: string,
  options?: RequestOptions,
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const headers = new Headers(options?.headers);

  let body: BodyInit | undefined;

  if (options?.body !== undefined) {
    if (
      options.body instanceof FormData ||
      options.body instanceof URLSearchParams ||
      options.body instanceof Blob
    ) {
      body = options.body;
    } else {
      body = JSON.stringify(options.body);
      headers.set('Content-Type', 'application/json');
    }
  }

  const response = await fetch(url, {
    method,
    headers,
    body,
    credentials: 'include',
  });

  if (
    response.status === 401 &&
    !options?.skipAuthRetry &&
    !endpoint.includes('/auth/refresh')
  ) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      return request<T>(method, endpoint, { ...options, skipAuthRetry: true });
    }

    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }

    throw new Error('Session expired. Please login again.');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? 'Something went wrong');
  }

  return data as T;
}

export const api = {
  get<T>(endpoint: string, headers?: HeadersInit) {
    return request<T>('GET', endpoint, { headers });
  },

  post<T>(endpoint: string, body?: unknown, headers?: HeadersInit) {
    return request<T>('POST', endpoint, { body, headers });
  },

  put<T>(endpoint: string, body?: unknown, headers?: HeadersInit) {
    return request<T>('PUT', endpoint, { body, headers });
  },

  patch<T>(endpoint: string, body?: unknown, headers?: HeadersInit) {
    return request<T>('PATCH', endpoint, { body, headers });
  },

  delete<T>(endpoint: string, headers?: HeadersInit) {
    return request<T>('DELETE', endpoint, { headers });
  },
};
