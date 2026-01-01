/**
 * @overview Next.js Route Handler to fetch dining hall menu data for all locations and a given day.
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

const ROUTE = '/api/dining/menu/with-nutrition/all-locations/day/';
const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Fetches dining hall menu data with nutrition information for all locations and a given day.
 *
 * @param req - The HTTP request object.
 * @returns A NextResponse object with the dining hall menu data.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const menuDate = searchParams.get('menu_date');

    if (!menuDate) {
      return NextResponse.json({ error: 'Missing menu_date parameter' }, { status: 400 });
    }

    const res = await request.get<any>()(`${ROUTE}?menu_date=${menuDate}`, {});

    DEBUG && console.log('Backend response for menu:', menuDate, res);

    // Handle both wrapped (res.data) and direct (res) response formats
    const data = res.data || res;

    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      return NextResponse.json({ error: `No menu found for date ${menuDate}` }, { status: 404 });
    }

    return NextResponse.json({
      data: toCamelCase(data),
      message: `Successfully fetched menu for ${menuDate}`,
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
