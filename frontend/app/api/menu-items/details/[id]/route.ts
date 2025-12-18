/**
 * @overview Next.js Route Handler to fetch menu item details with nutrition.
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

const DEBUG = process.env.NODE_ENV === 'development';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const menuItemApiId = params.id;

    if (!menuItemApiId) {
      return NextResponse.json({ error: 'Missing menu item ID parameter' }, { status: 400 });
    }

    DEBUG && console.log('Fetching menu item details for API ID:', menuItemApiId);

    // Call the Django backend endpoint
    const ROUTE = `/api/menu-items/details/${menuItemApiId}/`;
    const res = await request.get<any>()(ROUTE, {});

    DEBUG && console.log('Backend response for menu item:', menuItemApiId, res);

    // Handle both wrapped (res.data) and direct (res) response formats
    const data = res.data || res;

    if (!data) {
      return NextResponse.json(
        { error: `Menu item with ID ${menuItemApiId} not found` },
        { status: 404 }
      );
    }

    // Convert snake_case to camelCase for frontend consumption
    const camelCaseData = toCamelCase(data);

    return NextResponse.json(camelCaseData);
  } catch (error: unknown) {
    DEBUG && console.error('Error fetching menu item details:', error);

    // Check if it's a 404 from the backend
    if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
      return NextResponse.json(
        {
          error: 'Menu item not found',
          message: 'The requested menu item does not exist in the database.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch menu item details',
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
