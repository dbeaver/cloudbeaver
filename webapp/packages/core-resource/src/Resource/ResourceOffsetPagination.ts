/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';

import { expandOffsetPageRange, type ICachedResourceOffsetPage, type ICachedResourceOffsetPageOptions } from './CachedResourceOffsetPageKeys.js';
import type { ICachedResourceMetadata } from './ICachedResourceMetadata.js';
import type { ResourceAlias } from './ResourceAlias.js';
import type { ResourceMetadata } from './ResourceMetadata.js';

export class ResourceOffsetPagination<TKey, TMetadata extends ICachedResourceMetadata> {
  constructor(
    protected metadata: ResourceMetadata<TKey, TMetadata>,
    private readonly getStableKey: (key: TKey) => TKey,
  ) {
    this.metadata = metadata;
  }

  getPageInfo(key: ResourceAlias<TKey, Readonly<ICachedResourceOffsetPageOptions>>): ICachedResourceOffsetPage | undefined {
    if (!this.metadata.has(key as TKey)) {
      return undefined;
    }

    return this.metadata.get(key as TKey).offsetPage;
  }

  hasNextPage(key: ResourceAlias<TKey, Readonly<ICachedResourceOffsetPageOptions>>): boolean {
    const pageInfo = this.getPageInfo(key);
    const to = key.options.offset + key.options.limit;

    if (!pageInfo) {
      return false;
    }

    return pageInfo.end === undefined || to < pageInfo.end;
  }

  setPage(key: ResourceAlias<TKey, Readonly<ICachedResourceOffsetPageOptions>>, items: any[], hasNextPage: boolean) {
    const offset = key.options.offset;
    const pageEnd = offset + items.length;

    this.metadata.update(key as TKey, metadata => {
      let end = metadata.offsetPage?.end;

      if (hasNextPage) {
        if (end !== undefined && end <= pageEnd) {
          end = undefined;
        }
      } else {
        end = pageEnd;
      }

      if (!metadata.offsetPage) {
        metadata.offsetPage = observable({
          pages: [],
          end,
        });
      }

      metadata.offsetPage.end = end;

      if (!metadata.offsetPage.pages) {
        metadata.offsetPage.pages = [];
      }

      expandOffsetPageRange(metadata.offsetPage.pages, key.options, items.map(this.getStableKey), false, hasNextPage);
    });
  }
}
