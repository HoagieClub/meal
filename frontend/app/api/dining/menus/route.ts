/**
 * @overview Next.js Route Handler to fetch dining menu with menu items for a specific location.
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
import { getDiningMenu } from '@/lib/endpoints';

const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Fetches dining menu with menu items for a specific location.
 *
 * @param req - The HTTP request object.
 * @returns A NextResponse object with the menu data.
 */
export async function GET(req: Request) {
  try {
    // Get the query parameters from the request.
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get('location_id');
    const menuId = searchParams.get('menu_id');

    // If the location_id or menu_id is not provided, return a 400 response.
    if (!locationId || !menuId) {
      return NextResponse.json(
        {
          status: 400,
          message: 'Missing location_id or menu_id parameter',
          data: null,
        },
        { status: 400 }
      );
    }

    // Fetch menu data from the backend.
    const res = await getDiningMenu({ location_id: locationId, menu_id: menuId });

    // If no menu is found, return a 404 response.
    if (!res.data) {
      return NextResponse.json(
        {
          status: 404,
          message: `No menu found for location_id ${locationId} and menu_id ${menuId}`,
          data: null,
        },
        { status: 404 }
      );
    }

    // Return the response from the backend.
    return NextResponse.json({
      data: res.data,
      message: `Successfully fetched menu for location_id ${locationId} and menu_id ${menuId}`,
      status: 200,
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
