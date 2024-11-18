/**
 * @overview Next.js Route Handler to fetch dining locations data.
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
import toCamelCase from '@/utils/toCamelCase';
import type { DiningEvent } from '@/types/dining';

const ROUTE = '/api/dining/events/';
const DEBUG = process.env.NODE_ENV !== 'production';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const placeId = searchParams.get('placeId') || '1007';

    const res = await request.get<DiningEvent[]>()(ROUTE, {
      arg: { place_id: placeId }
    });

    if (!res.data || res.data.length === 0) {
      return NextResponse.json(
        { error: `No events found for place ${placeId}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: toCamelCase(res.data),
      message: 'Successfully fetched dining events',
      status: 200
    });

  } catch (error: unknown) {
    DEBUG && console.error('Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch dining events',
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