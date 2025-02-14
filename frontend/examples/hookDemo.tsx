/**
 * @overview Example of using SWR hooks for real-time data fetching.
 * 
 * Hooks can only be used in React components. The key characteristic of hooks 
 * is that they run on *every* render. This has important implications for data fetching.
 * 
 * This example demonstrates:
 * 1. Using typed SWR hooks with automatic revalidation
 * 2. Proper error handling and loading states
 * 3. Component lifecycle management
 * 4. Data transformation with TypeScript
 *
 * To run this file:
 *   1. Start the backend server
 *   2. cd into the examples directory (.../hoagie/meal/frontend)
 *   3. Run the example file with `bun examples/hookDemo.tsx`
 * 
 * Copyright © 2021-2025 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree or at
 * 
 *    https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT license to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

import React, { useEffect } from 'react';
import { render, act } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { useGetLocations } from '@/hooks/use-endpoints';
import { JSDOM } from 'jsdom';

// Set up minimal browser environment for React
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window as unknown as Window & typeof globalThis;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.Element = dom.window.Element;
global.HTMLElement = dom.window.HTMLElement;

// Component that demonstrates SWR's real-time data fetching
function LocationsComponent() {
  const { data, error, isValidating } = useGetLocations({
    refreshInterval: 3000,      // Refresh every 3 seconds
    revalidateOnMount: true,    // Fetch on mount
    dedupingInterval: 1000,     // Prevent duplicate requests
  });

  // Log data fetching lifecycle
  useEffect(() => {
    if (isValidating) {
      console.log(`\nFetching data at: ${new Date().toISOString()}`);
    }
  }, [isValidating]);

  useEffect(() => {
    if (data) {
      // Group locations by college
      const locationsByCollege = data.data?.reduce((acc, loc) => {
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
      }, {} as Record<string, number>) ?? {};

      console.log('\nNew data received:');
      console.log('Total locations:', data.data?.length ?? 0);
      console.log('Locations by college:', locationsByCollege);
    }
  }, [data]);

  if (error) console.error('Error:', error);
  return <div>SWR Demo Running...</div>;
}

// Run the demo with proper React lifecycle
async function runDemo() {
  console.log('Starting SWR demo...\n');

  const Demo = () => (
    <SWRConfig value={{ provider: () => new Map() }}>
      <LocationsComponent />
    </SWRConfig>
  );

  try {
    // Mount and observe data fetching
    const { unmount } = render(<Demo />);
    await act(() => new Promise(r => setTimeout(r, 7000)));

    // Remount to demonstrate fresh data fetch
    unmount();
    await new Promise(r => setTimeout(r, 1000));

    const { unmount: cleanup } = render(<Demo />);
    await act(() => new Promise(r => setTimeout(r, 7000)));
    cleanup();

  } catch (error) {
    console.error('Demo failed:', error);
  }
}

runDemo();
export default runDemo;