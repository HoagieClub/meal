/**
 * @overview Hook for managing date-related functionality.
 *
 * Copyright © 2021-2025 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this tree or at
 *
 *    https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

'use client';

import { useState } from 'react';

/**
 * Hook for managing date-related functionality
 *
 * @returns An object containing the date-related functionality
 */
export function useDate() {
  // Get the current date at midnight
  const getToday = (): Date => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const [selectedDate, setSelectedDate] = useState<Date>(getToday());

  // Get the day of the week for a given date
  const getDayOfWeek = (date: Date): number => {
    return date.getDay();
  };

  // Check if a given date is a weekend
  const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  // Get the previous day for a given date
  const getPreviousDay = (date: Date): Date => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    newDate.setDate(newDate.getDate() - 1);
    return newDate;
  };

  // Get the next day for a given date
  const getNextDay = (date: Date): Date => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    newDate.setDate(newDate.getDate() + 1);
    return newDate;
  };

  // Get the date key for a given date
  const getDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Format a date to the YYYY-MM-DD format
  const formatDate = (date: Date): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Format a date to the long date format
  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  // Check if a given date is today
  const isToday = (date: Date): boolean => {
    const today = getToday();
    return date.getTime() === today.getTime();
  };

  // Check if a given date is in the past
  const isPast = (date: Date): boolean => {
    const today = getToday();
    return date.getTime() < today.getTime();
  };

  // Check if a given date is in the future
  const isFuture = (date: Date): boolean => {
    const today = getToday();
    return date.getTime() > today.getTime();
  };

  // Get the current meal based on the time
  const getCurrentMeal = () => {
    const now = new Date();
    const hour = now.getHours();
    if (hour < 11) {
      return 'Breakfast';
    } else if (hour < 17) {
      return 'Lunch';
    } else {
      return 'Dinner';
    }
  };

  // Getters
  const dayOfWeek = getDayOfWeek(selectedDate);
  const isWeekendDay = isWeekend(selectedDate);
  const dateKey = getDateKey(selectedDate);
  const formattedDate = formatDate(selectedDate);
  const formattedDateForDisplay = formatDateForDisplay(selectedDate);
  const isSelectedToday = isToday(selectedDate);
  const isSelectedPast = isPast(selectedDate);
  const isSelectedFuture = isFuture(selectedDate);
  const currentMeal = getCurrentMeal();

  // Goes to the previous day
  const goToPreviousDay = () => {
    setSelectedDate(getPreviousDay);
  };

  // Goes to the next day
  const goToNextDay = () => {
    setSelectedDate(getNextDay);
  };

  // Goes to today
  const goToToday = () => {
    setSelectedDate(getToday());
  };

  // Goes to a given date
  const goToDate = (date: Date) => {
    setSelectedDate(date);
  };

  return {
    // State
    selectedDate,
    setSelectedDate,

    // Getters
    dayOfWeek,
    isWeekend: isWeekendDay,
    dateKey,
    formattedDate,
    formattedDateForDisplay,
    currentMeal,

    // Checkers
    isToday: isSelectedToday,
    isPast: isSelectedPast,
    isFuture: isSelectedFuture,

    // Goers
    goToPreviousDay,
    goToNextDay,
    goToToday,
    goToDate,
  };
}
