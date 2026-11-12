'use client';

import { useEffect, useRef, useState } from 'react';
import { CrossIcon } from 'evergreen-ui';
import { useEngagementStats } from '@/hooks/use-engagement-stats';
import { useLocalStorage } from '@/hooks/use-local-storage';
import {
  campaignDays,
  formatCount,
  goalPercent,
  progressToast,
  raffleRule,
  ticketStatus,
  weekdayLabel,
  type RaffleSnapshot,
} from '@/lib/rating-campaign';
import type { RatingCampaign } from '@/types';

// Longer than any campaign, so a dismissed banner stays dismissed until the next one.
const DISMISS_FOR_MS = 90 * 24 * 60 * 60 * 1000;
const TOAST_MS = 4000;

/**
 * While a rating campaign runs: how many ratings students have made, progress toward the goal,
 * how the raffle works and the visitor's tickets. Hidden otherwise, or once dismissed.
 */
export function RatingCampaignBanner() {
  const { data } = useEngagementStats();
  // Remembers which campaign was dismissed (by its start date), so the next one shows again.
  const [dismissedCampaign, setDismissedCampaign] = useLocalStorage<string | null>({
    key: 'rating-campaign-dismissed',
    initialValue: null,
    expiryInMs: DISMISS_FOR_MS,
  });

  const campaign = data?.campaign;
  if (!data || !campaign || dismissedCampaign === campaign.startsOn) return null;
  return (
    <RatingCampaignBannerContent
      totalRatings={data.totalRatings}
      campaign={campaign}
      onDismiss={() => setDismissedCampaign(campaign.startsOn)}
    />
  );
}

export function RatingCampaignBannerContent({
  totalRatings,
  campaign,
  onDismiss,
}: {
  totalRatings: number;
  campaign: RatingCampaign;
  onDismiss: () => void;
}) {
  const rule = raffleRule(campaign);
  const status = ticketStatus(campaign);
  const days = campaignDays(campaign);

  return (
    <section
      aria-label='Rating raffle'
      className='relative mt-2 mb-4 rounded-[15px] border border-green-700/20 bg-green-50 py-3 pr-10 pl-4 text-green-900 shadow-[0_2px_8px_rgba(0,0,0,0.05)]'
    >
      <button
        type='button'
        aria-label='Dismiss'
        onClick={onDismiss}
        className='absolute top-2 right-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-green-800 hover:bg-green-100'
      >
        <CrossIcon size={14} />
      </button>

      {campaign.testRun && (
        <span className='mb-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-amber-900 uppercase'>
          Test run
        </span>
      )}

      <p className='text-sm'>
        {totalRatings > 0 ? (
          <>
            {/* Keyed by the count, so it pops each time a new rating comes in. */}
            <span
              key={totalRatings}
              className='count-bump inline-block text-lg font-bold text-green-800 tabular-nums'
            >
              {formatCount(totalRatings)}
            </span>{' '}
            {totalRatings === 1 ? 'rating' : 'ratings'} from Princeton students
          </>
        ) : (
          <span className='font-semibold'>No ratings yet. Be the first!</span>
        )}
      </p>

      {campaign.goal !== null && (
        <div className='mt-2 flex items-center gap-3'>
          <div
            role='progressbar'
            aria-label='Ratings toward the goal'
            aria-valuemin={0}
            aria-valuemax={campaign.goal}
            aria-valuenow={Math.min(totalRatings, campaign.goal)}
            className='h-2 flex-1 overflow-hidden rounded-full bg-green-700/15'
          >
            <div
              className='h-full rounded-full bg-green-700 transition-[width] duration-500 ease-out'
              style={{ width: `${goalPercent(totalRatings, campaign.goal)}%` }}
            />
          </div>
          <span className='text-xs whitespace-nowrap text-green-800 tabular-nums'>
            {totalRatings >= campaign.goal ? 'Goal reached!' : `Goal ${formatCount(campaign.goal)}`}
          </span>
        </div>
      )}

      {rule && <p className='mt-2 text-sm'>{rule}</p>}
      {campaign.testRun && (
        <p className='mt-1 text-xs text-green-900/70'>
          We&apos;re trying this out ahead of the official launch, so details may change.
        </p>
      )}

      {rule && (
        <div className='mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5'>
          {campaign.user === null ? (
            <LoginLink />
          ) : (
            <>
              {days && (
                <TicketDays
                  days={days}
                  today={campaign.today}
                  ticketDays={campaign.user.ticketDays}
                />
              )}
              {status && <span className='text-xs font-semibold text-green-800'>{status}</span>}
            </>
          )}
        </div>
      )}
    </section>
  );
}

function LoginLink() {
  const returnTo = window.location.pathname + window.location.search;
  return (
    <a
      href={`/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`}
      className='rounded-full bg-green-700 px-3 py-1 text-xs font-semibold whitespace-nowrap text-white hover:bg-green-800'
    >
      Log in to enter
    </a>
  );
}

/** One chip per campaign day: filled where a ticket was earned, outlined for today. */
function TicketDays({
  days,
  today,
  ticketDays,
}: {
  days: string[];
  today: string;
  ticketDays: string[];
}) {
  return (
    <ul aria-label='Your raffle tickets' className='flex flex-wrap gap-1'>
      {days.map((day) => {
        const earned = ticketDays.includes(day);
        const state = earned
          ? 'ticket earned'
          : day === today
            ? 'today, no ticket yet'
            : day < today
              ? 'no ticket'
              : 'still to come';
        const style = earned
          ? 'bg-green-700 text-white'
          : day === today
            ? 'border border-dashed border-green-700 text-green-800'
            : day < today
              ? 'bg-green-700/5 text-green-900/35'
              : 'bg-green-700/10 text-green-800/70';
        return (
          <li
            key={day}
            aria-label={`${weekdayLabel(day)}: ${state}`}
            title={`${weekdayLabel(day)}: ${state}`}
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${style}`}
          >
            {weekdayLabel(day)}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * A short message at the bottom of the screen when a vote earns today's raffle ticket, or moves
 * the student toward it when a ticket takes several ratings.
 */
export function RatingProgressToast() {
  const { data } = useEngagementStats();
  const campaign = data?.campaign ?? null;
  const tickets = campaign?.user?.ticketDays.length ?? null;
  const ratedToday = campaign?.user?.ratedToday ?? null;
  const prize = campaign?.prize ?? '';
  const ratingsPerTicket = campaign?.ratingsPerTicket ?? 1;

  const previous = useRef<RaffleSnapshot | null>(null);
  const [toast, setToast] = useState<{ text: string; id: number } | null>(null);

  // Compare with the last answer seen, so the first load and logging in stay quiet.
  useEffect(() => {
    const before = previous.current;
    const after = tickets === null || ratedToday === null ? null : { tickets, ratedToday };
    previous.current = after;
    if (!before || !after) return;
    const text = progressToast({ prize, ratingsPerTicket }, before, after);
    if (text) setToast({ text, id: Date.now() });
  }, [tickets, ratedToday, prize, ratingsPerTicket]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;
  return (
    <div
      key={toast.id}
      role='status'
      className='toast-enter fixed inset-x-4 bottom-4 z-[110] mx-auto w-fit max-w-full rounded-full border border-green-700/25 bg-green-50 px-4 py-2 text-center text-sm text-green-900 shadow-lg'
    >
      {toast.text}
    </div>
  );
}
