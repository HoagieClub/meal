/**
 * @overview Next.js Route Handler to get user menu item interaction.
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
import { getUserMenuItemInteraction } from '@/lib/endpoints';

const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Gets user menu item interaction for a menu item.
 *
 * @param req - The HTTP request object.
 * @returns A NextResponse object with the interaction data.
 */
export async function GET(req: Request) {
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

    // Get the query parameters from the request and extract the menu item API ID.
    const { searchParams } = new URL(req.url);
    const menuItemApiId = searchParams.get('menu_item_api_id');

    // If the menu item API ID is not provided, return a 400 response.
    if (!menuItemApiId) {
      return NextResponse.json(
        {
          status: 400,
          message: 'Missing menu_item_api_id parameter',
          data: null,
        },
        { status: 400 }
      );
    }

    // Get the user menu item interaction from the backend.
    const res = await getUserMenuItemInteraction(accessToken, { menu_item_api_id: menuItemApiId });

    // If no interaction is found, return a 404 response.
    if (!res.data) {
      return NextResponse.json(
        {
          status: 404,
          message: `No interaction found for menu_item_api_id ${menuItemApiId}`,
          data: null,
        },
        { status: 404 }
      );
    }

    // Return the response from the backend.
    return NextResponse.json({
      data: res.data,
      message: `Successfully fetched interaction for menu_item_api_id ${menuItemApiId}`,
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
