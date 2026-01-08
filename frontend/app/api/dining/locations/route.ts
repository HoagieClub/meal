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
import { getDiningLocations } from '@/lib/endpoints';

const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Fetches dining locations data.
 *
 * @param req - The HTTP request object.
 * @returns A NextResponse object with the dining locations data.
 */
export async function GET(req: Request) {
  try {
    // Get the query parameters from the request.
    const { searchParams } = new URL(req.url);
    const fmt = searchParams.get('fmt') ?? 'xml';
    const categoryId = searchParams.get('category_id') ?? '2';

    // If the category_id is not valid, return a 400 response.
    if (!categoryId || !['2', '3'].includes(categoryId)) {
      return NextResponse.json(
        {
          status: 400,
          message: 'Invalid category_id',
          data: null,
        },
        { status: 400 }
      );
    }

    // Fetch dining locations data from the backend.
    const res = await getDiningLocations({ category_id: categoryId, fmt });

    // If no locations are found, return a 404 response.
    if (!res.data) {
      return NextResponse.json(
        {
          status: 404,
          message: `No dining locations found for category_id ${categoryId}`,
          data: null,
        },
        { status: 404 }
      );
    }

    // Return the response from the backend.
    return NextResponse.json({
      status: 200,
      message: 'Successfully fetched dining locations',
      data: res.data,
    });
  } catch (error: unknown) {
    // If an error occurs, return a error response.
    DEBUG && console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unexpected error';
    const status = (error instanceof Error && 'status' in error && (error as any).status) || 500;
    const details = error instanceof Error ? error.stack : String(error);
    return NextResponse.json(
      { status, message, data: null, ...(DEBUG && { details }) },
      { status }
    );
  }
}
