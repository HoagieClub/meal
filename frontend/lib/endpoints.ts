import type { InteractionPatch } from '@/lib/interactions';
import { toCamelCase } from '@/lib/utils';
import type { MenuItem, MenuItemInteraction, MenuItemMetrics, MenusByLocation } from '@/types';

// Menus are fetched straight from the backend. Authenticated calls go through the Next.js
// proxy routes under /api, which attach the Auth0 access token server-side.
const BACKEND_URL = process.env.NEXT_PUBLIC_HOAGIE_API_URL || 'http://localhost:8000';

/** An endpoint answered with an error; `status` lets callers tell a lost login from an outage. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface EngagementData {
  interactions: Record<string, MenuItemInteraction>;
  metrics: Record<string, MenuItemMetrics>;
}

/** Fetch JSON, unwrap the `{ status, message, data, error }` envelope and throw on failure. */
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = await res.json().catch(() => null);
  if (!res.ok || json?.data == null) {
    throw new ApiError(
      res.status,
      json?.error ?? json?.message ?? `Request failed (${res.status})`
    );
  }
  return toCamelCase(json.data) as T;
}

function jsonBody(method: 'POST' | 'PATCH', body: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

export function getMenusAndItemsForDate(date: string) {
  return request<{ menus: MenusByLocation; menuItems: Record<string, MenuItem> }>(
    `${BACKEND_URL}/api/menus/?date=${encodeURIComponent(date)}`
  );
}

export function getEngagementData(menuItemApiIds: string[]) {
  return request<EngagementData>(
    '/api/engagement/',
    jsonBody('POST', { menu_item_api_ids: menuItemApiIds })
  );
}

export function patchUserMenuItemInteraction(menuItemApiId: string, patch: InteractionPatch) {
  return request<unknown>(
    '/api/engagement/interaction/',
    jsonBody('PATCH', { menu_item_api_id: menuItemApiId, ...patch })
  );
}
