'use client';

import { ReactNode } from 'react';

export interface SectionTitleProps {
  children: ReactNode;
  className?: string;
}

export function SectionTitle({ children, className = '' }: SectionTitleProps) {
  return (
    <span className={`text-[10px] font-semibold text-[#898787] leading-3 ${className}`}>
      {children}
    </span>
  );
}
