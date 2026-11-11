import type { RatingCampaign } from '@/types';

// Longer campaigns skip the row of days; it would not fit on a phone.
const MAX_DAYS_SHOWN = 10;

/** "Nov 14" for a YYYY-MM-DD date, read at midday so no timezone can move it to another day. */
export function formatCampaignDay(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/** "Wed" for a YYYY-MM-DD date. */
export function weekdayLabel(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' });
}

/** "1,240" */
export function formatCount(count: number): string {
  return count.toLocaleString('en-US');
}

/** How far the campus is toward the goal, as a whole percentage capped at 100. */
export function goalPercent(totalRatings: number, goal: number): number {
  return Math.min(100, Math.floor((totalRatings / goal) * 100));
}

/** Every day of a short campaign as YYYY-MM-DD, or null when it is open-ended or long. */
export function campaignDays(campaign: Pick<RatingCampaign, 'startsOn' | 'endsOn'>) {
  if (!campaign.endsOn) return null;
  const days: string[] = [];
  const day = new Date(`${campaign.startsOn}T12:00:00Z`);
  const last = new Date(`${campaign.endsOn}T12:00:00Z`);
  while (day <= last && days.length <= MAX_DAYS_SHOWN) {
    days.push(day.toISOString().slice(0, 10));
    day.setUTCDate(day.getUTCDate() + 1);
  }
  return days.length <= MAX_DAYS_SHOWN ? days : null;
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;
const dishesPhrase = (count: number) => (count === 1 ? 'a dish' : `${count} dishes`);

/** "Rate a dish each day through Nov 14 for a raffle ticket to win …", or null without a prize. */
export function raffleRule(campaign: RatingCampaign): string | null {
  if (!campaign.prize) return null;
  const through = campaign.endsOn ? ` through ${formatCampaignDay(campaign.endsOn)}` : '';
  return `Rate ${dishesPhrase(campaign.ratingsPerTicket)} each day${through} for a raffle ticket to win ${campaign.prize}.`;
}

/** The logged-in student's standing: "2 tickets · today's is in", or what today's ticket needs. */
export function ticketStatus(campaign: RatingCampaign): string | null {
  const { user, ratingsPerTicket, today, endsOn } = campaign;
  if (!campaign.prize || !user) return null;
  const tickets = user.ticketDays.length;

  if (user.ticketDays.includes(today)) {
    const next = endsOn === today ? 'that was the last day' : 'come back tomorrow for another';
    return `${plural(tickets, 'ticket')} · today's is in, ${next}`;
  }
  const remaining = ratingsPerTicket - user.ratedToday;
  const toRate =
    user.ratedToday > 0 ? `${remaining} more` : ratingsPerTicket === 1 ? 'one' : `${remaining}`;
  if (tickets === 0) return `Rate ${toRate} today for your first ticket`;
  return `${plural(tickets, 'ticket')} · rate ${toRate} today for another`;
}

export interface RaffleSnapshot {
  tickets: number;
  ratedToday: number;
}

/**
 * What to tell the student after a vote moved them from `before` to `after`: a new ticket, or
 * progress toward today's when it takes several ratings. Null when there is no prize or nothing
 * changed worth mentioning.
 */
export function progressToast(
  campaign: Pick<RatingCampaign, 'prize' | 'ratingsPerTicket'>,
  before: RaffleSnapshot,
  after: RaffleSnapshot
): string | null {
  if (!campaign.prize) return null;
  if (after.tickets > before.tickets) {
    return `Today's raffle ticket is in! You have ${plural(after.tickets, 'ticket')}.`;
  }
  const remaining = campaign.ratingsPerTicket - after.ratedToday;
  if (after.ratedToday > before.ratedToday && remaining > 0) {
    return `${after.ratedToday} of ${campaign.ratingsPerTicket} rated today. ${remaining} more for today's ticket.`;
  }
  return null;
}
