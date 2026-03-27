/**
 * @overview Next.js Route Handler to update a user's menu item interaction.
 * Requires authentication.
 */

import { getAccessToken, AccessTokenError } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { toCamelCase } from '@/utils/toCamelCase';

const API_URL = process.env.HOAGIE_API_URL;

export async function PATCH(req: Request) {
  try {
    const { accessToken } = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { status: 401, message: 'No access token available', data: null },
        { status: 401 }
      );
    }

    const body = await req.json();
    const menuItemApiId = body.menu_item_api_id;

    if (!menuItemApiId) {
      return NextResponse.json(
        { status: 400, message: 'Missing menu_item_api_id in request body', data: null },
        { status: 400 }
      );
    }

    const res = await fetch(`${API_URL}/api/engagement/interaction/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        menu_item_api_id: menuItemApiId,
        liked: body.liked,
        favorited: body.favorited,
        saved_for_later: body.saved_for_later,
        would_eat_again: body.would_eat_again,
      }),
    });

    const json = await res.json();

    if (!json?.data) {
      return NextResponse.json(
        { status: 500, message: 'Failed to update interaction', data: null },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: toCamelCase(json.data),
      message: 'Interaction updated successfully',
      status: 200,
    });
  } catch (error: unknown) {
    if (error instanceof AccessTokenError) {
      return NextResponse.json(
        { status: 401, message: 'Session expired', data: null, code: 'SESSION_EXPIRED' },
        { status: 401 }
      );
    }
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json(
      { status: 500, message, data: null },
      { status: 500 }
    );
  }
}
