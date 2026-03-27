/**
 * @overview Next.js Route Handler to get engagement data (interactions + metrics) for multiple menu items.
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

import { getAccessToken, AccessTokenError } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { getEngagementData, getEngagementDataPublic } from '@/lib/endpoints';

const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Gets engagement data (interactions + metrics) for multiple menu items.
 * If the user is authenticated, returns both interactions and metrics.
 * If not authenticated, returns metrics only.
 *
 * @param req - The HTTP request object.
 * @returns A NextResponse object with { interactions, metrics } data.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const menuItemApiIds = body.menu_item_api_ids;

    if (!menuItemApiIds) {
      return NextResponse.json(
        {
          status: 400,
          message: 'Missing menu_item_api_ids in request body',
          data: null,
        },
        { status: 400 }
      );
    }

    // Try authenticated request first (returns interactions + metrics)
    let accessToken: string | undefined;
    try {
      const tokenResult = await getAccessToken();
      accessToken = tokenResult.accessToken;
    } catch (e) {
      // Not logged in — will fall through to public request
    }

    let res;
    if (accessToken) {
      res = await getEngagementData(accessToken, { menu_item_api_ids: menuItemApiIds });
    } else {
      res = await getEngagementDataPublic({ menu_item_api_ids: menuItemApiIds });
    }

    if (!res.data) {
      return NextResponse.json(
        {
          status: 404,
          message: 'No engagement data found',
          data: null,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: res.data,
      message: 'Successfully fetched engagement data',
      status: 200,
    });
  } catch (error: unknown) {
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
