/**
 * @overview Login page for the Hoagie Meal app.
 *
 * Copyright © 2021-2026 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree or at
 *
 *    https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Pane,
  majorScale,
  Heading,
  Paragraph,
  Spinner,
  ArrowLeftIcon,
  Button,
  useTheme,
} from 'evergreen-ui';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import AuthButton from '@/lib/hoagie-ui/AuthButton';

const PAGE_BG = '#CBE6DC';

function LoginPageContent() {
  const { user, error, isLoading } = useUser();
  const theme = useTheme();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  useEffect(() => {
    const prev = document.body.style.backgroundColor;
    document.body.style.backgroundColor = PAGE_BG;
    document.documentElement.style.setProperty('--footer-bg', PAGE_BG);
    return () => {
      document.body.style.backgroundColor = prev;
      document.documentElement.style.setProperty('--footer-bg', '');
    };
  }, []);

  let Profile;
  if (isLoading) Profile = <Spinner />;
  else if (error) Profile = <div>{error.message}</div>;
  else if (user) {
    Profile = (
      <Pane display='flex' flexDirection='column' alignItems='center' gap={majorScale(2)}>
        <Link href='/'>
          <Button
            height={56}
            width={majorScale(35)}
            appearance='primary'
            background={theme.colors.green600}
          >
            View Menus
          </Button>
        </Link>
        <AuthButton variant='logout' />
      </Pane>
    );
  } else {
    const authHref = returnTo
      ? `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`
      : undefined;
    Profile = <AuthButton href={authHref} />;
  }

  return (
    <>
      <style>{`body { background-color: ${PAGE_BG}; } :root { --footer-bg: ${PAGE_BG}; }`}</style>
      <Pane
        display='flex'
        flex='1'
        justifyContent='center'
        alignItems='center'
        background={PAGE_BG}
        paddingX={majorScale(1)}
        paddingY={majorScale(8)}
      >
        <Pane
          borderRadius={12}
          textAlign='center'
          elevation={1}
          background='white'
          marginX={20}
          maxWidth='500px'
          width='100%'
          paddingX={majorScale(5)}
          paddingTop={majorScale(9)}
          paddingBottom={majorScale(10)}
        >
          <Pane marginBottom={majorScale(3)} display='flex' justifyContent='center'>
            <Image src='/images/icons/meal-icon.svg' alt='Hoagie Meal' width={72} height={72} />
          </Pane>
          <Heading size={800} className='hoagie' marginBottom={majorScale(1)}>
            Login to get the most out of<br />hoagie<b>meal</b>.
          </Heading>
          <Pane marginBottom={majorScale(5)} />
          <Pane display='flex' flexDirection='column' alignItems='center' gap={majorScale(2)}>
            {Profile}
            <Link href='https://hoagie.io'>
              <Button
                height={56}
                width={majorScale(35)}
                appearance='minimal'
                iconBefore={ArrowLeftIcon}
              >
                <Pane display='flex'>
                  Back to
                  <Pane marginLeft={4} className='hoagie'>
                    hoagie<b>platform</b>
                  </Pane>
                </Pane>
              </Button>
            </Link>
          </Pane>
        </Pane>
      </Pane>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Pane display='flex' flex='1' justifyContent='center' alignItems='center' height='100vh'>
          <Spinner />
        </Pane>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
