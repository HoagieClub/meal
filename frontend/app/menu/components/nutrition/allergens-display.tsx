'use client';

import { useRef, useState, useEffect } from 'react';
import { Tooltip } from 'evergreen-ui';
import { ALLERGEN_ICON_MAP } from '@/data';
import { Allergen } from '@/types/types';
import { SectionTitle } from './section-title';

export interface AllergensDisplayProps {
  allergens: string[];
}

export function AllergensDisplay({ allergens }: AllergensDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);

  useEffect(() => {
    const checkScrollable = () => {
      if (scrollRef.current) {
        setIsScrollable(scrollRef.current.scrollWidth > scrollRef.current.clientWidth);
      }
    };

    checkScrollable();

    const resizeObserver = new ResizeObserver(checkScrollable);
    if (scrollRef.current) {
      resizeObserver.observe(scrollRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [allergens]);
  if (!allergens || allergens.length === 0) {
    return (
      <div className="flex flex-col gap-1">
        <SectionTitle>Allergens</SectionTitle>
        <span className="text-xs text-gray-400">-</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <SectionTitle>Allergens</SectionTitle>
      <div className="relative">
        <div ref={scrollRef} className="flex items-center gap-1 overflow-x-auto no-scrollbar pr-4">
          {allergens.map((allergen) => {
            const iconPath = ALLERGEN_ICON_MAP[allergen as Allergen];
            // Render icon if available, otherwise fall back to text label
            return iconPath ? (
              <Tooltip
                key={allergen}
                content={allergen}
                appearance="card"
                statelessProps={{
                  paddingX: 6,
                  paddingY: 2,
                  fontSize: 9,
                }}
              >
                <img
                  src={iconPath}
                  alt={allergen}
                  width={18}
                  height={18}
                  className="inline-block flex-shrink-0"
                />
              </Tooltip>
            ) : (
              <Tooltip
                key={allergen}
                content={allergen}
                appearance="card"
                statelessProps={{
                  paddingX: 6,
                  paddingY: 2,
                  fontSize: 9,
                }}
              >
                <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0 whitespace-nowrap">
                  {allergen}
                </span>
              </Tooltip>
            );
          })}
        </div>
        {isScrollable && (
          <div className="absolute py-3 right-0 -top-1 bottom-0 w-4 bg-gradient-to-l rounded-r from-[#e4e4e4] to-transparent pointer-events-none" />
        )}
      </div>
    </div>
  );
}
