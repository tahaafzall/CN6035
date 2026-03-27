import { appConfig } from './config';

const TOKEN_STORAGE_KEY = 'tracechain.jwt';

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  headers?: HeadersInit;
};

export function getStoredToken() {
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string) {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken() {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${appConfig.apiUrl}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options.headers
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errorBody?.error || 'Request failed');
  }

  return response.json() as Promise<T>;
}

export async function uploadDocument(file: File, token: string) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${appConfig.apiUrl}/api/documents`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errorBody?.error || 'Document upload failed');
  }

  return response.json() as Promise<{
    cid: string;
    hash: string;
    gatewayUrl: string;
    filename: string;
    mimetype: string;
    size: number;
  }>;
}
