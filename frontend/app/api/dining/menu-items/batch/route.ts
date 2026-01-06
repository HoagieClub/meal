/**
 * @overview Next.js Route Handler to fetch multiple dining menu items.
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
import { getDiningMenuItems } from '@/lib/endpoints';

const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Fetches multiple dining menu items by API IDs.
 *
 * @param req - The HTTP request object.
 * @returns A NextResponse object with the menu items data.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const apiIds = searchParams.get('api_ids');

    if (!apiIds) {
      return NextResponse.json(
        {
          status: 400,
          message: 'Missing api_ids parameter',
          data: null,
        },
        { status: 400 }
      );
    }

    const res = await getDiningMenuItems({ api_ids: apiIds });

    // Django backend returns: {"data": menu_items, "message": "..."}
    const data = res.data || {};

    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      return NextResponse.json(
        {
          status: 404,
          message: `No menu items found for api_ids ${apiIds}`,
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
      message: `Successfully fetched menu items for api_ids ${apiIds}`,
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
