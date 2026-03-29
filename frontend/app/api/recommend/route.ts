/**
 * @overview Next.js Route Handler to get recommendation data.
 * Requires User to be authenticated
 * 
 */

import { getAccessToken } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';

const API_URL = process.env.HOAGIE_API_URL;

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

    let accessToken: string | undefined;
    try {
      const tokenResult = await getAccessToken();
      accessToken = tokenResult.accessToken;
    } catch {
      // Not logged in — don't silently continue
      return NextResponse.json(
        { status: 401, message: 'Not authenticated', data: null },
        { status: 401 }
      )
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    const res = await fetch(`${API_URL}/api/recommend/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ menu_item_api_ids: menuItemApiIds }),
    });

    const json = await res.json();

    if (!json?.data) {
      return NextResponse.json(
        { status: 404, message: 'No recommendation data found', data: null },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: json.data,
      message: 'Successfully fetched recommendation data',
      status: 200,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json(
      { status: 500, message, data: null },
      { status: 500 }
    );
  }
}