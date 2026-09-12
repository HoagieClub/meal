'use client';

import type { UserProfile } from '@auth0/nextjs-auth0/client';
import {
  Avatar,
  majorScale,
  Pane,
  Popover,
  Position,
  Tab,
  TabNavigation,
  useTheme,
} from 'evergreen-ui';
import Link from 'next/link';
import { useMediaQuery } from '@/hooks/use-media-query';
import ProfileCard from '@/lib/hoagie-ui/profile-card';

interface NavProps {
  /** App name, rendered as "hoagie{name}". */
  name: string;
  user?: UserProfile;
}

const login = () => {
  window.location.href = '/api/auth/login';
};

/** Hoagie navbar: the logo, and either a login link or the user's profile menu. */
export default function Nav({ name, user }: NavProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const logoSize = isMobile ? '1.25rem' : '1.5rem';

  return (
    <Pane elevation={1}>
      <Pane width='100%' height={20} background={theme.title} />
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
            <h2
              className='leading-none font-semibold'
              style={{ fontSize: logoSize, color: theme.colors.gray900 }}
            >
              hoagie
              <span style={{ color: theme.title }}>{name}</span>
            </h2>
          </Link>

          <Pane display='flex' alignItems='center' gap={majorScale(2)}>
            {user ? (
              <Popover content={<ProfileCard user={user} />} position={Position.BOTTOM}>
                <button type='button' aria-label='Account menu' className='rounded-full'>
                  <Avatar
                    name={user.name}
                    style={{ cursor: 'pointer' }}
                    color={theme.title}
                    size={40}
                  />
                </button>
              </Popover>
            ) : (
              <TabNavigation>
                <Tab
                  id='Login'
                  isSelected={false}
                  appearance='primary'
                  onSelect={login}
                  fontSize={14}
                >
                  Login
                </Tab>
              </TabNavigation>
            )}
          </Pane>
        </Pane>
      </Pane>
    </Pane>
  );
}
