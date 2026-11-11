'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useQuery } from '@tanstack/react-query';
import { getEngagementStats } from '@/lib/endpoints';

/** First element of the stats query key, so a vote can refresh it for whoever is logged in. */
export const ENGAGEMENT_STATS_KEY = 'engagement-stats';
// Re-checked this often while the page is open, so the campus count visibly climbs.
const REFRESH_MS = 60 * 1000;

/** The campus-wide rating count and any running rating campaign, with the user's progress. */
export function useEngagementStats() {
  const { user, isLoading } = useUser();
  return useQuery({
    queryKey: [ENGAGEMENT_STATS_KEY, user?.sub ?? 'anonymous'],
    queryFn: getEngagementStats,
    // Waiting for the login check means the first answer already includes the user's progress.
    enabled: !isLoading,
    staleTime: REFRESH_MS / 2,
    refetchInterval: REFRESH_MS,
  });
}
