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
  /**
   * Gets the current date at midnight
   *
   * @returns The current date at midnight
   */
  const getToday = (): Date => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  // State for the selected date
  const [selectedDate, setSelectedDate] = useState<Date>(getToday());

  /**
   * Gets the day of the week for a given date
   *
   * @param date - The date to get the day of the week for
   * @returns The day of the week (0-6, where 0 is Sunday and 6 is Saturday)
   */
  const getDayOfWeek = (date: Date): number => {
    return date.getDay();
  };

  /**
   * Checks if a given date is a weekend
   *
   * @param date - The date to check if it is a weekend
   * @returns True if the date is a weekend, false otherwise
   */
  const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  /**
   * Gets the previous day for a given date
   *
   * @param date - The date to get the previous day for
   * @returns The previous day
   */
  const getPreviousDay = (date: Date): Date => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    newDate.setDate(newDate.getDate() - 1);
    return newDate;
  };

  /**
   * Gets the next day for a given date
   *
   * @param date - The date to get the next day for
   * @returns The next day
   */
  const getNextDay = (date: Date): Date => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    newDate.setDate(newDate.getDate() + 1);
    return newDate;
  };

  /**
   * Gets the date key for a given date
   *
   * @param date - The date to get the date key for
   * @returns The date key
   */
  const getDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  /**
   * Formats a date to the YYYY-MM-DD format
   *
   * @param date - The date to format
   * @returns The formatted date
   */
  const formatDate = (date: Date): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  /**
   * Formats a date to the long date format
   *
   * @param date - The date to format
   * @returns The formatted date
   */
  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'numeric',
      day: 'numeric',
    });
  };

  /**
   * Checks if a given date is today
   *
   * @param date - The date to check if it is today
   * @returns True if the date is today, false otherwise
   */
  const isToday = (date: Date): boolean => {
    const today = getToday();
    return date.getTime() === today.getTime();
  };

  /**
   * Checks if a given date is in the past
   *
   * @param date - The date to check if it is in the past
   * @returns True if the date is in the past, false otherwise
   */
  const isPast = (date: Date): boolean => {
    const today = getToday();
    return date.getTime() < today.getTime();
  };

  /**
   * Checks if a given date is in the future
   *
   * @param date - The date to check if it is in the future
   * @returns True if the date is in the future, false otherwise
   */
  const isFuture = (date: Date): boolean => {
    const today = getToday();
    return date.getTime() > today.getTime();
  };

  /**
   * Gets the current meal based on the time
   *
   * @returns The current meal
   */
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
