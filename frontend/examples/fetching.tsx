/**
 * @overview Example of fetching data from the backend.
 * 
 * This example demonstrates:
 * 1. Making typed API requests using our HTTP client
 * 2. Proper error handling with type guards
 * 3. Safe data access with optional chaining
 *
 * To run this file:
 *   1. Start the backend server
 *   2. cd into the examples directory (.../hoagie/meal/frontend)
 *   3. Run the example file with `bun examples/fetching.tsx`
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

import useSWR from 'swr'
import { request } from '@/lib/http';
import type { ApiResponse } from '@/types/http';
import type { PlacesResponse } from '@/types/places';

// Simple function to demonstrate data fetching using the GET HTTP method
async function getOpenPlaces() {
  try {
    // Use the typed Hoagie HTTP client
    const response = await request.get<PlacesResponse>()(
      '/api/dining/places/open',
      { /* This part is empty because no args are needed */ },
    );

    // Safely access nested data with optional chaining (defaults to 0 if undefined)
    const openCount = response.data?.places?.filter(place => place.open === 'yes').length ?? 0;

    // Let's see what we got!
    console.log('API Response:', response);
    console.log('Number of open places:', openCount);

  } catch (error) {
    // Type guard to narrow down error type
    const isApiError = (err: unknown): err is ApiResponse<unknown> =>
      typeof err === 'object' && err !== null && 'status' in err;

    // Handle different types of errors appropriately
    if (isApiError(error)) {
      console.error(`API Error (${error.status}):`, error.message);
    } else {
      console.error('Network error:', error);
    }
  }
}

getOpenPlaces();
