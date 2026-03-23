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
import AuthStorageCleanup from '@/components/auth-storage-cleanup';
import { hoagie } from '@/app/hoagie';

import '@/app/globals.css';
import '@/lib/hoagie-ui/Theme/theme.css';

import { Poppins } from 'next/font/google';

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

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
async function Content({ children }: { children: ReactNode }): Promise<React.JSX.Element> {
  const session = await getSession();
  const user = session?.user;

  const tabs = [
    { title: 'Menu', href: '/menu' },
    // { title: 'Profile', href: '/profile' },
  ];

  return (
    <Theme palette='green'>
      <Layout>
        <Nav name='meal' tabs={tabs} user={user} />
        <div className='min-h-screen w-full'>{children}</div>
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
export default function RootLayout({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <html
      lang='en'
      className={`bg-hoagiemeal-dark-green ${poppins.className}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(${hoagie.toString()})();`,
          }}
        />
        {/* Preload interaction icons */}
        <link rel='preload' href='/images/icons/like.svg' as='image' type='image/svg+xml' />
        <link rel='preload' href='/images/icons/like-solid.svg' as='image' type='image/svg+xml' />
        <link rel='preload' href='/images/icons/dislike.svg' as='image' type='image/svg+xml' />
        <link rel='preload' href='/images/icons/dislike-solid.svg' as='image' type='image/svg+xml' />
        <link rel='preload' href='/images/icons/heart.svg' as='image' type='image/svg+xml' />
        <link rel='preload' href='/images/icons/heart-solid.svg' as='image' type='image/svg+xml' />
        {/* Preload dining hall banners */}
        <link rel='preload' href='/images/banners/forbesbanner.png' as='image' type='image/png' />
        <link rel='preload' href='/images/banners/rockybanner.png' as='image' type='image/png' />
        <link rel='preload' href='/images/banners/whitmanbutlerbanner.png' as='image' type='image/png' />
        <link rel='preload' href='/images/banners/yehbanner.png' as='image' type='image/png' />
        <link rel='preload' href='/images/banners/cjl-banner.png' as='image' type='image/png' />
        <link rel='preload' href='/images/banners/gradbanner.png' as='image' type='image/png' />
        <link rel='preload' href='/images/banners/Chemistry-CaFe.png' as='image' type='image/png' />
        <link rel='preload' href='/images/banners/EQuad-Cafe.png' as='image' type='image/png' />
        <link rel='preload' href='/images/banners/Frist-Pic.png' as='image' type='image/png' />
        <link rel='preload' href='/images/banners/Genomics-Cafe.png' as='image' type='image/png' />
        <link rel='preload' href='/images/banners/Shultz-Cafe.png' as='image' type='image/png' />
        {/* Preload allergen icons */}
        <link rel='preload' href='/images/icons/peanut.svg' as='image' type='image/svg+xml' />
        <link rel='preload' href='/images/icons/coconut.svg' as='image' type='image/svg+xml' />
        <link rel='preload' href='/images/icons/egg.svg' as='image' type='image/svg+xml' />
        <link rel='preload' href='/images/icons/milk.svg' as='image' type='image/svg+xml' />
        <link rel='preload' href='/images/icons/wheat.svg' as='image' type='image/svg+xml' />
        <link rel='preload' href='/images/icons/soybean.svg' as='image' type='image/svg+xml' />
        <link rel='preload' href='/images/icons/shellfish.svg' as='image' type='image/svg+xml' />
        <link rel='preload' href='/images/icons/alcohol.svg' as='image' type='image/svg+xml' />
        <link rel='preload' href='/images/icons/fish.svg' as='image' type='image/svg+xml' />
        <link rel='preload' href='/images/icons/sesame.svg' as='image' type='image/svg+xml' />
        <link rel='preload' href='/images/icons/gluten.svg' as='image' type='image/svg+xml' />
      </head>
      <UserProvider>
        <body className='antialiased' suppressHydrationWarning>
          <AuthStorageCleanup />
          <Content>{children}</Content>
          <Analytics />
          <SpeedInsights />
        </body>
      </UserProvider>
    </html>
  );
}
