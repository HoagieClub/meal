/**
 * @overview Next.js Route Handler to fetch dining menus with menu items for all locations.
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
import { toCamelCase } from '@/utils/toCamelCase';

const ROUTE = '/api/dining/menus/all-locations';
const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Fetches dining menus with menu items for all locations.
 *
 * @param req - The HTTP request object.
 * @returns A NextResponse object with the menus data.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const menuId = searchParams.get('menu_id');

    if (!menuId) {
      return NextResponse.json({ error: 'Missing menu_id parameter' }, { status: 400 });
    }

    const queryParams = new URLSearchParams({ menu_id: menuId });
    const urlWithParams = `${ROUTE}?${queryParams.toString()}`;

    const res = await request.get<any>()(urlWithParams, {});

    // Django backend returns: {"data": menus, "message": "..."}
    const data = res.data || res;

    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      return NextResponse.json({ error: `No menus found for menu_id ${menuId}` }, { status: 404 });
    }

    return NextResponse.json({
      data: toCamelCase(data),
      message: `Successfully fetched menus for menu_id ${menuId}`,
      status: 200,
    });
  } catch (error: unknown) {
    DEBUG && console.error('Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch menus',
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
