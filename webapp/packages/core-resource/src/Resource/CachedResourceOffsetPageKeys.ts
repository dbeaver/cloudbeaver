/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IResourceOffsetPage } from './OffsetPagination/IResourceOffsetPage.js';
import { ResourceOffsetPage } from './OffsetPagination/ResourceOffsetPage.js';
import type { ResourceKey } from './ResourceKey.js';
import { resourceKeyAliasFactory } from './ResourceKeyAlias.js';
import { resourceKeyListAliasFactory } from './ResourceKeyListAlias.js';

interface IOffsetPageInfo {
  offset: number;
  limit: number;
}

export interface ICachedResourceOffsetPage {
  totalCount?: number;
  end?: number;
  pages: IResourceOffsetPage[];
}

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

  return Math.min(info.end ?? Number.MAX_SAFE_INTEGER, lastPage?.to ?? CACHED_RESOURCE_DEFAULT_PAGE_OFFSET);
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
  return end !== undefined && end <= infoTo;
}

export function expandOffsetPageRange(
  pages: IResourceOffsetPage[],
  info: IOffsetPageInfo,
  items: any[],
  outdated: boolean,
  hasNextPage: boolean,
): void {
  const initialFrom = info.offset;
  const initialTo = info.offset + info.limit;

  const newPage = new ResourceOffsetPage().setSize(initialFrom, initialTo).update(info.offset, items).setOutdated(outdated);

  const mergedPages: IResourceOffsetPage[] = [];
  let i = 0;

  // Add all pages before the newPage
  while (i < pages.length && pages[i]!.to <= newPage.from) {
    mergedPages.push(pages[i]!);
    i++;
  }

  // Adjust overlapping existing pages
  while (i < pages.length && pages[i]!.from < newPage.to) {
    const current = pages[i]!;
    // If existing page starts before newPage
    if (current.from < newPage.from) {
      // Adjust the existing page to end at newPage.from
      current.setSize(current.from, newPage.from);
      if (current.to - current.from > 0) {
        mergedPages.push(current);
      }
    }
    // If existing page ends after newPage
    if (current.to > newPage.to) {
      // Adjust the existing page to start at newPage.to
      current.setSize(newPage.to, current.to);
      // Since we need to remove pages after newPage when hasNextPage is false,
      // we only include this adjusted page if hasNextPage is true
      if (hasNextPage && current.to - current.from > 0) {
        mergedPages.push(current);
      }
    }
    i++;
  }

  // Add the newPage
  mergedPages.push(newPage);

  // Add the remaining pages after newPage if hasNextPage is true
  if (hasNextPage) {
    while (i < pages.length) {
      mergedPages.push(pages[i]!);
      i++;
    }
  } else {
    // Since hasNextPage is false, we remove all pages after newPage
    // No action needed here as we simply don't add them
  }

  // Remove zero-length ranges
  const filteredPages = mergedPages.filter(range => range.to - range.from > 0);

  // Sort the filtered pages
  const sortedPages = filteredPages.sort((a, b) => a.from - b.from);

  // Replace pages with the merged and sorted pages
  pages.splice(0, pages.length, ...sortedPages);
}
