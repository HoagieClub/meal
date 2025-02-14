/**
 * @overview Root layout component for the Hoagie Meal app. Styles apply to all children.
 *
 * Copyright © 2021-2025 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree or at https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

import { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { getSession } from '@auth0/nextjs-auth0';

import Layout from '@/lib/hoagie-ui/Layout';
import Nav from '@/lib/hoagie-ui/Nav';
import Theme from '@/lib/hoagie-ui/Theme';
import { Toaster } from '@/components/ui/sonner';
import { hoagie } from "@/app/hoagie";

import '@/app/globals.css';
import '@/lib/hoagie-ui/Theme/theme.css';

export const metadata = {
  title: 'Meal by Hoagie',
  description: 'Slogan TBD.', // TODO: Create a catchy slogan!
};

/**
 * Content Component
 * Fetches user data (real or mock) and renders the main layout.
 *
 * @param children - The child components to render within the layout.
 * @returns JSX Element representing the content area.
 */
async function Content({ children }: { children: ReactNode }): Promise<JSX.Element> {
  const session = await getSession();
  const user = session?.user;

  const tabs = [
    { title: 'Discover', href: '/feature3' },
    { title: 'Menu', href: '/feature1' },
    { title: 'Goals', href: '/feature2' },
  ];

  return (
    <Theme palette='green'>
      <Layout>
        <Nav name='meal' tabs={tabs} user={user} />
        <div className="min-h-screen w-full">
          {children}
        </div>
        <Toaster />
      </Layout>
    </Theme>
  );
}

/**
 * RootLayout Component
 * Wraps the entire application with necessary providers and layouts.
 *
 * @param children - The child components to render within the layout.
 * @returns JSX Element representing the root HTML structure.
 */
export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <html lang='en' className="bg-hoagiemeal-dark-green">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(${hoagie.toString()})();`,
          }}
        />
      </head>
      <UserProvider>
        <body className='antialiased'>
          <Content>{children}</Content>
          <Analytics />
          <SpeedInsights />
        </body>
      </UserProvider>
    </html>
  );
}
