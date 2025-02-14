/**
 * @overview Example of fetching data using the Next.js Route Handler.
 * 
 * This example demonstrates:
 * 1. Making typed API requests to our Next.js API routes
 * 2. Proper error handling with type guards
 * 3. Safe data access with optional chaining
 *
 * To run this file:
 *   1. Start the Next.js dev server
 *   2. cd into the examples directory (.../hoagie/meal/frontend)
 *   3. Run the example file with `bun examples/locationsServerSide.tsx`
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

import type { DiningLocationsResponse } from '@/types/dining';

const FRONTEND_URL = process.env.HOAGIE_URL

// Simple function to demonstrate data fetching using the Next.js Route Handler
async function getDiningLocationsServerSide() {
  try {
    // Our Next.js frontend now has an "API" that can call the backend API from the server-side
    console.log('Fetching from:', `${FRONTEND_URL}/api/dining/locations`);

    // Try both XML and JSON formats
    const fmts = ['xml', 'json'];
    let jsonResponse: DiningLocationsResponse | null = null;

    for (const fmt of fmts) {
      console.log(`\nTesting ${fmt.toUpperCase()} format:`);

      const res = await fetch(`${FRONTEND_URL}/api/dining/locations?fmt=${fmt}`);
      console.log('Response status:', res.status, res.statusText);

      const response: DiningLocationsResponse = await res.json();
      console.log(`${fmt.toUpperCase()} Response:`, response);
      console.log(`${fmt.toUpperCase()} Total locations:`, response.data?.length ?? 0);

      // Keep the JSON response for further processing
      if (fmt === 'json') {
        jsonResponse = response;
      }
    }

    if (!jsonResponse?.data) {
      throw new Error('No locations data in JSON response');
    }

    const locations = jsonResponse.data;

    // Example: Group locations by college (same as examples/locations.tsx)
    const locationsByCollege = locations.reduce((acc, loc) => {
      const collegeAmenity = loc.amenities.amenity instanceof Array
        ? loc.amenities.amenity.find(a => a.name.startsWith('College:'))
        : loc.amenities.amenity.name.startsWith('College:')
          ? loc.amenities.amenity
          : null;

      const college = collegeAmenity
        ? collegeAmenity.name.replace('College:', '').trim()
        : 'Other';

      acc[college] = (acc[college] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\nAnalysis of JSON response:');
    console.log('Locations by college:', locationsByCollege);

    // Example: Print location details with coordinates
    console.log('\nLocation Details:');
    locations.forEach(loc => {
      console.log(`${loc.name}:`);
      console.log(`  Building: ${loc.building.name}`);
      console.log(`  Coordinates: (${loc.geoloc.lat}, ${loc.geoloc.long})`);
      console.log(`  Database ID: ${loc.dbid}`);
      console.log('  Amenities:', Array.isArray(loc.amenities.amenity)
        ? loc.amenities.amenity.map(a => a.name).join(', ')
        : loc.amenities.amenity.name
      );
      console.log('');
    });

  } catch (error) {
    // Handle different types of errors appropriately
    if (error instanceof Error) {
      console.error('Error:', error.message);
    } else {
      console.error('Network error:', error);
    }
  }
}

getDiningLocationsServerSide();
export default getDiningLocationsServerSide; 
