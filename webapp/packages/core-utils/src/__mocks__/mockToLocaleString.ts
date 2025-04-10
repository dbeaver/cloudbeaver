/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { afterEach, beforeEach } from 'vitest';

export function mockToLocaleString(): void {
  let originalToLocaleString: typeof Date.prototype.toLocaleString;

  beforeEach(() => {
    originalToLocaleString = Date.prototype.toLocaleString;
    Date.prototype.toLocaleString = function () {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(this);
    };
  });

  afterEach(() => {
    Date.prototype.toLocaleString = originalToLocaleString;
  });
}
