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

import { handleAuth, handleLogin, handleCallback, Session } from '@auth0/nextjs-auth0';

const API_URL = process.env.HOAGIE_API_URL;

const afterCallback = async (_req: unknown, session: Session) => {
  if (session.accessToken) {
    try {
      const res = await fetch(`${API_URL}/api/user/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        console.error('User verification failed:', res.status, res.statusText);
        return undefined;
      }
    } catch (error) {
      console.error('Error verifying user:', error);
      return undefined;
    }
  }
  return session;
};

export const GET = handleAuth({
  login: handleLogin({ returnTo: '/' }),
  callback: handleCallback({ afterCallback }),
});
