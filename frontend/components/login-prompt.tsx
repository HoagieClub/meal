'use client';

import { useEffect, useState } from 'react';
import { CrossIcon } from 'evergreen-ui';
import { LOGIN_PROMPT_EVENT } from '@/lib/login-prompt';

const SHOW_MS = 6000;

/**
 * A small green banner asking a logged-out visitor to sign in. It stays hidden until
 * `promptLogin()` fires, then shows for a few seconds or until dismissed.
 */
export default function LoginPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const show = () => {
      setVisible(true);
      clearTimeout(timer);
      timer = setTimeout(() => setVisible(false), SHOW_MS);
    };
    window.addEventListener(LOGIN_PROMPT_EVENT, show);
    return () => {
      window.removeEventListener(LOGIN_PROMPT_EVENT, show);
      clearTimeout(timer);
    };
  }, []);

  if (!visible) return null;

  const returnTo = window.location.pathname + window.location.search;
  return (
    <div
      role='status'
      className='login-prompt-enter fixed inset-x-4 top-4 z-[110] mx-auto flex w-fit max-w-full items-center gap-3 rounded-full border border-green-700/25 bg-green-50 py-2 pr-2 pl-4 text-sm text-green-900 shadow-lg'
    >
      <span>Log in to star and like items</span>
      <a
        href={`/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`}
        className='rounded-full bg-green-700 px-3 py-1 font-semibold whitespace-nowrap text-white hover:bg-green-800'
      >
        Log in
      </a>
      <button
        type='button'
        aria-label='Dismiss'
        onClick={() => setVisible(false)}
        className='flex h-6 w-6 items-center justify-center rounded-full text-green-800 hover:bg-green-100'
      >
        <CrossIcon size={14} />
      </button>
    </div>
  );
}
