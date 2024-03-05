/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';

import {
  ICachedResourceOffsetPage,
  type ICachedResourceOffsetPageOptions,
  isOffsetPageInRange,
  limitOffsetPages,
} from './CachedResourceOffsetPageKeys';
import type { ICachedResourceMetadata } from './ICachedResourceMetadata';
import type { ResourceAlias } from './ResourceAlias';
import type { ResourceMetadata } from './ResourceMetadata';

export class ResourceOffsetPagination<TKey, TMetadata extends ICachedResourceMetadata> {
  constructor(protected metadata: ResourceMetadata<TKey, TMetadata>) {
    this.metadata = metadata;
  }

  getPageInfo(key: ResourceAlias<TKey, Readonly<ICachedResourceOffsetPageOptions>>): ICachedResourceOffsetPage | undefined {
    if (!this.metadata.has(key as TKey)) {
      return undefined;
    }

    const page = this.metadata.get(key as TKey).offsetPage;

    if (!page || !isOffsetPageInRange(page, key.options)) {
      return undefined;
    }

    return page;
  }

  hasNextPage(key: ResourceAlias<TKey, Readonly<ICachedResourceOffsetPageOptions>>): boolean {
    const pageInfo = this.getPageInfo(key);
    const to = key.options.offset + key.options.limit;

    if (!pageInfo) {
      return false;
    }

    return pageInfo.end === undefined || to < pageInfo.end;
  }

  setPageEnd(key: ResourceAlias<TKey, Readonly<ICachedResourceOffsetPageOptions>>, hasNextPage: boolean): void {
    const count = key.options.offset + key.options.limit;

    this.metadata.update(key as TKey, metadata => {
      let end = metadata.offsetPage?.end;

      if (hasNextPage) {
        if (end !== undefined && end <= count) {
          end = undefined;
        }
      } else {
        end = count;
      }

      metadata.offsetPage = observable({
        pages: [],
        ...metadata.offsetPage,
        end,
      });

      if (!hasNextPage) {
        metadata.offsetPage.pages = limitOffsetPages(metadata.offsetPage?.pages || [], count);
      }
    });
  }
}
