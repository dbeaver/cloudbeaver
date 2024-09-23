/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { CachedResource } from './CachedResource.js';
import {
  CACHED_RESOURCE_DEFAULT_PAGE_LIMIT,
  CACHED_RESOURCE_DEFAULT_PAGE_OFFSET,
  CachedResourceOffsetPageKey,
  CachedResourceOffsetPageListKey,
  CachedResourceOffsetPageTargetKey,
} from './CachedResourceOffsetPageKeys.js';
import type { CachedResourceKey } from './IResource.js';

interface IOffsetPageKeyInfo {
  limit: number;
  offset: number;
  isPageListKey: boolean;
  pageTargetKey?: any;
}

export function getOffsetPageKeyInfo(
  resource: CachedResource<any, any, any, any>,
  originalKey: CachedResourceKey<any>,
  offset = CACHED_RESOURCE_DEFAULT_PAGE_OFFSET,
  limit = CACHED_RESOURCE_DEFAULT_PAGE_LIMIT,
): IOffsetPageKeyInfo {
  const pageListKey = resource.aliases.isAlias(originalKey, CachedResourceOffsetPageListKey);
  const pageKey = resource.aliases.isAlias(originalKey, CachedResourceOffsetPageKey) || pageListKey;
  const pageTargetKey = resource.aliases.isAlias(originalKey, CachedResourceOffsetPageTargetKey);

  if (pageKey) {
    limit = pageKey.options.limit;
    offset = pageKey.options.offset;
  }

  return {
    limit,
    offset,
    isPageListKey: !!pageListKey,
    pageTargetKey: pageTargetKey?.options.target,
  };
}
