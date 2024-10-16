/**
 * @overview Theme component for the Hoagie Meal app.
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

import { ThemeProvider } from 'evergreen-ui';
import { ReactNode } from 'react';
import { hoagieGreen, hoagieUI } from './themes';

type ThemeProps = {
  // Options: "green"
  palette?: string;

  // React children (child components)
  children?: ReactNode;
};

/**
 * Returns a Hoagie theme based on the provided palette.
 * 
 * @returns {ThemeProvider} A Hoagie-paletted theme provider component.
 */
function Theme({ palette = 'green', children }: ThemeProps) {
  const colorTheme = (() => {
    switch (palette) {
      case 'green':
        return hoagieGreen;
      default:
        return hoagieUI;
    }
  })();

  return <ThemeProvider value={colorTheme}>{children}</ThemeProvider>;
}

export default Theme;