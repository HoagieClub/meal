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
 *   3. Run the example file with `bun examples/locations.tsx`
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

import { request } from '@/lib/http';
import type { ApiResponse } from '@/types/http';
import type { DiningLocation } from '@/types/dining';

// Simple function to demonstrate data fetching using the GET HTTP method
async function getDiningLocations() {
  try {
    // Use the typed Hoagie HTTP client
    const response = await request.get<DiningLocation[]>()(
      '/api/dining/locations',
      { /* This part is empty because no args are needed */ },
    );

    // Let's see what we got!
    console.log('API Response:', response);
    console.log('Total locations:', response.data?.length ?? 0);

    // Example: Group locations by college
    const locationsByCollege = response.data?.reduce((acc, loc) => {
      const collegeAmenity = loc.amenities.amenity instanceof Array
        ? loc.amenities.amenity.find(a => a.name.startsWith('College:'))
        : loc.amenities.amenity.name.startsWith('College:')
          ? loc.amenities.amenity
          : null;

      const college = collegeAmenity
        ? collegeAmenity.name.replace('College:', '').trim()
        : loc.name; // fallback to the actual dining location name
    
      acc[college] = (acc[college] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) ?? {};

    console.log('Locations by college:', locationsByCollege);

    // Example: Print all payment methods
    const allPaymentMethods = new Set<string>();
    response.data?.forEach(loc => {
      const amenities = loc.amenities.amenity instanceof Array
        ? loc.amenities.amenity
        : [loc.amenities.amenity];

      amenities.forEach(amenity => {
        if (amenity.name.startsWith('Payment:')) {
          const methods = amenity.name.replace('Payment:', '').split(',');
          methods.forEach(method => allPaymentMethods.add(method.trim()));
        }
      });
    });

    console.log('Available payment methods:', [...allPaymentMethods]);

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

getDiningLocations();
export default getDiningLocations;
