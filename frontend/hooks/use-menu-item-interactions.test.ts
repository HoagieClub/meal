import { expect, test } from 'bun:test';
import { applyInteraction, showsVoteCounts } from '@/lib/interactions';
import type { MenuData } from '@/types';

const data: MenuData = {
  residentialMenus: {},
  retailMenus: {},
  menuItems: {},
  interactions: { a: { liked: true } },
  metrics: { a: { likeCount: 5, dislikeCount: 1 } },
};

test('applyInteraction moves and clears votes, keeps counts for stars, and never mutates', () => {
  const disliked = applyInteraction(data, 'a', { liked: false });
  expect(disliked.interactions.a).toEqual({ liked: false });
  expect(disliked.metrics.a).toEqual({ likeCount: 4, dislikeCount: 2 });

  const cleared = applyInteraction(disliked, 'a', { liked: null });
  expect(cleared.metrics.a).toEqual({ likeCount: 4, dislikeCount: 1 });

  const starred = applyInteraction(data, 'b', { favorited: true });
  expect(starred.interactions.b).toEqual({ favorited: true });
  expect(starred.metrics.b).toEqual({ likeCount: 0, dislikeCount: 0 });

  expect(data.interactions.b).toBeUndefined();
  expect(data.metrics.a).toEqual({ likeCount: 5, dislikeCount: 1 });
});

test('vote counts show once a dish has three votes, likes and dislikes together', () => {
  expect(showsVoteCounts(0, 0)).toBe(false);
  expect(showsVoteCounts(2, 0)).toBe(false);
  expect(showsVoteCounts(2, 1)).toBe(true);
  expect(showsVoteCounts(0, 3)).toBe(true);
});
