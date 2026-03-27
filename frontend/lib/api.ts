/**
 * @overview Client-side API utility for Next.js proxy routes (/api/...).
 * Used for authenticated endpoints where the Next.js route handles
 * token extraction server-side before forwarding to Django.
 *
 * Copyright © 2021-2025 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree or at
 *
 *    https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

import { toCamelCase } from '@/utils/toCamelCase';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

type ApiResponse<T> = {
  status: number;
  error: string | null;
  message: string;
  data: T | null;
};

async function apiRequest<T>({
  endpoint,
  method,
  body,
  headers,
}: {
  endpoint: string;
  method: HttpMethod;
  body?: any;
  headers?: HeadersInit;
}): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(endpoint, {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(headers as Record<string, string> || {}),
      },
      body: method === 'GET' ? undefined : body ? JSON.stringify(body) : undefined,
    });

    const json = await res.json();
    const data = json?.data !== undefined ? toCamelCase(json.data) : null;

    return {
      status: json?.status || res.status,
      message: json?.message || 'Success',
      data,
      error: json?.error || null,
    };
  } catch (error: any) {
    return {
      status: error?.status || 500,
      message: error?.message || 'Network or unexpected error',
      data: null,
      error: error?.message || 'Network or unexpected error',
    };
  }
}

export const api = {
  get: <T>(endpoint: string, headers?: HeadersInit) =>
    apiRequest<T>({ endpoint, method: 'GET', headers }),

  post: <T>(endpoint: string, body?: any, headers?: HeadersInit) =>
    apiRequest<T>({ endpoint, method: 'POST', body, headers }),

  patch: <T>(endpoint: string, body?: any, headers?: HeadersInit) =>
    apiRequest<T>({ endpoint, method: 'PATCH', body, headers }),

  put: <T>(endpoint: string, body?: any, headers?: HeadersInit) =>
    apiRequest<T>({ endpoint, method: 'PUT', body, headers }),

  delete: <T>(endpoint: string, headers?: HeadersInit) =>
    apiRequest<T>({ endpoint, method: 'DELETE', headers }),
};
