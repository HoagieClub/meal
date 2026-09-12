import { getAccessToken } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { toCamelCase } from '@/lib/utils';

const API_URL = process.env.HOAGIE_API_URL;

/**
 * Engagement data (metrics, plus the caller's interactions when logged in) for a list of
 * menu items. Anonymous requests are forwarded without a token and get metrics only.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const menuItemApiIds = body.menu_item_api_ids;
    if (!menuItemApiIds) {
      return NextResponse.json(
        { status: 400, message: 'Missing menu_item_api_ids in request body', data: null },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    try {
      const { accessToken } = await getAccessToken();
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    } catch {
      // Not logged in.
    }

    const res = await fetch(`${API_URL}/api/engagement/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ menu_item_api_ids: menuItemApiIds }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.data == null) {
      // Pass the backend's status and message through rather than inventing new ones.
      const status = res.ok ? 502 : res.status;
      const message = json?.error ?? json?.message ?? 'Failed to fetch engagement data';
      return NextResponse.json({ status, message, data: null }, { status });
    }

    return NextResponse.json({
      status: 200,
      message: 'Successfully fetched engagement data',
      data: toCamelCase(json.data),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ status: 500, message, data: null }, { status: 500 });
  }
}
