/**
 * @overview Like/Dislike buttons component for nutrition page.
 *
 * Copyright © 2021-2025 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree or at
 *
 *    https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Pane, Text, useTheme, minorScale, majorScale, Spinner } from 'evergreen-ui';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { MenuItemInteraction, MenuItemMetrics } from '@/types/dining';
import { api } from '@/hooks/use-next-api';

const GET_USER_INTERACTION_URL = '/api/interactions/user/';
const UPDATE_INTERACTION_URL = '/api/interactions/user/update/';
const GET_METRICS_URL = '/api/interactions/metrics/';

/**
 * Like/Dislike button props.
 *
 * @param icon - The icon to display.
 * @param count - The count of the interaction.
 * @param isActive - Whether the interaction is active.
 * @param onClick - The function to call when the interaction is clicked.
 * @param title - The title of the interaction.
 * @param activeColor - The color of the active interaction.
 * @param activeBgColor - The background color of the active interaction.
 * @returns A React component.
 */
interface LikeDislikeButtonProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  count: number | string;
  isActive: boolean;
  onClick: () => void;
  title: string;
  activeColor: string;
  activeBgColor: string;
}

/**
 * Like/Dislike button component.
 *
 * @param icon - The icon to display.
 * @param count - The count of the interaction.
 * @param isActive - Whether the interaction is active.
 * @param onClick - The function to call when the interaction is clicked.
 * @param title - The title of the interaction.
 * @param activeColor - The color of the active interaction.
 * @param activeBgColor - The background color of the active interaction.
 * @returns A React component.
 */
const LikeDislikeButton = ({
  icon: Icon,
  count,
  isActive,
  onClick,
  title,
  activeColor,
  activeBgColor,
}: LikeDislikeButtonProps) => {
  const theme = useTheme();

  return (
    <Pane display='flex' alignItems='center' gap={minorScale(1)}>
      <Pane
        onClick={onClick}
        cursor='pointer'
        display='flex'
        alignItems='center'
        justifyContent='center'
        width={32}
        height={32}
        borderRadius={6}
        background={isActive ? activeBgColor : 'transparent'}
        title={title}
        transition='all 0.2s'
        hoverElevation={1}
      >
        <Icon size={18} color={isActive ? activeColor : theme.colors.gray800} />
      </Pane>
      <Text size={300} fontWeight={500} color={isActive ? activeColor : theme.colors.gray800}>
        {count}
      </Text>
    </Pane>
  );
};

/**
 * Like/Dislike buttons component.
 *
 * @param menuItemApiId - The API ID of the menu item.
 * @returns A React component.
 */
