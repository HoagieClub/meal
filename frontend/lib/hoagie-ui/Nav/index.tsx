/**
 * @overview Navigation bar for the template app with a stateful profile.
 *
 * Copyright © 2021-2025 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree or at https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

'use client';

import { ComponentType, useState, useEffect } from 'react'; // IMPORTED useState, useEffect
import {
  majorScale,
  Pane,
  Text,
  Position,
  Popover,
  Avatar,
  TabNavigation,
  Tab,
  useTheme,
  IconButton,
  MenuIcon,
  Menu,
} from 'evergreen-ui';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import ProfileCard from '@/lib/hoagie-ui/ProfileCard';
import { UserProfile } from '@auth0/nextjs-auth0/client';

// A simple hook to check if the screen is mobile-sized.
// This helps us make the layout responsive.
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);
      if (media.matches !== matches) {
        setMatches(media.matches);
      }
      const listener = () => setMatches(media.matches);
      // Listen for changes in the screen size
      media.addEventListener('change', listener);
      // Clean up the listener when the component unmounts
      return () => media.removeEventListener('change', listener);
    }
  }, [matches, query]);

  return matches;
}

export type Nav = {
  // The name of the app for generating the `hoagie{name}` title.
  name: string;

  // A custom component to be used in place of the hoagie logo.
  LogoComponent?: ComponentType;

  // A custom component to be used in place of the header color strip.
  HeaderComponent?: ComponentType;

  // A list of tab objects for the navbar, each with `title` and `href` fields.
  tabs?: Array<any>;

  // Authenticated user data.
  user?: UserProfile;

  // A flag to show the "beta" development disclaimer on the hoagie app logo.
  beta?: boolean;
};

/**
 * Nav is a navbar meant for internal navigations throughout
 * different Hoagie applications.
 */
function Nav({ name, LogoComponent, HeaderComponent, tabs = [], user, beta = true }: Nav) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const username = user?.name;

  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <Pane elevation={1}>
      {HeaderComponent ? (
        <HeaderComponent />
      ) : (
        <Pane width='100%' height={20} background={theme.title} />
      )}
      <Pane
        display='flex'
        justifyContent='center'
        width='100%'
        height={majorScale(9)}
        background='white'
      >
        <Pane
          display='flex'
          alignItems='center'
          justifyContent='space-between'
          width='100%'
          height='100%'
          maxWidth={1200}
          paddingX={isMobile ? majorScale(2) : majorScale(5)}
        >
          <Link href='/'>
            <Pane cursor='pointer' position='relative'>
              {LogoComponent ? (
                <LogoComponent />
              ) : (
                <Pane>
                  <Text
                    is='h2'
                    display='inline-block'
                    className='hoagie logo'
                    color={theme.colors.gray900}
                    fontSize={isMobile ? '1.25rem' : '1.5rem'}
                    lineHeight={1}
                  >
                    hoagie
                  </Text>
                  <Text
                    is='h2'
                    display='inline-block'
                    className='hoagie logo'
                    color={theme.title}
                    fontSize={isMobile ? '1.25rem' : '1.5rem'}
                    lineHeight={1}
                  >
                    {name}
                  </Text>
                  {beta && (
                    <Text className='hoagie beta' position='absolute' color={theme.colors.green900}>
                      BETA
                    </Text>
                  )}
                </Pane>
              )}
            </Pane>
          </Link>
          <Pane display='flex' alignItems='center' gap={majorScale(2)}>
            {/* --- Conditional mobile menu --- */}
            {isMobile ? (
              <Popover
                position={Position.BOTTOM_RIGHT}
                content={
                  <Menu>
                    <Menu.Group>
                      {tabs.map((tab) => (
                        <Menu.Item
                          key={tab.title}
                          onSelect={() => router.push(tab.href)}
                          // isSelected={pathname === tab.href}
                        >
                          {tab.title}
                        </Menu.Item>
                      ))}
                      {!user && (
                        <Menu.Item onSelect={() => router.push('/login')}>
                          Login
                        </Menu.Item>
                      )}
                    </Menu.Group>
                  </Menu>
                }
              >
                <IconButton icon={MenuIcon} appearance='minimal' height={majorScale(4)} />
              </Popover>
            ) : (
              <TabNavigation>
                {tabs.map((tab) => (
                  <Tab
                    key={tab.title}
                    id={tab.title}
                    isSelected={pathname === tab.href}
                    appearance='primary'
                    onSelect={() => router.push(tab.href)}
                    fontSize={14}
                  >
                    {tab.title}
                  </Tab>
                ))}
                {!user && (
                  <Tab
                    id='Login'
                    isSelected={false}
                    appearance='primary'
                    onSelect={() => router.push('/login')}
                    fontSize={14}
                  >
                    Login
                  </Tab>
                )}
              </TabNavigation>
            )}

            {user && (
              <Popover content={<ProfileCard user={user} />} position={Position.BOTTOM}>
                <Avatar
                  name={username}
                  style={{ cursor: 'pointer' }}
                  color={theme.title}
                  size={40}
                />
              </Popover>
            )}
          </Pane>
        </Pane>
      </Pane>
    </Pane>
  );
}

export default Nav;
