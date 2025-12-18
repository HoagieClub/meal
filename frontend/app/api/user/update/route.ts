import { getAccessToken } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { request } from '@/lib/http';
import { toSnakeCase } from '@/utils/toCamelCase';

const ROUTE = '/api/user/update/';
const DEBUG = process.env.NODE_ENV === 'development';

export async function POST(req: Request) {
  try {
    const { accessToken } = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json({ error: 'No access token available' }, { status: 401 });
    }

    const body = await req.json();
    const snakeCaseBody = toSnakeCase(body);
    const res = await request.postAuth(accessToken)(ROUTE, { arg: snakeCaseBody });

    return NextResponse.json({
      data: res,
      message: 'Successfully updated user profile',
      status: 200,
    });
  } catch (error: unknown) {
    DEBUG && console.error('Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to update user profile',
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
