/**
 * @overview Skeleton loading placeholder for dining hall cards.
 *
 * Copyright © 2021-2025 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree or at
 *
 *    https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

import { Pane, majorScale, minorScale, useTheme } from 'evergreen-ui';
import SkeletonBlock from '@/components/skeleton-block';

/**
 * Dining hall card skeleton component.
 *
 * @returns The dining hall card skeleton component.
 */
export default function SkeletonDiningHallCard() {
  const theme = useTheme();
  return (
    <Pane
      background='white'
      borderRadius={12}
      padding={majorScale(2)}
      display='flex'
      flexDirection='column'
      gap={majorScale(2)}
    >
      <SkeletonBlock width='70%' height={24} theme={theme} />
      <Pane display='flex' gap={minorScale(1)}>
        <SkeletonBlock width={24} height={24} borderRadius={999} theme={theme} />
        <SkeletonBlock width={24} height={24} borderRadius={999} theme={theme} />
        <SkeletonBlock width={24} height={24} borderRadius={999} theme={theme} />
      </Pane>
      <Pane>
        <SkeletonBlock width='50%' height={18} theme={theme} marginBottom={majorScale(1)} />
        <SkeletonBlock width='90%' height={14} theme={theme} marginBottom={minorScale(1)} />
        <SkeletonBlock width='80%' height={14} theme={theme} marginBottom={minorScale(1)} />
      </Pane>
      <Pane>
        <SkeletonBlock width='60%' height={18} theme={theme} marginBottom={majorScale(1)} />
        <SkeletonBlock width='85%' height={14} theme={theme} marginBottom={minorScale(1)} />
      </Pane>
      <Pane>
        <SkeletonBlock width='50%' height={18} theme={theme} marginBottom={majorScale(1)} />
        <SkeletonBlock width='90%' height={14} theme={theme} marginBottom={minorScale(1)} />
        <SkeletonBlock width='80%' height={14} theme={theme} marginBottom={minorScale(1)} />
      </Pane>
      <Pane>
        <SkeletonBlock width='60%' height={18} theme={theme} marginBottom={majorScale(1)} />
        <SkeletonBlock width='85%' height={14} theme={theme} marginBottom={minorScale(1)} />
      </Pane>
      <Pane>
        <SkeletonBlock width='50%' height={18} theme={theme} marginBottom={majorScale(1)} />
        <SkeletonBlock width='90%' height={14} theme={theme} marginBottom={minorScale(1)} />
        <SkeletonBlock width='80%' height={14} theme={theme} marginBottom={minorScale(1)} />
      </Pane>
      <Pane>
        <SkeletonBlock width='60%' height={18} theme={theme} marginBottom={majorScale(1)} />
        <SkeletonBlock width='85%' height={14} theme={theme} marginBottom={minorScale(1)} />
      </Pane>
    </Pane>
  );
}
