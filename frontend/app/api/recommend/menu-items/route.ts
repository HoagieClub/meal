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

    // Get the request body and extract the menu item API IDs.
    const body = await req.json();
    const menuItemApiIds = body.menu_item_api_ids;

    // If the menu item API IDs are not provided, return a 400 response.
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

    // Get the menu item scores from the backend.
    const res = await getMenuItemsScore(accessToken, {
      menu_item_api_ids: menuItemApiIds,
    });

    // If no scores are found, return a 404 response.
    if (!res.data) {
      return NextResponse.json(
        { status: 404, message: 'No scores found', data: null },
        { status: 404 }
      );
    }

    // Return the response from the backend.
    return NextResponse.json({
      data: res.data,
      message: 'Successfully retrieved menu items scores',
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
