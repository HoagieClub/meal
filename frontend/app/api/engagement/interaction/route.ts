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
import { patchUserMenuItemInteraction } from '@/lib/endpoints';

const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Updates user menu item interaction.
 *
 * @param req - The HTTP request object.
 * @returns A NextResponse object with the updated interaction data.
 */
export async function PATCH(req: Request) {
  try {
    // Get the access token from the request.
    const { accessToken } = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        {
          status: 401,
          message: 'No access token available',
          data: null,
        },
        { status: 401 }
      );
    }

    // Get the request body.
    const body = await req.json();
    // Get the menu item API ID from the request body.
    const menuItemApiId = body.menu_item_api_id;

    // If the menu item API ID is not provided, return a 400 response.
    if (!menuItemApiId) {
      return NextResponse.json(
        {
          status: 400,
          message: 'Missing menu_item_api_id in request body',
          data: null,
        },
        { status: 400 }
      );
    }

    // Update the user menu item interaction.
    const res = await patchUserMenuItemInteraction(accessToken, {
      menu_item_api_id: menuItemApiId,
      liked: body.liked,
      favorited: body.favorited,
      saved_for_later: body.saved_for_later,
      would_eat_again: body.would_eat_again,
    });

    // If the interaction update failed, return a error response.
    if (res.status !== 200) {
      return NextResponse.json(
        {
          status: res.status,
          message: `Interaction update failed for menu_item_api_id ${menuItemApiId}`,
          data: null,
        },
        { status: res.status }
      );
    }

    // Return the response from the backend.
    return NextResponse.json({
      data: res.data,
      message: 'Successfully updated menu item interaction',
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

