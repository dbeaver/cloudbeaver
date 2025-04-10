/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// different machine has its own timezones and some tests can fail because of it
process.env.TZ = 'UTC';

function resetDocument() {
  document.body.innerHTML = '';
  document.body.className = '';
  cleanup();
}

beforeEach(() => {
  vi.restoreAllMocks();
  resetDocument();
});
