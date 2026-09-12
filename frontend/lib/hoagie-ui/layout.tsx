'use client';

import type { ReactNode } from 'react';
import { Pane } from 'evergreen-ui';
import Footer from '@/lib/hoagie-ui/footer';

/** Full-height page shell with the footer pinned to the bottom. */
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <Pane display='flex' flexDirection='column' minHeight='100vh'>
      <Pane flex='1'>{children}</Pane>
      <Footer />
    </Pane>
  );
}
