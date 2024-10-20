/**
 * @overview Global pane layout to be used in @/app/layout.tsx
 * 
 * Copyright © 2021-2024 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree or at https://github.com/hoagieclub/template/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

'use client';

import { Pane } from 'evergreen-ui';
import { ReactNode } from 'react';
import { useTheme } from 'evergreen-ui';

function Layout({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <Pane display='flex' flexDirection='column' minHeight='100vh' background={theme.colors.green300}>
      {children}
    </Pane>
  );
}

export default Layout;
