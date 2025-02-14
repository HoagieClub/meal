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


// Example 2: Using SWR with our HTTP client
// This is how you'd use it in a React component
function useOpenPlaces() {
  // SWR will handle caching, revalidation, and real-time updates
  return useSWR<PlacesResponse>(
    '/api/dining/places/open',
    // Our HTTP client works seamlessly with SWR
    request.get<PlacesResponse>(),
    {
      // Optional SWR config
      revalidateOnFocus: true,    // Update when tab is focused
      refreshInterval: 30000,     // Poll every 30 seconds
    }
  );
}

// Run the direct API call example
(async () => {
  try {
    const response = await getOpenPlaces();
    const openCount = response.data?.data?.filter(place => place.open === 'yes').length ?? 0;
    console.log('Number of open places:', openCount);

    // Note: We can't demonstrate the SWR example here because it needs React
    console.log('\nTo use SWR in a React component:');
    console.log(`
  function PlacesComponent() {
    const { data, error, isLoading } = useOpenPlaces();
    
    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;
    
    const openCount = data?.data?.filter(place => place.open === 'yes').length ?? 0;
    return <div>{openCount} places are open</div>;
  }
    `);
  } catch (error) {
    // Error already handled in getOpenPlaces
  }
})();

