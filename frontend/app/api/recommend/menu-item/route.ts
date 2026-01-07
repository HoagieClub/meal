/**
 * @overview Next.js Route Handler to get recommendation score for a single menu item.
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
import { getMenuItemScore } from '@/lib/endpoints';

const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Gets recommendation score for a single menu item.
 *
 * @param req - The HTTP request object.
 * @returns A NextResponse object with the menu item score.
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
    const menuItemApiId = body.menu_item_api_id;

    if (menuItemApiId === undefined || menuItemApiId === null) {
      return NextResponse.json(
        {
          status: 400,
          message: 'Missing menu_item_api_id in request body',
          data: null,
        },
        { status: 400 }
      );
    }

    const res = await getMenuItemScore(accessToken, {
      menu_item_api_id: Number(menuItemApiId),
    });

    // Django backend returns: {"data": 0.85, "message": "..."}
    const data = res.data !== undefined ? res.data : res;

    if (typeof data !== 'number') {
      return NextResponse.json(
        {
          status: 404,
          message: 'Invalid score returned',
          data: null,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data,
      message: 'Successfully retrieved menu item score',
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

