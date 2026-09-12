import type { MenuData } from '@/types';

/** The fields a like, dislike or star changes on a user's interaction with an item. */
export type InteractionPatch = { liked?: boolean | null; favorited?: boolean };

/** Menu data with one item's interaction changed and its like counts adjusted to match. */
export function applyInteraction(
  data: MenuData,
  menuItemId: string,
  patch: InteractionPatch
): MenuData {
  const before = data.interactions[menuItemId] ?? {};
  const metrics = data.metrics[menuItemId] ?? { likeCount: 0, dislikeCount: 0 };
  let { likeCount, dislikeCount } = metrics;

  const previousVote = before.liked ?? null;
  if (patch.liked !== undefined && patch.liked !== previousVote) {
    if (previousVote === true) likeCount -= 1;
    if (previousVote === false) dislikeCount -= 1;
    if (patch.liked === true) likeCount += 1;
    if (patch.liked === false) dislikeCount += 1;
  }

  return {
    ...data,
    interactions: { ...data.interactions, [menuItemId]: { ...before, ...patch } },
    metrics: { ...data.metrics, [menuItemId]: { ...metrics, likeCount, dislikeCount } },
  };
}
