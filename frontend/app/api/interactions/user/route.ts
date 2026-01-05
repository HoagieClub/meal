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
import { toCamelCase } from '@/utils/toCamelCase';
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
    const { accessToken } = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json({ error: 'No access token available' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const menuItemApiId = searchParams.get('menu_item_api_id');

    if (!menuItemApiId) {
      return NextResponse.json({ error: 'Missing menu_item_api_id parameter' }, { status: 400 });
    }

    const res = await getUserMenuItemInteraction(accessToken, { menu_item_api_id: menuItemApiId });

    // Django backend returns: {"data": interaction, "message": "..."}
    const data = res.data || res;

    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      return NextResponse.json(
        { error: `No interaction found for menu_item_api_id ${menuItemApiId}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: toCamelCase(data),
      message: `Successfully fetched interaction for menu_item_api_id ${menuItemApiId}`,
      status: 200,
    });
  } catch (error: unknown) {
    DEBUG && console.error('Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch interaction',
        message: error instanceof Error ? error.message : 'Unexpected error',
        ...(DEBUG && {
          details: error instanceof Error ? error.stack : String(error),
        }),
      },
      {
        status: error instanceof Error && 'status' in error ? (error as any).status : 500,
      }
    );
  }
}
