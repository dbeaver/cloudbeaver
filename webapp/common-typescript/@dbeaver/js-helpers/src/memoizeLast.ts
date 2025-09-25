/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import pMemoize from 'p-memoize';
import QuickLRU from 'quick-lru';

const cacheKey = (args: unknown[]) => JSON.stringify(args);

export function memoizeLast<T extends (...a: any[]) => Promise<any>>(fn: T) {
  return pMemoize(fn, {
    cache: new QuickLRU({ maxSize: 5 }),
    cacheKey,
  });
}
