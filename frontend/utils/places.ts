/**
 * @overview Utility helpers related to the /api/places/open endpoint.
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

import type {
  Place,
  ResidentialVenue,
  CafeVenue,
  SpecialtyVenue,
  DiningVenue,
} from '@/types/places';
import type { VenueType } from '@/types/places';
import { RESIDENTIAL_VENUES, CAFE_FRAGMENTS } from '@/types/places';

/**
 * Classifies a venue type based on its name.
 * @param name - The name of the venue.
 * @returns The type of the venue.
 */
export function classifyVenueType(name: string): VenueType {
  // Trim and normalize the name just in case
  const trimmed = name.trim().toLowerCase();

  // Check if it matches any known residential name exactly
  if (RESIDENTIAL_VENUES.some((resName) => resName.toLowerCase() === trimmed)) {
    return 'residential';
  }

  // If "cafe", "gallery", etc. is found in the name, then classify it as a cafe
  if (CAFE_FRAGMENTS.some((fragment) => trimmed.includes(fragment.toLowerCase()))) {
    return 'cafe';
  }

  // Default catch-all type
  return 'specialty';
}

/**
 * Checks if a venue is a residential venue.
 * @param venue - The venue to check.
 * @returns True if the venue is a residential venue, false otherwise.
 */
export function isResidential(venue: DiningVenue): venue is ResidentialVenue {
  return venue.type === 'residential';
}

/**
 * Checks if a venue is a cafe venue.
 * @param venue - The venue to check.
 * @returns True if the venue is a cafe venue, false otherwise.
 */
export function isCafe(venue: DiningVenue): venue is CafeVenue {
  return venue.type === 'cafe';
}

/**
 * Checks if a venue is a specialty venue.
 * @param venue - The venue to check.
 * @returns True if the venue is a specialty venue, false otherwise.
 */
export function isSpecialty(venue: DiningVenue): venue is SpecialtyVenue {
  return venue.type === 'specialty';
}

export type Venue = {
  name: string;
  category: string;
};

export function classifyVenue(venueName: string): string {
  if (venueName.includes('Dining Hall')) return 'dining';
  return 'other';
}
