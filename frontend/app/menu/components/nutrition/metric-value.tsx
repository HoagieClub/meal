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
