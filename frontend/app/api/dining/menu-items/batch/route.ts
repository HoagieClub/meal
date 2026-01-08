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
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const apiIds = body.api_ids;

    // If the api_ids are not provided, return a 400 response.
    if (!apiIds) {
      return NextResponse.json(
        {
          status: 400,
          message: 'Missing api_ids in request body',
          data: null,
        },
        { status: 400 }
      );
    }

    // Fetch menu items data from the backend.
    const res = await getDiningMenuItems({ api_ids: apiIds.map(Number) });

    // If no menu items are found, return a 404 response.
    if (!res.data) {
      return NextResponse.json(
        {
          status: 404,
          message: `No menu items found for api_ids ${apiIds}`,
          data: null,
        },
        { status: 404 }
      );
    }

    // Return the response from the backend.
    return NextResponse.json({
      status: 200,
      message: 'Successfully fetched menu items',
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
