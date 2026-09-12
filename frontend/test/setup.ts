// Second preload for `bun test`, after the DOM exists: unmount rendered components between tests.
// Testing Library only does this automatically under Jest-style globals.
import { afterEach } from 'bun:test';
import { cleanup } from '@testing-library/react';

afterEach(cleanup);
