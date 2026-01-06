/**
 * @overview Generic fetch wrapper that handles JSON parsing and HTTP error responses.
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

import { ApiResponse, HoagieRequest, RequestConfig, HttpMethod } from '@/types/http';
import { valid } from '@/utils/http';
import { withAuth } from '@/utils/http';

// process.env is automatically handled for server components
const API_URL = process.env.HOAGIE_API_URL;

if (!API_URL && typeof window === 'undefined') {
  // Only warn on server-side
  console.warn('HOAGIE_API_URL is not defined. API requests may fail.');
}

/**
 * Makes HTTP requests to the Hoagie API.
 * Always returns {status, message, data} structure:
 * - status: HTTP status code
 * - message: Message from backend response
 * - data: Data from backend response (null on error)
 *
 * @param config - Optional request configuration (method, headers)
 * @returns Async function taking endpoint and optional args
 *
 * @example (recommended)
 * useSWR('/endpoint', request.get())
 * useSWRMutation('/endpoint', request.post())
 *
 * @example (custom headers)
 * request.get({ Authorization: 'Bearer token' })
 *
 * @example (minimal syntactic sugar)
 * request({ method: 'GET', headers: {...} })
 *
 * @throws On invalid HTTP method only
 */
export const request: HoagieRequest = (<T>(config: RequestConfig<HttpMethod> = {}) => {
  return async (
    endpoint: string,
    { arg }: { arg?: Record<string, any> } = {}
  ): Promise<ApiResponse<T>> => {
    if (config.method && !valid(config.method)) {
      throw new Error(`Invalid HTTP method: ${config.method}`);
    }

    const url = `${API_URL}${endpoint}`;
    const options: RequestInit = {
      method: config.method || 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(config.headers || {}),
      },
    };

    // Add the request body if the method is not GET and arguments are provided
    if (config.method && config.method.toUpperCase() !== 'GET' && arg) {
      options.body = JSON.stringify(arg);
    }

    try {
      // making the API request
      const res = await fetch(url, options);
      const json = await res.json();

      return {
        status: res.status,
        message: json?.message || 'Success',
        data: json?.data !== undefined ? json.data : null,
      };
    } catch (error: any) {
      return {
        status: error?.status || 500,
        message: error?.message || 'Network or unexpected error',
        data: null,
      };
    }
  };
}) as HoagieRequest;

// Add method helpers
request.get = (headers?: HeadersInit) => request({ method: 'GET', headers });
request.post = (headers?: HeadersInit) => request({ method: 'POST', headers });
request.put = (headers?: HeadersInit) => request({ method: 'PUT', headers });
request.patch = (headers?: HeadersInit) => request({ method: 'PATCH', headers });
request.delete = (headers?: HeadersInit) => request({ method: 'DELETE', headers });

request.getAuth = (accessToken: string) => request.get(withAuth(accessToken));
request.postAuth = (accessToken: string) => request.post(withAuth(accessToken));
request.putAuth = (accessToken: string) => request.put(withAuth(accessToken));
request.patchAuth = (accessToken: string) => request.patch(withAuth(accessToken));
request.deleteAuth = (accessToken: string) => request.delete(withAuth(accessToken));
