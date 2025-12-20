/**
 * @overview Auth0 route handler file that creates the following routes:
 * - /api/auth/login
 * - /api/auth/logout
 * - /api/auth/callback
 * - /api/auth/me
 *
 * Copyright © 2021-2025 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree or at https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

import { handleAuth, handleCallback } from '@auth0/nextjs-auth0';
import { NextRequest } from 'next/server';
import { request } from '@/lib/http';

const VERIFY_ROUTE = '/api/auth/verify';

const afterCallback = async (req: NextRequest, session: any) => {
  if (session.accessToken) {
    try {
      await request.getAuth(session.accessToken)(VERIFY_ROUTE, {});
    } catch (error) {
      console.log('error', error);
    }
  }
  return session;
};

/**
 * Handles authentication requests.
 *
 * @returns A NextResponse object with the API response.
 */

export const GET = handleAuth({
  callback: handleCallback({ afterCallback }),
});
