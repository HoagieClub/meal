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
 * Hook for managing date-related functionality.
 *
 * @returns An object containing the date-related functionality.
 */
export function useDate() {
  // get today at midnight
  const getToday = (): Date => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const [selectedDate, setSelectedDate] = useState<Date>(getToday());

  // get day of week
  const getDayOfWeek = (date: Date): number => {
    return date.getDay();
  };

  // check if date is a weekend
  const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  // get previous day
  const getPreviousDay = (date: Date): Date => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    newDate.setDate(newDate.getDate() - 1);
    return newDate;
  };

  // get next day
  const getNextDay = (date: Date): Date => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    newDate.setDate(newDate.getDate() + 1);
    return newDate;
  };

  // get date key
  const getDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // format date
  const formatDate = (date: Date): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // check if date is today
  const isToday = (date: Date): boolean => {
    const today = getToday();
    return date.getTime() === today.getTime();
  };

  // check if date is past
  const isPast = (date: Date): boolean => {
    const today = getToday();
    return date.getTime() < today.getTime();
  };

  // check if date is future
  const isFuture = (date: Date): boolean => {
    const today = getToday();
    return date.getTime() > today.getTime();
  };

  // get current meal based on time
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

  const dayOfWeek = getDayOfWeek(selectedDate);
  const isWeekendDay = isWeekend(selectedDate);
  const dateKey = getDateKey(selectedDate);
  const formattedDate = formatDate(selectedDate);
  const isSelectedToday = isToday(selectedDate);
  const isSelectedPast = isPast(selectedDate);
  const isSelectedFuture = isFuture(selectedDate);
  const currentMeal = getCurrentMeal();

  const goToPreviousDay = () => {
    setSelectedDate(getPreviousDay);
  };

  const goToNextDay = () => {
    setSelectedDate(getNextDay);
  };

  const goToToday = () => {
    setSelectedDate(getToday());
  };

  const goToDate = (date: Date) => {
    setSelectedDate(date);
  };

  return {
    selectedDate,
    setSelectedDate,
    dayOfWeek,
    isWeekend: isWeekendDay,
    dateKey,
    formattedDate,
    isToday: isSelectedToday,
    isPast: isSelectedPast,
    isFuture: isSelectedFuture,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    goToDate,
    currentMeal,
  };
}
