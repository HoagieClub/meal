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

const urlCache = new Map<string, { data: any; timestamp: number }>();
const DEFAULT_TTL = 5 * 60 * 1000;   // 5 minutes
const METRICS_TTL = 15 * 1000;        // 15 seconds

function getCacheTTL(url: string): number {
  return url.includes('/metrics') ? METRICS_TTL : DEFAULT_TTL;
}

/**
 * Interface for the API request props
 *
 * @param endpoint - The endpoint to make the request to
 * @param method - The HTTP method to use for the request
 * @param body - The body of the request
 * @param headers - The headers to include in the request
 */
interface ApiRequestProps<T> {
  endpoint: string;
  method: HttpMethod;
  body?: any;
  headers?: HeadersInit;
}

/**
 * Makes an API request to the Next.js API routes
 *
 * @returns The API response with consistent structure
 */
async function apiRequest<T>({
  endpoint,
  method,
  body,
  headers,
}: ApiRequestProps<T>): Promise<ApiResponse<T>> {
  try {
    // Make the API request
    const res = await fetch(endpoint, {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(headers || {}),
      },
      body: method === 'GET' ? undefined : body ? JSON.stringify(body) : undefined,
    });

    const json = await res.json();

    // Return the API response with consistent structure
    return {
      status: json?.status || res.status,
      message: json?.message || 'Success',
      data: json?.data !== undefined ? json.data : null,
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

/**
 * API request functions
 *
 * @returns The API response with consistent structure
 */
export const api = {
  get: <T>(endpoint: string, headers?: HeadersInit): Promise<ApiResponse<T>> => {
    const cached = urlCache.get(endpoint);
    if (cached && Date.now() - cached.timestamp < getCacheTTL(endpoint)) {
      return Promise.resolve(cached.data as ApiResponse<T>);
    }
    return apiRequest<T>({ endpoint, method: 'GET', headers }).then((result) => {
      if (!result.error) {
        urlCache.set(endpoint, { data: result, timestamp: Date.now() });
      }
      return result;
    });
  },

  post: <T>(endpoint: string, body?: any, headers?: HeadersInit) =>
    apiRequest<T>({ endpoint, method: 'POST', body, headers }),

  put: <T>(endpoint: string, body?: any, headers?: HeadersInit) =>
    apiRequest<T>({ endpoint, method: 'PUT', body, headers }),

  patch: <T>(endpoint: string, body?: any, headers?: HeadersInit) =>
    apiRequest<T>({ endpoint, method: 'PATCH', body, headers }),

  delete: <T>(endpoint: string, headers?: HeadersInit) =>
    apiRequest<T>({ endpoint, method: 'DELETE', headers }),
};
