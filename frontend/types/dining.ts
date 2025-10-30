/**
 * @overview Expected response structure from the /api/dining endpoint.
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

// TODO: Temporary icons for now
export type MealIcon = '🍂' | '🥜' | '🥚' | '🥛' | '🌱' | '🥜';

export type Meal = 'Breakfast' | 'Brunch' | 'Lunch' | 'Dinner';

export interface DiningLocation {
  name: string;
  mapName: string;
  dbid: string;
  maploc: string;
  geoloc: {
    lat: string;
    long: string;
  };
  building: {
    location_id: string;
    name: string;
  };
  eventsFeedConfig: {
    locationID: string;
    baseURL: string;
    menuURL: string;
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
  link?: string;
}

// The expected successful response from the /api/dining/locations endpoint.
export interface DiningLocationsResponse {
  data: DiningLocation[];
  message: string;
  status?: number; // Optional since it's not always present in responses
}

export type DietKey = 'Vegetarian' | 'Vegan' | 'Halal' | 'Kosher';
export type AllergenKey =
  | 'Peanut'
  | 'Coconut'
  | 'Egg'
  | 'Milk'
  | 'Wheat'
  | 'Soybeans'
  | 'Crustacean'
  | 'Alcohol'
  | 'Gluten'
  | 'Fish'
  | 'Sesame';


// Interface for what the UI components use
export interface UIMenuItem {
  id: number;
  name: string;
  description: string;
  link: string;
  allergens: string[];
  ingredients: string[];
}

export interface UIVenue {
  name: string;
  items: Record<'Main Entrée' | 'Vegetarian + Vegan Entrée' | 'Soups', UIMenuItem[]>;
  allergens: Set<string>;
  calories: Record<string, number>;
  protein: Record<string, number>;
}