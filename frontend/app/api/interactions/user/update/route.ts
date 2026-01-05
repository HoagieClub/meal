/**
 * @overview Next.js Route Handler to update user menu item interaction.
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
import { toCamelCase } from '@/utils/toCamelCase';
import { updateUserMenuItemInteraction, patchUserMenuItemInteraction } from '@/lib/endpoints';

const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Updates user menu item interaction.
 *
 * @param req - The HTTP request object.
 * @returns A NextResponse object with the updated interaction data.
 */
export async function PUT(req: Request) {
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

    const res = await updateUserMenuItemInteraction(accessToken, {
      menu_item_api_id: menuItemApiId,
      liked: body.liked,
      favorited: body.favorited,
      saved_for_later: body.saved_for_later,
      would_eat_again: body.would_eat_again,
    });

    // Django backend returns: {"data": interaction, "message": "..."}
    const data = res.data || res;

    return NextResponse.json({
      data: toCamelCase(data),
      message: 'Successfully updated menu item interaction',
      status: 200,
    });
  } catch (error: unknown) {
    DEBUG && console.error('Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to update menu item interaction',
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

/**
 * Updates user menu item interaction (PATCH method).
 */
export async function PATCH(req: Request) {
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

    const res = await patchUserMenuItemInteraction(accessToken, {
      menu_item_api_id: menuItemApiId,
      liked: body.liked,
      favorited: body.favorited,
      saved_for_later: body.saved_for_later,
      would_eat_again: body.would_eat_again,
    });

    // Django backend returns: {"data": interaction, "message": "..."}
    const data = res.data || res;

    return NextResponse.json({
      data: toCamelCase(data),
      message: 'Successfully updated menu item interaction',
      status: 200,
    });
  } catch (error: unknown) {
    DEBUG && console.error('Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to update menu item interaction',
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
