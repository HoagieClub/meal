/**
 * @overview Next.js Route Handler to fetch dining hall menu data.
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

import { NextResponse } from 'next/server';
import { request } from '@/lib/http';
import { getCurrentMenuId } from '@/utils/dining';
import toCamelCase from '@/utils/toCamelCase';

const ROUTE = '/api/dining/menu/';
const DEBUG = process.env.NODE_ENV === 'development';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get('location_id');

    if (!locationId) {
      return NextResponse.json({ error: 'Missing location_id parameter' }, { status: 400 });
    }

    // If no menuId provided, get the next relevant menu
    const menuId = searchParams.get('menu_id') || getCurrentMenuId();

    const res = await request.get<any>()(`${ROUTE}?location_id=${locationId}&menu_id=${menuId}`, {});

    DEBUG && console.log('Backend response for menu:', menuId, 'location:', locationId, res);

    // Handle both wrapped (res.data) and direct (res) response formats
    const data = res.data || res;

    if (!data || (Array.isArray(data) && data.length === 0)) {
      return NextResponse.json(
        { error: `No menu found for location ${locationId} at ${menuId}` },
        { status: 404 }
      );
    }

    // If data has a 'menus' property, return it directly (for compatibility)
    // Otherwise wrap in the standard format
    if (data.menus) {
      return NextResponse.json(data);
    }

    return NextResponse.json({
      data: toCamelCase(data),
      message: `Successfully fetched ${menuId} menu`,
      status: 200,
    });
  } catch (error: unknown) {
    DEBUG && console.error('Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch menu',
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
