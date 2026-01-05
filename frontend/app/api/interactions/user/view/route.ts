/**
 * @overview Next.js Route Handler to record a user menu item view.
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

import { getAccessToken } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { request } from '@/lib/http';

const ROUTE = '/api/interactions/user/menu-item/view/';
const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Records a user menu item view.
 *
 * @param req - The HTTP request object.
 * @returns A NextResponse object.
 */
export async function POST(req: Request) {
  try {
    const { accessToken } = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json({ error: 'No access token available' }, { status: 401 });
    }

    const body = await req.json();
    const menuItemApiId = body.menu_item_api_id;

    if (!menuItemApiId) {
      return NextResponse.json(
        { error: 'Missing menu_item_api_id in request body' },
        { status: 400 }
      );
    }

    const res = await request.postAuth(accessToken)(ROUTE, {
      arg: { menu_item_api_id: menuItemApiId },
    });

    return NextResponse.json({
      data: res,
      message: 'Successfully recorded menu item view',
      status: 200,
    });
  } catch (error: unknown) {
    DEBUG && console.error('Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to record menu item view',
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
