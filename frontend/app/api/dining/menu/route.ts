/**
 * @overview Next.js Route Handler to fetch dining hall menu data.
 *
 * Copyright © 2021-2024 Hoagie Club and affiliates.
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
import type { MenuItem } from '@/types/dining';
import { getCurrentMenuId } from '@/utils/dining';
import toCamelCase from '@/utils/toCamelCase';

const ROUTE = '/api/dining/menu/';
const DEBUG = process.env.NODE_ENV !== 'production';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get('locationId');

    if (!locationId) {
      return NextResponse.json(
        { error: 'Missing locationId parameter' },
        { status: 400 }
      );
    }

    // If no menuId provided, get the next relevant menu
    const menuId = searchParams.get('menuId') || getCurrentMenuId();

    const res = await request.get<MenuItem[]>()(ROUTE, {
      arg: { location_id: locationId, menu_id: menuId }
    });

    if (!res.data || res.data.length === 0) {
      return NextResponse.json(
        { error: `No menu found for location ${locationId} at ${menuId}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: toCamelCase(res.data),
      message: `Successfully fetched ${menuId} menu`,
      status: 200
    });

  } catch (error: unknown) {
    DEBUG && console.error('Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch menu',
        message: error instanceof Error ? error.message : 'Unexpected error',
        ...(DEBUG && {
          details: error instanceof Error ? error.stack : String(error)
        })
      },
      {
        status: error instanceof Error && 'status' in error ?
          (error as any).status : 500
      }
    );
  }
}
