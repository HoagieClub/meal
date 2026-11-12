import { getAccessToken } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { toCamelCase } from '@/lib/utils';

const API_URL = process.env.HOAGIE_API_URL;

// The answer changes with every vote and depends on who is asking, so it is never cached.
export const dynamic = 'force-dynamic';

/**
 * The campus-wide rating count and any running rating campaign, with the caller's progress in it
 * when logged in. Anonymous requests are forwarded without a token.
 */
export async function GET() {
  try {
    const headers: Record<string, string> = {};
    try {
      const { accessToken } = await getAccessToken();
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    } catch {
      // Not logged in.
    }

    const res = await fetch(`${API_URL}/api/engagement/stats/`, { headers, cache: 'no-store' });
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.data == null) {
      const status = res.ok ? 502 : res.status;
      const message = json?.error ?? json?.message ?? 'Failed to fetch engagement stats';
      return NextResponse.json({ status, message, data: null }, { status });
    }

    return NextResponse.json({
      status: 200,
      message: 'Successfully fetched engagement stats',
      data: toCamelCase(json.data),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ status: 500, message, data: null }, { status: 500 });
  }
}
