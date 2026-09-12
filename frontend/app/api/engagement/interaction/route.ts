import { AccessTokenError, getAccessToken } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { toCamelCase } from '@/lib/utils';

const API_URL = process.env.HOAGIE_API_URL;

/** Update the logged-in user's interaction (like, favourite, ...) with one menu item. */
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
    if (!body.menu_item_api_id) {
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
        menu_item_api_id: body.menu_item_api_id,
        liked: body.liked,
        favorited: body.favorited,
        saved_for_later: body.saved_for_later,
        would_eat_again: body.would_eat_again,
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.data == null) {
      // Pass the backend's status through, so the browser can tell a lost login from an outage.
      const status = res.ok ? 502 : res.status;
      const message = json?.error ?? json?.message ?? 'Failed to update interaction';
      return NextResponse.json({ status, message, data: null }, { status });
    }

    return NextResponse.json({
      status: 200,
      message: 'Interaction updated successfully',
      data: toCamelCase(json.data),
    });
  } catch (error) {
    if (error instanceof AccessTokenError) {
      return NextResponse.json(
        { status: 401, message: 'Session expired', data: null, code: 'SESSION_EXPIRED' },
        { status: 401 }
      );
    }
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ status: 500, message, data: null }, { status: 500 });
  }
}
