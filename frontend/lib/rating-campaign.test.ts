import { expect, test } from 'bun:test';
import {
  campaignDays,
  formatCampaignDay,
  goalPercent,
  progressToast,
  raffleRule,
  ticketStatus,
  weekdayLabel,
} from '@/lib/rating-campaign';
import type { RatingCampaign } from '@/types';

const campaign: RatingCampaign = {
  startsOn: '2026-11-11',
  endsOn: '2026-11-14',
  today: '2026-11-12',
  prize: 'any Amazon item up to $100',
  goal: 500,
  ratingsPerTicket: 1,
  user: null,
};

test('dates read as campus days, short campaigns list their days, and the goal bar never overflows', () => {
  expect(formatCampaignDay('2026-11-14')).toBe('Nov 14');
  expect(weekdayLabel('2026-11-11')).toBe('Wed');
  expect(campaignDays(campaign)).toEqual(['2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14']);
  expect(campaignDays({ startsOn: '2026-10-31', endsOn: '2026-11-01' })).toEqual([
    '2026-10-31',
    '2026-11-01',
  ]);
  expect(campaignDays({ ...campaign, endsOn: null })).toBeNull();
  expect(campaignDays({ ...campaign, endsOn: '2026-12-01' })).toBeNull();
  expect(goalPercent(249, 500)).toBe(49);
  expect(goalPercent(900, 500)).toBe(100);
});

test('the rule names the daily target, the last day and the prize', () => {
  expect(raffleRule(campaign)).toBe(
    'Rate a dish each day through Nov 14 for a raffle ticket to win any Amazon item up to $100.'
  );
  expect(raffleRule({ ...campaign, ratingsPerTicket: 3, endsOn: null })).toBe(
    'Rate 3 dishes each day for a raffle ticket to win any Amazon item up to $100.'
  );
  expect(raffleRule({ ...campaign, prize: '' })).toBeNull();
});

test("the status counts tickets and says what today's needs", () => {
  const withUser = (
    ticketDays: string[],
    ratedToday: number,
    extra: Partial<RatingCampaign> = {}
  ) => ticketStatus({ ...campaign, ...extra, user: { ticketDays, ratedToday } });

  expect(ticketStatus(campaign)).toBeNull();
  expect(withUser([], 0)).toBe('Rate one today for your first ticket');
  expect(withUser(['2026-11-11'], 0)).toBe('1 ticket · rate one today for another');
  expect(withUser(['2026-11-11', '2026-11-12'], 2)).toBe(
    "2 tickets · today's is in, come back tomorrow for another"
  );
  expect(withUser(['2026-11-14'], 1, { today: '2026-11-14' })).toBe(
    "1 ticket · today's is in, that was the last day"
  );
  expect(withUser([], 1, { ratingsPerTicket: 3 })).toBe('Rate 2 more today for your first ticket');
  expect(withUser([], 0, { ratingsPerTicket: 3 })).toBe('Rate 3 today for your first ticket');
});

test('a toast marks each new ticket, and progress when a ticket takes several ratings', () => {
  expect(
    progressToast(campaign, { tickets: 1, ratedToday: 0 }, { tickets: 2, ratedToday: 1 })
  ).toBe("Today's raffle ticket is in! You have 2 tickets.");
  // A second rating on a day that already has its ticket, a refresh, a vote taken back.
  expect(
    progressToast(campaign, { tickets: 2, ratedToday: 1 }, { tickets: 2, ratedToday: 2 })
  ).toBeNull();
  expect(
    progressToast(campaign, { tickets: 2, ratedToday: 1 }, { tickets: 2, ratedToday: 1 })
  ).toBeNull();
  expect(
    progressToast(campaign, { tickets: 2, ratedToday: 1 }, { tickets: 1, ratedToday: 0 })
  ).toBeNull();

  const three = { ...campaign, ratingsPerTicket: 3 };
  expect(progressToast(three, { tickets: 0, ratedToday: 0 }, { tickets: 0, ratedToday: 1 })).toBe(
    "1 of 3 rated today. 2 more for today's ticket."
  );
  expect(
    progressToast(
      { ...campaign, prize: '' },
      { tickets: 0, ratedToday: 0 },
      { tickets: 1, ratedToday: 1 }
    )
  ).toBeNull();
});
