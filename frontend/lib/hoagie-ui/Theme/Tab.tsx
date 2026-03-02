/**
 * @overview Tab component for the Hoagie Meal app.
 * 
 * Copyright © 2021-2025 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree or at https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

import { defaultTheme } from 'evergreen-ui';

const primarySelectors = defaultTheme.components.Tab.appearances.primary.selectors;

const Tab = {
  ...defaultTheme.components.Tab,
  appearances: {
    ...defaultTheme.components.Tab.appearances,
    primary: {
      ...defaultTheme.components.Tab.appearances.primary,
      selectors: {
        ...primarySelectors,
        _before: {
          ...primarySelectors?._before,
          backgroundColor: '#008001', // hoagiemeal-dark-green (underline)
        },
        _current: {
          ...primarySelectors?._current,
          color: '#008001', // hoagiemeal-dark-green
          '&:focus': {
            color: '#008001',
          },
        },
        _focus: {
          boxShadow: 'none',
        },
      },
    },
    navbar: {
      ...defaultTheme.components.Tab.appearances.primary,
      fontSize: '14px',
    },
  },
};

export default Tab;
