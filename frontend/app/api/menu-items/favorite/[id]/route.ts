/**
 * @overview Next.js Route Handler to fetch and update menu item favorite status.
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
import { getAccessToken } from '@auth0/nextjs-auth0';

const DEBUG = process.env.NODE_ENV === 'development';
const GET_FAVORITES_ROUTE = '/api/menu-items/favorites/';
const UPDATE_FAVORITES_ROUTE = '/api/menu-items/favorites/update/';

/**
 * Fetches menu item favorite status.
 *
 * @param req - The HTTP request object.
 * @param params - The parameters object.
 * @returns A NextResponse object with the menu item favorite status.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { accessToken } = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json({ error: 'No access token available' }, { status: 401 });
    }

    const menuItemId = params.id;
    if (!menuItemId) {
      return NextResponse.json({ error: 'Missing menu item ID' }, { status: 400 });
    }

    const res = await request.getAuth(accessToken)(`${GET_FAVORITES_ROUTE}${menuItemId}/`, {});
    const data = res.data || res;
    if (!data) {
      return NextResponse.json(
        { error: 'Failed to fetch menu item favorite status' },
        { status: 404 }
      );
    }

    return NextResponse.json(toCamelCase(data));
  } catch (error: any) {
    DEBUG && console.error('Error fetching menu item favorite status:', error);
    if (error?.status === 404) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch menu item favorite status',
        message: error.message || 'Unexpected error',
        ...(DEBUG && { details: error.stack }),
      },
      { status: error.status || 500 }
    );
  }
}

/**
 * Updates menu item favorite status.
 *
 * @param req - The HTTP request object.
 * @param params - The parameters object.
 * @returns A NextResponse object with the updated menu item favorite status.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { accessToken } = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json({ error: 'No access token available' }, { status: 401 });
    }

    const menuItemId = params.id;
    if (!menuItemId) {
      return NextResponse.json({ error: 'Missing menu item ID' }, { status: 400 });
    }

    const res = await request.postAuth(accessToken)(`${UPDATE_FAVORITES_ROUTE}${menuItemId}/`, {});
    const data = res.data || res;
    if (!data) {
      return NextResponse.json(
        { error: 'Failed to update menu item favorite status' },
        { status: 404 }
      );
    }

    return NextResponse.json(toCamelCase(data));
  } catch (error: any) {
    DEBUG && console.error('Error updating menu item favorite status:', error);
    if (error?.status === 404) {
      return NextResponse.json(
        { error: 'Failed to update menu item favorite status' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to update menu item favorite status',
        message: error instanceof Error ? error.message : 'Unexpected error',
        ...(DEBUG && { details: error.stack }),
      },
      { status: error.status || 500 }
    );
  }
}
