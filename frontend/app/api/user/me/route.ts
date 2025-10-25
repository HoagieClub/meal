import { getAccessToken } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { NextJSProfileResponse, BackendProfileResponse, Profile } from '@/types/profile';
import { request } from '@/lib/http';

const ROUTE = '/api/user/me/';
const DEBUG = process.env.NODE_ENV === 'development';

export async function GET(req: Request) {
  try {
    const { accessToken } = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json({ error: 'No access token available' }, { status: 401 });
    }

    const res = await request.getAuth(accessToken)(ROUTE, {
      arg: {},
    }) as BackendProfileResponse;

    if (!res.user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    return NextResponse.json({
      data: res.user as Profile,
      message: 'Successfully fetched user profile',
      status: 200,
    } as NextJSProfileResponse);
  } catch (error: unknown) {
    DEBUG && console.error('Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch user profile',
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
