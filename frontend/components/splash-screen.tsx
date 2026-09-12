'use client';

import { useEffect, useLayoutEffect, useState } from 'react';

const SIT_MS = 100; // how long the logo sits before bouncing away
const BOUNCE_MS = 550; // must match the splash-bounce-away animation in globals.css

// Only show the splash on a full page load, not on client-side navigations.
let isInitialLoad = true;

export default function SplashScreen() {
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(!isInitialLoad);

  // Runs before paint so navigating within the app never flashes the splash.
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
      className={`fixed inset-0 z-[9999] flex items-center justify-center ${leaving ? 'splash-screen--leaving' : ''}`}
      style={{ background: 'radial-gradient(ellipse at 50% 120%, #00a802 0%, #008001 65%)' }}
    >
      <div className='flex animate-[splash-enter_400ms_ease_both] flex-col items-center gap-6'>
        <span className='text-6xl leading-none tracking-tight text-white'>
          <span className='font-medium text-white/80'>hoagie</span>
          <span className='font-semibold'>meal</span>
        </span>
        <span className='text-base text-white/50'>by hoagieclub</span>
      </div>
    </div>
  );
}
