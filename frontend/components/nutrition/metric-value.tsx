/**
 * @overview Styled component for displaying metric values in nutrition info.
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

'use client';

import { ReactNode } from 'react';

export interface MetricValueProps {
  children: ReactNode;
  className?: string;
}

export function MetricValue({ children, className = '' }: MetricValueProps) {
  return (
    <span className={`text-[14px] font-semibold text-[#454545] leading-3 ${className}`}>
      {children}
    </span>
  );
}
