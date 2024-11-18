/**
 * @overview Expected response structure from the /api/dining endpoint.
 *
 * Copyright © 2021-2024 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree or at
 * 
 *    https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

// TODO: Temporary icons for now
export type MealIcon = '🍂' | '🥜' | '🥚' | '🥛' | '🌱' | '🥜';

export type Meal = 'Breakfast' | 'Brunch' | 'Lunch' | 'Dinner';

export interface DiningLocation {
  name: string;
  mapName: string;
  dbid: string;
  status: 'yes' | 'no';  // Open/closed status
  geoloc: {
    lat: string;
    long: string;
  };
  building: {
    name: string;
    location_id: string;
  };
  amenities: {
    amenity: Array<{ name: string }> | { name: string };
  };
}

export interface DiningEvent {
  summary: string;
  start: string;
  end: string;
  uid: string;
  description: string;
}

export interface MenuCategory {
  category: string;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  icons?: MealIcon[];

  // TODO: Might want to adjust these fields later
  calories?: number;
  protein?: number;
  link?: string;    // Keeping this from original type
}