/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { CachedResourceOffsetPageKey, CachedResourceOffsetPageTargetKey } from './CachedResourceOffsetPageKeys.js';
import type { ICachedResourceMetadata } from './ICachedResourceMetadata.js';
import type { ResourceOffsetPagination } from './ResourceOffsetPagination.js';

export function hasMorePagesForNode<TKey, TMetadata extends ICachedResourceMetadata>(
  pagination: ResourceOffsetPagination<TKey, TMetadata>,
  nodeId: string,
): boolean {
  const pageInfo = pagination.getPageInfo(CachedResourceOffsetPageKey(0, 0).setParent(CachedResourceOffsetPageTargetKey(nodeId)));

  return !!pageInfo && pageInfo.end === undefined;
}