export default function LikeDislikeButtons({ menuItemApiId }: { menuItemApiId: number }) {
  const theme = useTheme();
  const [userLiked, setUserLiked] = useState<boolean | null>(null);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [dislikeCount, setDislikeCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Fetch interaction and metrics from the API
  const fetchInteractionAndMetrics = async () => {
    setLoading(true);
    try {
      const interactionRes = await api
        .get<MenuItemInteraction>(`${GET_USER_INTERACTION_URL}?menu_item_api_id=${menuItemApiId}`)
        .catch(() => null);
      const metricsRes = await api
        .get<MenuItemMetrics>(`${GET_METRICS_URL}?menu_item_api_id=${menuItemApiId}`)
        .catch(() => null);

      if (interactionRes?.data?.data) {
        setUserLiked(interactionRes.data.data.liked);
      }

      if (metricsRes?.data?.data) {
        setLikeCount(metricsRes.data.data.likeCount || 0);
        setDislikeCount(metricsRes.data.data.dislikeCount || 0);
      }
    } catch (error) {
      console.error('Error fetching interaction data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch interaction and metrics when the component mounts
  useEffect(() => {
    if (menuItemApiId) {
      fetchInteractionAndMetrics();
    }
  }, [menuItemApiId]);

  // Handle when user clicks like button
  const handleLikeInteraction = async () => {
    if (updating) return;
    setUpdating(true);

    let newLikeStatus;
    let optimisticLikeCount;
    let optimisticDislikeCount;

    // Update like status and optimistic counts
    if (userLiked === true) {
      newLikeStatus = null;
      optimisticLikeCount = likeCount - 1;
      optimisticDislikeCount = dislikeCount;
    } else if (userLiked === false) {
      newLikeStatus = true;
      optimisticLikeCount = likeCount + 1;
      optimisticDislikeCount = dislikeCount - 1;
    } else {
      newLikeStatus = true;
      optimisticLikeCount = likeCount + 1;
      optimisticDislikeCount = dislikeCount;
    }

    // Backup previous values
    const previousLikedBackup = userLiked;
    const previousLikeCountBackup = likeCount;
    const previousDislikeCountBackup = dislikeCount;

    // Update state
    setUserLiked(newLikeStatus);
    setLikeCount(optimisticLikeCount);
    setDislikeCount(optimisticDislikeCount);

    // Update interaction in the API
    try {
      const { data, error } = await api.patch(UPDATE_INTERACTION_URL, {
        menu_item_api_id: menuItemApiId,
        liked: newLikeStatus,
      });
      if (error) throw new Error(error);
    } catch (error) {
      // Rollback state if error occurs
      console.error('Error updating like interaction:', error);
      setUserLiked(previousLikedBackup);
      setLikeCount(previousLikeCountBackup);
      setDislikeCount(previousDislikeCountBackup);
    } finally {
      setUpdating(false);
    }
  };

  // Handle when user clicks dislike button
  const handleDislikeInteraction = async () => {
    if (updating) return;
    setUpdating(true);

    let newLikeStatus;
    let optimisticLikeCount;
    let optimisticDislikeCount;

    // Update like status and optimistic counts
    if (userLiked === false) {
      newLikeStatus = null;
      optimisticLikeCount = likeCount;
      optimisticDislikeCount = dislikeCount - 1;
    } else if (userLiked === true) {
      newLikeStatus = false;
      optimisticLikeCount = likeCount - 1;
      optimisticDislikeCount = dislikeCount + 1;
    } else {
      newLikeStatus = false;
      optimisticLikeCount = likeCount;
      optimisticDislikeCount = dislikeCount + 1;
    }

    // Backup previous values
    const previousLikedBackup = userLiked;
    const previousLikeCountBackup = likeCount;
    const previousDislikeCountBackup = dislikeCount;

    // Update state
    setUserLiked(newLikeStatus);
    setLikeCount(optimisticLikeCount);
    setDislikeCount(optimisticDislikeCount);

    // Update interaction in the API
    try {
      const { data, error } = await api.patch(UPDATE_INTERACTION_URL, {
        menu_item_api_id: menuItemApiId,
        liked: newLikeStatus,
      });
      if (error) throw new Error(error);
    } catch (error) {
      // Rollback state if error occurs
      console.error('Error updating dislike interaction:', error);
      setUserLiked(previousLikedBackup);
      setLikeCount(previousLikeCountBackup);
      setDislikeCount(previousDislikeCountBackup);
    } finally {
      setUpdating(false);
    }
  };

  // Render the like/dislike buttons
  return (
    <Pane display='flex' alignItems='center' gap={majorScale(2)}>
      <LikeDislikeButton
        icon={ThumbsUp}
        count={loading ? '-' : likeCount}
        isActive={userLiked === true}
        onClick={handleLikeInteraction}
        title='Like this item'
        activeColor={theme.colors.green700}
        activeBgColor={theme.colors.green200}
      />
      <LikeDislikeButton
        icon={ThumbsDown}
        count={loading ? '-' : dislikeCount}
        isActive={userLiked === false}
        onClick={handleDislikeInteraction}
        title='Dislike this item'
        activeColor={theme.colors.red700}
        activeBgColor={theme.colors.red100}
      />
    </Pane>
  );
}
