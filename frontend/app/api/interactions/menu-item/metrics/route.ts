/**
 * @overview Next.js Route Handler to get menu item metrics.
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
import { getMenuItemMetrics } from '@/lib/endpoints';

const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Gets metrics for a menu item.
 *
 * @param req - The HTTP request object.
 * @returns A NextResponse object with the metrics data.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const menuItemApiId = searchParams.get('menu_item_api_id');

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

    const res = await getMenuItemMetrics({ menu_item_api_id: menuItemApiId });

    // Django backend returns: {"data": metrics, "message": "..."}
    const data = res.data || res;

    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      return NextResponse.json(
        {
          status: 404,
          message: `No metrics found for menu_item_api_id ${menuItemApiId}`,
          data: null,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: toCamelCase(data),
      message: `Successfully fetched metrics for menu_item_api_id ${menuItemApiId}`,
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
