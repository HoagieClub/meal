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
import { toCamelCase } from '@/utils/toCamelCase';
import { getPlacesOpen } from '@/lib/endpoints';

type Place = any; // TODO: Define proper Place type
type PlacesResponse = {
  places: Place[];
  message: string;
  status: number;
};

const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Fetches open places availability.
 *
 * @param req - The HTTP request object.
 * @returns A NextResponse object with the open places availability data.
 */
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
    const res = await getPlacesOpen();

    if (!res.data || res.data.length === 0) {
      return NextResponse.json({ error: 'No open places found' }, { status: 404 });
    }

    const data = toCamelCase(res.data) as Place[];

    const response: PlacesResponse = {
      places: data,
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
        status: error instanceof Error && 'status' in error ? (error as any).status : 500,
      }
    );
  }
}
