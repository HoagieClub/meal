/** Event the LoginPrompt banner listens for; fired from wherever a logged-out user needs an account. */
export const LOGIN_PROMPT_EVENT = 'hoagiemeal:login-prompt';

/** Ask the visitor to log in, without navigating away from what they were reading. */
export function promptLogin() {
  window.dispatchEvent(new Event(LOGIN_PROMPT_EVENT));
}
