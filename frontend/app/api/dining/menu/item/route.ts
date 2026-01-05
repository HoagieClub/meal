/**
 * @overview Next.js Route Handler to fetch a single dining menu item.
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

const ROUTE = '/api/dining/menu/item/';
const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Fetches a single dining menu item by API ID.
 *
 * @param req - The HTTP request object.
 * @returns A NextResponse object with the menu item data.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const apiId = searchParams.get('api_id');

    if (!apiId) {
      return NextResponse.json({ error: 'Missing api_id parameter' }, { status: 400 });
    }

    const queryParams = new URLSearchParams({ api_id: apiId });
    const urlWithParams = `${ROUTE}?${queryParams.toString()}`;

    const res = await request.get<any>()(urlWithParams, {});

    // Django backend returns: {"data": menu_item, "message": "..."}
    const data = res.data || res;

    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      return NextResponse.json(
        { error: `No menu item found for api_id ${apiId}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: toCamelCase(data),
      message: `Successfully fetched menu item for api_id ${apiId}`,
      status: 200,
    });
  } catch (error: unknown) {
    DEBUG && console.error('Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch menu item',
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
