/**
 * @overview Next.js Route Handler to get user menu item interactions for multiple menu items.
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
import { toCamelCase } from '@/utils/toCamelCase';
import { getUserMenuItemsInteractions } from '@/lib/endpoints';

const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Gets user menu item interactions for multiple menu items.
 *
 * @param req - The HTTP request object.
 * @returns A NextResponse object with the interactions data.
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

    const res = await getUserMenuItemsInteractions(accessToken, {
      menu_item_api_ids: menuItemApiIds,
    });

    // Django backend returns: {"data": {api_id: interaction, ...}, "message": "..."}
    const data = res.data || res;

    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      return NextResponse.json(
        {
          status: 404,
          message: 'No user menu item interactions found for the provided menu item API IDs',
          data: null,
        },
        { status: 404 }
      );
    }

    // Convert dictionary values to camelCase
    const processedData: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      processedData[key] = value ? toCamelCase(value) : null;
    }

    return NextResponse.json({
      data: processedData,
      message: `Successfully fetched user menu item interactions for menu item API IDs ${menuItemApiIds}`,
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
