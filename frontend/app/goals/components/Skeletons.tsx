/**
 * @overview Skeletons for the Goals page.
 * @description This file contains loading state components called skeletons for the Goals page.
 *
 * Copyright © 2021-2025 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree or at https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

import { Pane, majorScale, minorScale, DefaultTheme } from 'evergreen-ui';
import SkeletonBlock from '@/components/skeleton-block';
import { Card } from 'evergreen-ui';

export const SkeletonNutrientProgressBar: React.FC<{ theme: DefaultTheme }> = ({ theme }) => (
  <Pane>
    <Pane
      display='flex'
      justifyContent='space-between'
      alignItems='center'
      marginBottom={minorScale(1)}
    >
      <SkeletonBlock width='40%' height={16} theme={theme} />
      <SkeletonBlock width='30%' height={16} theme={theme} />
    </Pane>
    <SkeletonBlock width='100%' height={6} theme={theme} borderRadius={8} />
  </Pane>
);

export const SkeletonWeeklySummary: React.FC<{ theme: DefaultTheme }> = ({ theme }) => (
  <Card
    background='white'
    borderRadius={12}
    padding={majorScale(3)}
    marginBottom={majorScale(3)}
    boxShadow='0px 4px 12px rgba(0, 0, 0, 0.05)'
  >
    <SkeletonBlock width='30%' height={24} theme={theme} marginBottom={majorScale(2)} />
    <Pane
      display='grid'
      gridTemplateColumns='repeat(auto-fit, minmax(200px, 1fr))'
      gap={majorScale(2)}
    >
      <SkeletonNutrientProgressBar theme={theme} />
      <SkeletonNutrientProgressBar theme={theme} />
      <SkeletonNutrientProgressBar theme={theme} />
      <SkeletonNutrientProgressBar theme={theme} />
    </Pane>
  </Card>
);

export const SkeletonDayPlanCard: React.FC<{ theme: DefaultTheme }> = ({ theme }) => (
  <Card
    background='white'
    borderRadius={12}
    padding={majorScale(3)}
    boxShadow='0px 4px 12px rgba(0, 0, 0, 0.05)'
  >
    <Pane
      display='flex'
      justifyContent='space-between'
      alignItems='center'
      marginBottom={majorScale(2)}
    >
      <SkeletonBlock width='40%' height={28} theme={theme} />
    </Pane>

    <Card
      background='#F8FAFC'
      border='1px solid #E2E8F0'
      padding={majorScale(2)}
      marginBottom={majorScale(3)}
      borderRadius={8}
    >
      <SkeletonBlock width='25%' height={20} theme={theme} marginBottom={majorScale(2)} />
      <Pane
        display='grid'
        gridTemplateColumns='repeat(auto-fit, minmax(150px, 1fr))'
        gap={majorScale(2)}
      >
        <SkeletonNutrientProgressBar theme={theme} />
        <SkeletonNutrientProgressBar theme={theme} />
        <SkeletonNutrientProgressBar theme={theme} />
        <SkeletonNutrientProgressBar theme={theme} />
      </Pane>
    </Card>

    <Pane
      display='grid'
      gridTemplateColumns='repeat(auto-fit, minmax(250px, 1fr))'
      gap={majorScale(2)}
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <Pane
          key={i}
          border='1px solid #E2E8F0'
          borderRadius={8}
          padding={majorScale(2)}
          display='flex'
          flexDirection='column'
          gap={majorScale(2)}
        >
          <SkeletonBlock width='30%' height={24} theme={theme} />
          <SkeletonBlock width='80%' height={20} theme={theme} />
          <SkeletonBlock width='60%' height={16} theme={theme} />
          <SkeletonBlock width='90%' height={20} theme={theme} />
          <SkeletonBlock width='50%' height={16} theme={theme} />
        </Pane>
      ))}
    </Pane>
  </Card>
);
