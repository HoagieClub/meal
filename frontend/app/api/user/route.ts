/**
 * @overview Next.js Route Handler to verify and get or create user.
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

import { getAccessToken } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { verifyUser } from '@/lib/endpoints';

const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Verifies and gets or creates a user.
 *
 * @param req - The HTTP request object.
 * @returns A NextResponse object with the user data.
 */
export async function POST(req: Request) {
  try {
    // Get the access token from the request.
    const { accessToken } = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        {
          status: 401,
          message: 'No access token available',
          data: null,
        },
        { status: 401 }
      );
    }

    // Verify and get or create the user.
    const res = await verifyUser(accessToken);

    // If the user verification failed, return a error response.
    if (res.status !== 200) {
      return NextResponse.json(
        {
          status: res.status,
          message: 'Failed to get or create user',
          data: null,
        },
        { status: res.status }
      );
    }

    // Return the response from the backend.
    return NextResponse.json({
      data: res.data,
      message: 'User fetched or created successfully',
      status: 200,
    });
  } catch (error: unknown) {
    // If an error occurs, return a error response.
    DEBUG && console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unexpected error';
    const status = (error instanceof Error && 'status' in error && (error as any).status) || 500;
    const details = error instanceof Error ? error.stack : String(error);
    return NextResponse.json(
      { status, message, data: null, ...(DEBUG && { details }) },
      { status }
    );
  }
}

