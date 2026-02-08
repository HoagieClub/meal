/**
 * @overview Next.js Route Handler to get or cache retail locations.
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
import { getRetailLocations } from '@/lib/endpoints';

const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Gets or caches retail locations.
 *
 * @param req - The HTTP request object.
 * @returns A NextResponse object with the retail locations data.
 */
export async function GET(req: Request) {
  try {
    // Fetch retail locations data from the backend.
    const res = await getRetailLocations();

    // If no locations are found, return a 404 response.
    if (!res.data) {
      return NextResponse.json(
        {
          status: 404,
          message: 'No retail locations found',
          data: null,
        },
        { status: 404 }
      );
    }

    // Return the response from the backend.
    return NextResponse.json({
      status: 200,
      message: 'Successfully fetched retail locations',
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

