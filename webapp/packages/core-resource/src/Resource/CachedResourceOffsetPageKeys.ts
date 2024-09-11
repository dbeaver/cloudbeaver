/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { IResourceOffsetPage } from './OffsetPagination/IResourceOffsetPage';
import { ResourceOffsetPage } from './OffsetPagination/ResourceOffsetPage';
import { ResourceKey } from './ResourceKey';
import { resourceKeyAliasFactory } from './ResourceKeyAlias';
import { resourceKeyListAliasFactory } from './ResourceKeyListAlias';

interface IOffsetPageInfo {
  offset: number;
  limit: number;
}

export interface ICachedResourceOffsetPage {
  totalCount?: number;
  end?: number;
  pages: IResourceOffsetPage[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ICachedResourceOffsetPageOptions extends IOffsetPageInfo {}

export const CACHED_RESOURCE_DEFAULT_PAGE_OFFSET = 0;
export const CACHED_RESOURCE_DEFAULT_PAGE_LIMIT = 100;

export const CachedResourceOffsetPageTargetKey = resourceKeyAliasFactory('@cached-resource/param-chain', <T>(target: ResourceKey<T>) => ({ target }));
export const CachedResourceOffsetPageListKey = resourceKeyListAliasFactory<
  any,
  [offset: number, limit: number],
  Readonly<ICachedResourceOffsetPageOptions>
>('@cached-resource/offset-page-list', (offset: number, limit: number) => ({
  offset,
  limit,
}));

export const CachedResourceOffsetPageKey = resourceKeyAliasFactory<any, [offset: number, limit: number], Readonly<ICachedResourceOffsetPageOptions>>(
  '@cached-resource/offset-page',
  (offset: number, limit: number) => ({
    offset,
    limit,
  }),
);

export function getNextPageOffset(info: ICachedResourceOffsetPage): number {
  let lastPage: IResourceOffsetPage | undefined = undefined;

  for (const page of info.pages) {
    if (!lastPage) {
      lastPage = page;
      continue;
    }
    if (page.from !== lastPage.to) {
      break;
    }
    lastPage = page;
  }

  return lastPage?.to ?? CACHED_RESOURCE_DEFAULT_PAGE_OFFSET;
}

export function isOffsetPageOutdated(pages: IResourceOffsetPage[], info: IOffsetPageInfo): boolean {
  const from = info.offset;
  const to = info.offset + info.limit;
  for (const page of pages) {
    if (page.isHasCommonSegment(from, to) && page.isOutdated()) {
      return true;
    }
  }
  return false;
}

export function isOffsetPageInRange({ pages, end }: ICachedResourceOffsetPage, info: IOffsetPageInfo): boolean {
  const infoTo = info.offset + info.limit;
  let meetFrom = false;
  let meetTo = false;
  let lastIndex = -1;

  for (const { from, to } of pages) {
    if (lastIndex === -1) {
      lastIndex = from;
    }
    if (from !== lastIndex) {
      return false;
    }
    lastIndex = to;
    if (info.offset >= from) {
      meetFrom = true;
    }
    if (infoTo <= to || (end !== undefined && end <= infoTo)) {
      meetTo = true;
    }
    if (meetFrom && meetTo) {
      return true;
    }
  }
  return false;
}

export function expandOffsetPageRange(
  pages: IResourceOffsetPage[],
  info: IOffsetPageInfo,
  items: any[],
  outdated: boolean,
  hasNextPage: boolean,
): void {
  const from = info.offset;
  const to = info.offset + info.limit;

  let pageInserted = false;
  for (const page of pages) {
    if (page.to <= from) {
      continue;
    }

    if (!hasNextPage) {
      if (page.from >= to) {
        pages.splice(pages.indexOf(page));
        break;
      }
    }

    if (page.from <= from && !pageInserted) {
      if (page.from < from) {
        page.setSize(page.from, from);
        pages.splice(pages.indexOf(page) + 1, 0, new ResourceOffsetPage().setSize(from, to).update(from, items).setOutdated(outdated));
      } else {
        page.setSize(from, to).update(from, items).setOutdated(outdated);
      }
      pageInserted = true;
      continue;
    }

    if (page.isInRange(from, to)) {
      pages.splice(pages.indexOf(page), 1);
    }
  }

  const lastPage = pages[pages.length - 1];

  if (!lastPage || lastPage.to <= from) {
    pages.push(new ResourceOffsetPage().setSize(from, to).update(from, items).setOutdated(outdated));
  }
}
