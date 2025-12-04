/**
 * @overview Next.js Route Handler to fetch dining locations with menus.
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

const ROUTE = '/api/dining/locations/with-menus/';
const DEBUG = process.env.NODE_ENV === 'development';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const menuId = searchParams.get('menu_id');

    if (!menuId) {
      return NextResponse.json(
        {
          error: 'Missing menu_id parameter',
          message: 'menu_id is required',
          status: 400,
        },
        { status: 400 }
      );
    }

    const res = await request.get<any>()(`${ROUTE}?menu_id=${menuId}`, {});
    DEBUG && console.log('Backend response for menu:', menuId, res);

    // The response structure can be either res.data or res directly depending on the backend
    const data = res.data || res;

    if (!data || !data.locations) {
      return NextResponse.json(
        {
          error: 'No menu data found',
          message: `No menu found for menu_id: ${menuId}`,
          status: 404,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    DEBUG && console.error('Error fetching menu data:', error);
    const message = error instanceof Error ? error.message : 'Unexpected error';
    const details = DEBUG ? (error instanceof Error ? error.stack : String(error)) : undefined;
    const status = (error instanceof Error && 'status' in error && (error as any).status) || 500;

    return NextResponse.json(
      {
        error: 'Failed to fetch menu data',
        message,
        ...(details && { details }),
      },
      { status }
    );
  }
}
