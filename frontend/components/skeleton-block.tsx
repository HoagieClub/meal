/**
 * @overview Skeleton block component.
 *
 * Copyright © 2021-2025 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree or at https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

import { DefaultTheme, Pane } from 'evergreen-ui';

/**
 * Skeleton block component props.
 *
 * @param width - The width of the skeleton block.
 * @param height - The height of the skeleton block.
 * @param theme - The theme of the skeleton block.
 * @param props - The props of the skeleton block.
 * @returns The skeleton block component.
 */
interface SkeletonBlockProps {
  width: string | number;
  height: string | number;
  theme: DefaultTheme;
  [key: string]: any;
}

/**
 * Skeleton block component.
 *
 * @param props - The props of the skeleton block.
 * @returns The skeleton block component.
 */
export default function SkeletonBlock({ width, height, theme, ...props }: SkeletonBlockProps) {
  return (
    <Pane
      width={width}
      height={height}
      background={theme.colors.gray200}
      borderRadius={4}
      className='animate-pulse'
      {...props}
    />
  );
}
