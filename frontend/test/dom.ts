// First preload for `bun test`: a DOM must exist before Testing Library is imported, because it
// binds its `screen` queries to `document` at import time.
import { GlobalRegistrator } from '@happy-dom/global-registrator';

GlobalRegistrator.register();

if (!('ResizeObserver' in globalThis)) {
  (globalThis as Record<string, unknown>).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
