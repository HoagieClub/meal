/**
 * @overview Next.js middleware file for the Hoagie Meal app.
 * Middleware allows you to intercept requests before they reach the server.
 * Learn more: https://nextjs.org/docs/app/building-your-application/routing/middleware
 *
 * Copyright © 2021-2025 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree or at https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// As an example, we will use middleware to implement protected routes.
// Docs: https://nextjs.org/docs/app/building-your-application/authentication#defining-protected-routes
const protectedRoutes = ['/goals', 'menu'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // const token = await 
  // Check if the user is trying to access one of the protected routes
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    // The Auth0 session is stored in a cookie called 'appSession' by default
    const token = req.cookies.get('appSession');
    console.log('token', token);

    // If no session token exists, redirect to login
    if (!token) {
      // Login and redirect to nextUrl
      const loginUrl = new URL('/api/auth/login', req.url);
      loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Continue processing if the user is authenticated or not on a protected route
  return NextResponse.next();
}

// Apply this middleware to the protected routes
export const config = {
  matcher: ['/:path*'],
};
