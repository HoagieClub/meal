import type { ReactNode } from 'react';
import { Poppins } from 'next/font/google';
import { getSession } from '@auth0/nextjs-auth0';
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Providers from '@/components/providers';
import Layout from '@/lib/hoagie-ui/layout';
import Nav from '@/lib/hoagie-ui/nav';
import Theme from '@/lib/hoagie-ui/theme';
import '@/app/globals.css';

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

export const metadata = {
  title: 'Meal by Hoagie',
  description:
    "Today's menus at every Princeton dining hall and cafe, with nutrition facts and allergens.",
};

// Console easter egg, plus removal of the service worker an earlier release installed. That
// worker cached API responses, which is one way users ended up seeing stale menus.
const HEAD_SCRIPT = `
console.log("\\n    █░█ █▀█ ▄▀█ █▀▀ █ █▀▀  █▄█ █▀▀ ▄▀█ █░░\\n    █▀█ █▄█ █▀█ █▄█ █ ██▄  █░█ ██▄ █▀█ █▄▄\\n  ");
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    registrations.forEach(function (registration) { registration.unregister(); });
  });
}
if (window.caches) { caches.keys().then(function (keys) { keys.forEach(function (key) { caches.delete(key); }); }); }
`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Read the session once on the server and hand it to the browser, so the client never has to
  // ask who is logged in before it can fetch menus.
  const session = await getSession();
  return (
    <html
      lang='en'
      className={`bg-hoagiemeal-dark-green ${poppins.variable} ${poppins.className}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: HEAD_SCRIPT }} />
      </head>
      <UserProvider user={session?.user}>
        <body className='antialiased' suppressHydrationWarning>
          <Providers>
            <Theme>
              <Layout>
                <Nav name='meal' user={session?.user} />
                <div className='flex w-full flex-1 flex-col'>{children}</div>
              </Layout>
            </Theme>
          </Providers>
          <Analytics />
          <SpeedInsights />
        </body>
      </UserProvider>
    </html>
  );
}
