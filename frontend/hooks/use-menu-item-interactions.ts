'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MENUS_KEY } from '@/hooks/use-menus';
import { ApiError, patchUserMenuItemInteraction } from '@/lib/endpoints';
import { applyInteraction, type InteractionPatch } from '@/lib/interactions';
import { promptLogin } from '@/lib/login-prompt';
import type { MenuData, MenuItemInteraction, MenuItemMetrics } from '@/types';

interface MenuItemInteractions {
  userLiked: boolean | null;
  likeCount: number;
  dislikeCount: number;
  favorited: boolean;
  handleLike: () => void;
  handleDislike: () => void;
  handleFavorite: () => void;
}

/**
 * Like, dislike and favourite controls for one menu item. A change shows immediately in every
 * cached day (the same recipe appears on several days) and is saved in the background; if the
 * save fails, the next fetch brings back the server's answer.
 */
export function useMenuItemInteractions(
  menuItemId: string,
  interaction: MenuItemInteraction | null,
  metrics: MenuItemMetrics | null
): MenuItemInteractions {
  const { user, isLoading: userLoading } = useUser();
  const client = useQueryClient();

  const mutation = useMutation({
    mutationFn: (patch: InteractionPatch) => patchUserMenuItemInteraction(menuItemId, patch),
    onMutate: (patch) => {
      client.setQueriesData<MenuData>({ queryKey: [MENUS_KEY] }, (data) =>
        data ? applyInteraction(data, menuItemId, patch) : data
      );
    },
    onError: (error) => {
      // A 401 means the session ran out since the page loaded.
      if (error instanceof ApiError && error.status === 401) promptLogin();
      void client.invalidateQueries({ queryKey: [MENUS_KEY] });
    },
  });

  const userLiked = interaction?.liked ?? null;
  const favorited = interaction?.favorited ?? false;

  const submit = (patch: InteractionPatch) => {
    if (!userLoading && !user) return promptLogin();
    if (mutation.isPending) return;
    mutation.mutate(patch);
  };

  return {
    userLiked,
    favorited,
    likeCount: metrics?.likeCount ?? 0,
    dislikeCount: metrics?.dislikeCount ?? 0,
    handleLike: () => submit({ liked: userLiked === true ? null : true }),
    handleDislike: () => submit({ liked: userLiked === false ? null : false }),
    handleFavorite: () => submit({ favorited: !favorited }),
  };
}
