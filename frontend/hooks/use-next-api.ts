/**
 * @overview Hook for making API requests to the Next.js API routes.
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

'use client';

import { ApiResponse, HttpMethod } from '@/types/http';

/**
 * Makes an API request to the Next.js API routes.
 *
 * @param endpoint - The endpoint to make the request to.
 * @param method - The HTTP method to use for the request.
 * @param body - The body of the request.
 * @param headers - The headers to include in the request.
 * @returns The API response, wrapped safely with an error field instead of throwing.
 */
async function apiRequest<T>(
  endpoint: string,
  method: HttpMethod,
  body?: any,
  headers?: HeadersInit
): Promise<{ data: ApiResponse<T> | null; error: any }> {
  try {
    const res = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(headers || {}),
      },
      body: method === 'GET' ? undefined : body ? JSON.stringify(body) : undefined,
    });

    const json = await res.json();

    if (!res.ok) {
      return {
        data: null,
        error: {
          status: res.status,
          message: json?.error || json?.message || 'Request failed',
          data: json,
        },
      };
    }

    return { data: json, error: null };
  } catch (err: any) {
    return {
      data: null,
      error: {
        status: err?.status || 500,
        message: err?.message || 'Network or unexpected error',
        data: err?.data,
      },
    };
  }
}

export const api = {
  get: <T>(endpoint: string, headers?: HeadersInit) =>
    apiRequest<T>(endpoint, 'GET', undefined, headers),

  post: <T>(endpoint: string, body?: any, headers?: HeadersInit) =>
    apiRequest<T>(endpoint, 'POST', body, headers),

  put: <T>(endpoint: string, body?: any, headers?: HeadersInit) =>
    apiRequest<T>(endpoint, 'PUT', body, headers),

  patch: <T>(endpoint: string, body?: any, headers?: HeadersInit) =>
    apiRequest<T>(endpoint, 'PATCH', body, headers),

  delete: <T>(endpoint: string, headers?: HeadersInit) =>
    apiRequest<T>(endpoint, 'DELETE', undefined, headers),
};
