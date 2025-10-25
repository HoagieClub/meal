/**
 * @overview Expected response structure from the /api/auth/profile endpoint.
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

// The expected profile data from the backend /api/auth/me endpoint.
export interface Profile {
  id?: number;
  auth0_id?: string;
  username?: string | null;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  net_id?: string | null;
  class_year?: string | null;
  daily_calorie_target?: number | null;
  daily_protein_target?: number | null;
  dietary_restrictions?: string[] | null;
  groups?: any[] | null;
  user_permissions?: any[] | null;
  is_active?: boolean | null;
  is_staff?: boolean | null;
  is_superuser?: boolean | null;
  password?: string | null;
  date_joined?: string | null;
  last_login?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// The expected successful response from the backend /api/auth/me endpoint.
export interface BackendProfileResponse {
  user?: Profile;
  error?: string;
  status: number;
}

// The expected successful response from the Next.js API route /api/auth/profile.
export interface NextJSProfileResponse {
  data?: Profile;
  message?: string;
  status: number;
  error?: string;
}
