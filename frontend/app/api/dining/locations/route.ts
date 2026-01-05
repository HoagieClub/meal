/**
 * @overview Next.js Route Handler to fetch dining locations data.
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

const ROUTE = '/api/dining/locations/';
const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Fetches dining locations data.
 *
 * @param req - The HTTP request object.
 * @returns A NextResponse object with the dining locations data.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fmt = searchParams.get('fmt') ?? 'xml';
    const categoryId = searchParams.get('category_id') ?? '2';

    // Build query string for GET request
    const queryParams = new URLSearchParams({
      category_id: categoryId,
      ...(fmt && { fmt }),
    });
    const urlWithParams = `${ROUTE}?${queryParams.toString()}`;

    const res = await request.get<any>()(urlWithParams, {});
    DEBUG && console.log('Backend response:', res);

    // Django backend returns: {"data": locations, "message": "..."}
    const locations = res.data || [];

    if (!locations?.length)
      return NextResponse.json(
        {
          error: 'No dining locations found',
          message: 'No dining locations available',
          status: 404,
          data: [],
        },
        { status: 404 }
      );

    return NextResponse.json({
      data: toCamelCase(locations),
      message: 'Successfully fetched dining locations',
      status: 200,
    });
  } catch (error: unknown) {
    DEBUG && console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unexpected error';
    const details = DEBUG ? (error instanceof Error ? error.stack : String(error)) : undefined;
    const status = (error instanceof Error && 'status' in error && (error as any).status) || 500;
    return NextResponse.json(
      {
        error: 'Failed to fetch dining locations',
        message,
        ...(details && { details }),
      },
      { status }
    );
  }
}
