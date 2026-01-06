/**
 * @overview Next.js Route Handler to fetch dining menu with menu items for a specific location.
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
import { toCamelCase } from '@/utils/toCamelCase';
import { getDiningMenu } from '@/lib/endpoints';

const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Fetches dining menu with menu items for a specific location.
 *
 * @param req - The HTTP request object.
 * @returns A NextResponse object with the menu data.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get('location_id');
    const menuId = searchParams.get('menu_id');

    if (!locationId || !menuId) {
      return NextResponse.json(
        {
          status: 400,
          message: 'Missing location_id or menu_id parameter',
          data: null,
        },
        { status: 400 }
      );
    }

    const res = await getDiningMenu({ location_id: locationId, menu_id: menuId });

    // Django backend returns: {"data": menu, "message": "..."}
    const data = res.data || res;

    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      return NextResponse.json(
        {
          status: 404,
          message: `No menu found for location_id ${locationId} and menu_id ${menuId}`,
          data: null,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: toCamelCase(data),
      message: `Successfully fetched menu for location_id ${locationId} and menu_id ${menuId}`,
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
