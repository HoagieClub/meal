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
import type { DiningLocation } from '@/types/dining';
import toCamelCase from '@/utils/toCamelCase';

const ROUTE = '/api/dining/locations/';
const DEBUG = process.env.NODE_ENV !== 'production';

export async function GET() {
  try {
    const res = await request.get<DiningLocation[]>()(ROUTE, {
      arg: { 
        category_id: '2',
        fmt: 'xml'
      }
    });

    if (!res.data || res.data.length === 0) {
      return NextResponse.json(
        { error: 'No dining locations found' },
        { status: 404 }
      );
    }

    const locations = res.data?.locations?.location || [];
    
    return NextResponse.json({
      data: toCamelCase(locations),
      message: 'Successfully fetched dining locations',
      status: 200
    });

  } catch (error: unknown) {
    DEBUG && console.error('Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch dining locations',
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
