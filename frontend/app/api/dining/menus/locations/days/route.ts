/**
 * @overview Next.js Route Handler to fetch dining menus for all locations for a date range.
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
import { getDiningMenusForLocationsAndDays } from '@/lib/endpoints';

const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Fetches dining menus for all locations for a date range.
 *
 * @param req - The HTTP request object.
 * @returns A NextResponse object with the menus data.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing start_date or end_date parameter' },
        { status: 400 }
      );
    }

    const res = await getDiningMenusForLocationsAndDays({
      start_date: startDate,
      end_date: endDate,
    });

    // Django backend returns: {"data": menus, "message": "..."}
    const data = res.data || {};

    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      return NextResponse.json(
        { error: `No menus found for date range ${startDate} to ${endDate}` },
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
      message: `Successfully fetched menus for date range ${startDate} to ${endDate}`,
      status: 200,
    });
  } catch (error: unknown) {
    DEBUG && console.error('Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch menus',
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

