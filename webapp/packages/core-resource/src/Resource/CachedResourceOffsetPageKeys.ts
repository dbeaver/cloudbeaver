/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { resourceKeyAliasFactory } from './ResourceKeyAlias';
import { resourceKeyListAliasFactory } from './ResourceKeyListAlias';

interface IOffsetPageInfo {
  offset: number;
  limit: number;
}

interface IResourceOffsetPage {
  from: number;
  to: number;
  outdated: boolean;
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
  for (const { from, to, outdated } of pages) {
    if (outdated && info.offset >= from && info.offset + info.limit <= to) {
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

export function limitOffsetPages(pages: IResourceOffsetPage[], limit: number): IResourceOffsetPage[] {
  const result: IResourceOffsetPage[] = [];

  for (const page of pages) {
    if (page.from >= limit) {
      break;
    }
    result.push({ ...page, to: Math.min(limit, page.to) });
  }

  return result;
}

export function expandOffsetPageRange(pages: IResourceOffsetPage[], info: IOffsetPageInfo, outdated: boolean): IResourceOffsetPage[] {
  pages = [...pages, { from: info.offset, to: info.offset + info.limit, outdated, end: false }].sort((a, b) => a.from - b.from);
  const result: IResourceOffsetPage[] = [];
  let previous: IResourceOffsetPage | undefined;

  for (const { from, to, outdated } of pages) {
    if (!previous) {
      previous = { from, to, outdated };
      continue;
    }

    if (from <= previous.from + previous.to) {
      if (previous.outdated === outdated) {
        previous.to = Math.max(previous.to, to);
      } else {
        if (previous.from < from) {
          result.push({ ...previous, to: from });
        }
        if (previous.to > to) {
          result.push({ from, to, outdated });
          previous = { ...previous, from: to };
        } else {
          previous = { from, to, outdated };
        }
      }
    } else {
      result.push(previous);
      previous = { from, to, outdated };
    }
  }

  if (previous) {
    result.push(previous);
  }
  return result;
}
