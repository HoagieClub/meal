/**
 * @overview Expected response structure from the /api/places endpoint.
 *
 * Copyright © 2021-2025 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree or at
 * 
 *    https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the software. This software is provided
 * "as-is", without warranty of any kind.
 */

// The status indicating whether a place is open or closed.
export type PlaceStatus = 'yes' | 'no'; // TODO: Closing soon status

// Represents a campus venue or place.
export interface Place {
  // Unique identifier for the place.
  id: string;

  // The display name of the place.
  name: string;

  // The open/closed status of the place.
  open: PlaceStatus;
}

// The expected successful response from the /api/places endpoint.
export interface PlacesResponse {
  // The list of available places.
  places: Place[];

  // A descriptive message.
  message: string;

  // The HTTP status code.
  status: number;
}
