/**
 * @overview Next.js Route Handler to get recommendation scores for multiple menu items.
 *
 * Copyright © 2021-2025 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this tree or at
 *
 *    https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

import { getAccessToken } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { getMenuItemsScore } from '@/lib/endpoints';

const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Gets recommendation scores for multiple menu items.
 *
 * @param req - The HTTP request object.
 * @returns A NextResponse object with the menu items scores.
 */
export async function POST(req: Request) {
  try {
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

    if (!Array.isArray(menuItemApiIds)) {
      return NextResponse.json(
        {
          status: 400,
          message: 'menu_item_api_ids must be an array',
          data: null,
        },
        { status: 400 }
      );
    }

    const res = await getMenuItemsScore(accessToken, {
      menu_item_api_ids: menuItemApiIds.map(Number),
    });

    // Django backend returns: {"data": {api_id: score, ...}, "message": "..."}
    const data = res.data || res;

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return NextResponse.json(
        {
          status: 404,
          message: 'No scores returned',
          data: null,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data,
      message: 'Successfully retrieved menu items scores',
      status: 200,
    });
  } catch (error: unknown) {
    DEBUG && console.error('Error:', error);

    const status = error instanceof Error && 'status' in error ? (error as any).status : 500;
    return NextResponse.json(
      {
        status,
        message: error instanceof Error ? error.message : 'Unexpected error',
        data: null,
        ...(DEBUG && {
          details: error instanceof Error ? error.stack : String(error),
        }),
      },
      { status }
    );
  }
}
