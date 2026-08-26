import { API_URL } from './config';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  body?: unknown;
  headers?: HeadersInit;
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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? 'Something went wrong');
  }

  return data as T;
}

export const api = {
  get<T>(endpoint: string, headers?: HeadersInit) {
    return request<T>('GET', endpoint, {
      headers,
    });
  },

  post<T>(endpoint: string, body?: unknown, headers?: HeadersInit) {
    return request<T>('POST', endpoint, {
      body,
      headers,
    });
  },

  put<T>(endpoint: string, body?: unknown, headers?: HeadersInit) {
    return request<T>('PUT', endpoint, {
      body,
      headers,
    });
  },

  patch<T>(endpoint: string, body?: unknown, headers?: HeadersInit) {
    return request<T>('PATCH', endpoint, {
      body,
      headers,
    });
  },

  delete<T>(endpoint: string, headers?: HeadersInit) {
    return request<T>('DELETE', endpoint, {
      headers,
    });
  },
};
