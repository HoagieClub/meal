'use client';

import { useState } from 'react';
import NutritionFacts from '@/components/dining-hall-card/nutrition-facts';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useMenuItemInteractions } from '@/hooks/use-menu-item-interactions';
import { ALLERGEN_ICON_MAP } from '@/lib/constants';
import { detectAllergens } from '@/lib/utils';
import type { DisplayMenuItem } from '@/types';

/** One menu item: name, allergen icons, star and vote buttons, and an expandable nutrition panel. */
export default function MenuItemRow({
  item,
  diningHallName,
}: {
  item: DisplayMenuItem;
  diningHallName: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const interactions = useMenuItemInteractions(item.id, item.userInteraction, item.metrics);
  const accordionValue = `${diningHallName}-${item.id}`;
  const allergens = detectAllergens(item.nutrition);

  return (
    <Accordion
      type='single'
      collapsible
      value={expanded ? accordionValue : ''}
      onValueChange={(value) => setExpanded(!!value)}
      className='border-none'
    >
      <AccordionItem value={accordionValue} className='border-none' data-item-id={item.id}>
        <div className='mx-2 flex items-start gap-1'>
          {/* Tapping the name opens the panel; the chevron is the keyboard-accessible trigger. */}
          <div
            className='min-w-0 flex-1 cursor-pointer py-2 text-[14px] leading-tight text-black'
            onClick={() => setExpanded(!expanded)}
          >
            <span>{item.name}</span>
            {/* The icons move to the next line as a group rather than breaking mid-list. */}
            {allergens.length > 0 && (
              <>
                {' '}
                <span className='inline-flex items-center gap-1 align-middle'>
                  {allergens.map((allergen) => (
                    <img
                      key={allergen}
                      src={ALLERGEN_ICON_MAP[allergen]}
                      alt={allergen}
                      title={allergen}
                      width={14}
                      height={14}
                    />
                  ))}
                </span>
              </>
            )}
          </div>
          {/* Every row has these buttons, so their names carry the item to tell them apart. */}
          <div className='flex items-center pt-1'>
            <StarButton
              name={item.name}
              starred={interactions.favorited}
              onToggle={interactions.handleFavorite}
            />
            <LikeDislikeButtons
              name={item.name}
              userLiked={interactions.userLiked}
              likeCount={interactions.likeCount}
              dislikeCount={interactions.dislikeCount}
              onLike={interactions.handleLike}
              onDislike={interactions.handleDislike}
            />
            <AccordionTrigger
              aria-label={`${expanded ? 'Hide' : 'Show'} nutrition facts for ${item.name}`}
              className='h-7 w-7 flex-none cursor-pointer justify-center p-0 hover:no-underline [&>svg]:h-4 [&>svg]:w-4'
            />
          </div>
        </div>
        <AccordionContent>
          <NutritionFacts nutrition={item.nutrition} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

/** Two stacked icons that crossfade between an outline and a filled state. */
function IconSwap({
  outline,
  filled,
  active,
  size,
}: {
  outline: string;
  filled: string;
  active: boolean;
  size: number;
}) {
  return (
    <span className='relative block' style={{ width: size, height: size }}>
      <img
        src={outline}
        alt=''
        width={size}
        height={size}
        style={{ position: 'absolute', opacity: active ? 0 : 1, transition: 'opacity 0.2s' }}
      />
      <img
        src={filled}
        alt=''
        width={size}
        height={size}
        style={{ opacity: active ? 1 : 0, transition: 'opacity 0.2s' }}
      />
    </span>
  );
}

function StarButton({
  name,
  starred,
  onToggle,
}: {
  name: string;
  starred: boolean;
  onToggle: () => void;
}) {
  const label = `${starred ? 'Unstar' : 'Star'} ${name}`;
  return (
    <button
      type='button'
      onClick={onToggle}
      aria-pressed={starred}
      aria-label={label}
      title={label}
      className='flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-all duration-150 hover:opacity-70 active:scale-90'
    >
      <IconSwap
        outline='/images/icons/star.svg'
        filled='/images/icons/star-filled.svg'
        active={starred}
        size={14}
      />
    </button>
  );
}

/** Like and dislike buttons in one pill. Counts appear once somebody has voted. */
function LikeDislikeButtons({
  name,
  userLiked,
  likeCount,
  dislikeCount,
  onLike,
  onDislike,
}: {
  name: string;
  userLiked: boolean | null;
  likeCount: number;
  dislikeCount: number;
  onLike: () => void;
  onDislike: () => void;
}) {
  return (
    <div className='mr-0.5 flex items-center overflow-hidden rounded-full'>
      <VoteButton
        label={`Like ${name}`}
        icon='like'
        active={userLiked === true}
        count={likeCount}
        className={userLiked === true ? 'bg-green-50' : 'hover:bg-green-50'}
        onClick={onLike}
      />
      <div className='h-4 w-px bg-gray-400' />
      <VoteButton
        label={`Dislike ${name}`}
        icon='dislike'
        active={userLiked === false}
        count={dislikeCount}
        className={userLiked === false ? 'bg-red-50' : 'hover:bg-red-50'}
        onClick={onDislike}
      />
    </div>
  );
}

function VoteButton({
  label,
  icon,
  active,
  count,
  className,
  onClick,
}: {
  label: string;
  icon: 'like' | 'dislike';
  active: boolean;
  count: number;
  className: string;
  onClick: () => void;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={`flex h-7 min-w-7 cursor-pointer items-center justify-center gap-1 px-1.5 transition-colors duration-200 ${className}`}
    >
      <IconSwap
        outline={`/images/icons/${icon}.svg`}
        filled={`/images/icons/${icon}-solid.svg`}
        active={active}
        size={12}
      />
      {count > 0 && <span className='text-xs font-medium text-gray-800'>{count}</span>}
    </button>
  );
}
