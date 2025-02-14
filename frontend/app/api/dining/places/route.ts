/**
 * @overview Next.js Route Handler to fetch open places availability.
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
import toCamelCase from '@/utils/toCamelCase';
import type { Place, PlacesResponse } from '@/types/places';

const ROUTE = '/places/open';
const DEBUG = process.env.DEBUG?.toLowerCase() === 'true';

console.log(process.env.HOAGIE_API_URL);

export async function GET(req: Request) {
  /**
   * @description Fetches open places availability.
   * @param {Request} req - The request object.
   * @returns {Promise<NextResponse>} The response object.
   * @throws {Error} If the request fails.
   *
   * @example
   * const response = await fetch('/api/dining/places/open');
   * const data = await response.json();
   * console.log(data);
   */

  try {
    const res = await request.get<Place[]>()(ROUTE, {});

    if (!res.data || res.data.length === 0) {
      return NextResponse.json(
        { error: 'No open places found' },
        { status: 404 }
      );
    }

    const data = toCamelCase(res.data) as Place[];

    const response: PlacesResponse = {
      data,
      message: 'Successfully fetched open places',
      status: 200,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    DEBUG && console.error('Error fetching open places:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch open places',
        message: error instanceof Error ? error.message : 'Unexpected error',
        ...(DEBUG && {
          details: error instanceof Error ? error.stack : String(error),
        }),
      },
      {
        status:
          error instanceof Error && 'status' in error
            ? (error as any).status
            : 500,
      }
    );
  }
}
