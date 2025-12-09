/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { CachedResource } from './CachedResource.js';
import { CachedResourceOffsetPageKey, CachedResourceOffsetPageTargetKey } from './CachedResourceOffsetPageKeys.js';
import type { ICachedResourceMetadata } from './ICachedResourceMetadata.js';

export function hasMorePagesForResourceKey<
  TData,
  TValue,
  TKey,
  TInclude extends ReadonlyArray<string>,
  TMetadata extends ICachedResourceMetadata = ICachedResourceMetadata,
>(resource: CachedResource<TData, TValue, TKey, TInclude, TMetadata>, key: TKey): boolean {
  const pageInfo = resource.offsetPagination.getPageInfo(CachedResourceOffsetPageKey(0, 0).setParent(CachedResourceOffsetPageTargetKey(key)));

  return !!pageInfo && pageInfo.end === undefined;
}
