/**
 * @overview Splash loading screen displayed on initial page load.
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

'use client';

import { useEffect, useLayoutEffect, useState } from 'react';

// Only show the splash screen on a true browser reload/load (JS execution),
// not on soft navigations within the Next.js app.
let isInitialLoad = true;

export default function SplashScreen() {
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(!isInitialLoad);
  // ---- tune these two numbers ----
  const SIT_MS = 100;    // how long it sits before bouncing away
  const BOUNCE_MS = 550; // must match the animation duration in globals.css
  // --------------------------------

  // Run before paint to avoid flash when navigating from within the app
  useLayoutEffect(() => {
    isInitialLoad = false;
  }, []);

  useEffect(() => {
    if (gone) return;

    const leaveTimer = setTimeout(() => setLeaving(true), SIT_MS);
    const goneTimer = setTimeout(() => setGone(true), SIT_MS + BOUNCE_MS);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(goneTimer);
    };
  }, [gone]);

  if (gone) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center${leaving ? ' splash-screen--leaving' : ''}`}
      style={{ background: 'radial-gradient(ellipse at 50% 120%, #00a802 0%, #008001 65%)' }}
    >
      <div className='flex flex-col items-center gap-6 animate-[splash-enter_400ms_ease_both]'>
        <span className='text-6xl text-white tracking-tight leading-none'>
          <span className='font-medium text-white/80'>hoagie</span>
          <span className='font-semibold'>meal</span>
        </span>
        <span className='text-md text-white/50'>by hoagieclub</span>
      </div>
    </div>
  );
}
