'use client';

import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  // ---- tune these two numbers ----
  const SIT_MS = 0;    // how long it sits before bouncing away
  const BOUNCE_MS = 550; // must match the animation duration in globals.css
  // --------------------------------

  useEffect(() => {
    const leaveTimer = setTimeout(() => setLeaving(true), SIT_MS);
    const goneTimer = setTimeout(() => setGone(true), SIT_MS + BOUNCE_MS);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(goneTimer);
    };
  }, []);

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
