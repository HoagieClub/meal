import { handleAuth, handleCallback, handleLogin, type Session } from '@auth0/nextjs-auth0';
import type { NextRequest } from 'next/server';

const API_URL = process.env.HOAGIE_API_URL;

// After Auth0 login, tell the backend so it can create the user's record straight away. The
// backend also creates it on the first authenticated request, so a failure here only gets
// logged; the login itself must still succeed.
const afterCallback = async (_req: NextRequest, session: Session) => {
  if (!session.accessToken) return session;
  try {
    const res = await fetch(`${API_URL}/api/user/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({}),
    });
    if (!res.ok) console.error('User verification failed:', res.status, res.statusText);
  } catch (error) {
    console.error('Error verifying user:', error);
  }
  return session;
};

// Serves /api/auth/login, /api/auth/logout, /api/auth/callback and /api/auth/me.
export const GET = handleAuth({
  login: handleLogin({ returnTo: '/' }),
  callback: handleCallback({ afterCallback }),
});
