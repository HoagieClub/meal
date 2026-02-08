/**
 * @overview Next.js Route Handler to get or cache residential menus for a date.
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
import { getResidentialMenusForDate } from '@/lib/endpoints';

const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Gets or caches residential menus for a date.
 *
 * @param req - The HTTP request object.
 * @returns A NextResponse object with the menus data.
 */
export async function GET(req: Request) {
  try {
    // Get the query parameters from the request.
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    // If the date is not provided, return a 400 response.
    if (!date) {
      return NextResponse.json(
        {
          status: 400,
          message: 'Missing date parameter',
          data: null,
        },
        { status: 400 }
      );
    }

    // Fetch menus data from the backend.
    const res = await getResidentialMenusForDate({ date });

    // If no menus are found, return a 404 response.
    if (!res.data) {
      return NextResponse.json(
        {
          status: 404,
          message: `No residential menus found for date ${date}`,
          data: null,
        },
        { status: 404 }
      );
    }

    // Return the response from the backend.
    return NextResponse.json({
      status: 200,
      message: `Successfully fetched residential menus for date ${date}`,
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

