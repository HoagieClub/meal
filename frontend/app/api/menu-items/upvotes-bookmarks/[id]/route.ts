import { NextResponse } from 'next/server';
import { request } from '@/lib/http';
import toCamelCase from '@/utils/toCamelCase';
import { error } from 'console';
import { getAccessToken } from '@auth0/nextjs-auth0';

const DEBUG = process.env.NODE_ENV === 'development';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { accessToken } = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json({ error: 'No access token available' }, { status: 401 });
    }

    const menuItemId = params.id;
    if (!menuItemId) {
      return NextResponse.json({ error: 'Missing menu item ID' }, { status: 400 });
    }

    const ROUTE = `/api/menu-items/upvotes-bookmarks/${menuItemId}/`;
    const res = await request.getAuth(accessToken)(ROUTE, {});
    const data = res.data || res;
    if (!data) {
      return NextResponse.json({ error: 'Failed to fetch upvotes or bookmarks' }, { status: 404 });
    }

    return NextResponse.json(toCamelCase(data));
  } catch (error: any) {
    DEBUG && console.error('Error fetching upvotes or bookmarks:', error);
    if (error?.status === 404) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch upvotes or bookmarks',
        message: error.message || 'Unexpected error',
        ...(DEBUG && { details: error.stack }),
      },
      { status: error.status || 500 }
    );
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { accessToken } = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json({ error: 'No access token available' }, { status: 401 });
    }

    const menuItemId = params.id;
    if (!menuItemId) {
      return NextResponse.json({ error: 'Missing menu item ID' }, { status: 400 });
    }

    const body = await req.json();
    const { action } = body;
    if (!action || (action !== 'bookmark' && action !== 'upvote')) {
      return NextResponse.json({ error: 'Invalid or missing action' }, { status: 400 });
    }

    const ROUTE = `/api/menu-items/upvotes-bookmarks/update/${menuItemId}/`;
    const res = await request.postAuth(accessToken)(ROUTE, {
      arg: {
        action,
      },
    });
    const data = res.data || res;
    if (!data) {
      return NextResponse.json({ error: 'Failed to update upvotes or bookmarks' }, { status: 404 });
    }

    return NextResponse.json(toCamelCase(data));
  } catch (error: any) {
    DEBUG && console.error('Error updating upvotes or bookmarks:', error);
    if (error?.status === 404) {
      return NextResponse.json({ error: 'Failed to update upvotes or bookmarks' }, { status: 404 });
    }

    return NextResponse.json(
      {
        error: 'Failed to update upvotes or bookmarks',
        message: error instanceof Error ? error.message : 'Unexpected error',
        ...(DEBUG && { details: error.stack }),
      },
      { status: error.status || 500 }
    );
  }
}
