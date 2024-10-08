/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test } from '@jest/globals';

import { expandOffsetPageRange } from './CachedResourceOffsetPageKeys.js';
import type { IResourceOffsetPage } from './OffsetPagination/IResourceOffsetPage.js';
import { ResourceOffsetPage } from './OffsetPagination/ResourceOffsetPage.js';

describe('CachedResourceOffsetPageKeys', () => {
  describe('expandOffsetPageRange', () => {
    test('should add first page', () => {
      const randomPage = getRandomPage(0, 100, false);
      const pages: IResourceOffsetPage[] = [];
      expandOffsetPageRange(pages, { offset: randomPage.from, limit: randomPage.to - randomPage.from }, randomPage.items, false, true);

      expect(pages).toStrictEqual([randomPage]);
    });

    test('should add sequential pages', () => {
      const pages: IResourceOffsetPage[] = [];
      const initialPages: IResourceOffsetPage[] = [];

      for (let i = 0; i < 10; i++) {
        const randomPage = getRandomPage(i * 100, 100, false);
        initialPages.push(randomPage);
        expandOffsetPageRange(pages, { offset: randomPage.from, limit: randomPage.to - randomPage.from }, randomPage.items, false, true);
      }

      expect(pages).toStrictEqual(initialPages);
    });

    test('should add sequential pages with gaps', () => {
      const pages: IResourceOffsetPage[] = [];
      const initialPages: IResourceOffsetPage[] = [];

      for (let i = 0; i < 5; i++) {
        const randomPage = getRandomPage(i * 100, 100, false);
        initialPages.push(randomPage);
        expandOffsetPageRange(pages, { offset: randomPage.from, limit: randomPage.to - randomPage.from }, randomPage.items, false, true);
      }

      const randomPage = getRandomPage(6 * 100, 100, false);
      initialPages.push(randomPage);
      expandOffsetPageRange(pages, { offset: randomPage.from, limit: randomPage.to - randomPage.from }, randomPage.items, false, true);

      expect(pages).toStrictEqual(initialPages);
    });

    test('should add page in a gap', () => {
      const pages: IResourceOffsetPage[] = [];
      const initialPages: IResourceOffsetPage[] = [];

      for (let i = 0; i < 5; i++) {
        const randomPage = getRandomPage(i * 100, 100, false);
        initialPages.push(randomPage);
        expandOffsetPageRange(pages, { offset: randomPage.from, limit: randomPage.to - randomPage.from }, randomPage.items, false, true);
      }

      const randomPage = getRandomPage(6 * 100, 100, false);
      const gapIndex = initialPages.push(randomPage);
      expandOffsetPageRange(pages, { offset: randomPage.from, limit: randomPage.to - randomPage.from }, randomPage.items, false, true);

      const gapPage = getRandomPage(5 * 100, 100, false);
      initialPages.splice(gapIndex - 1, 0, gapPage);
      expandOffsetPageRange(pages, { offset: gapPage.from, limit: gapPage.to - gapPage.from }, gapPage.items, false, true);

      expect(pages).toStrictEqual(initialPages);
    });

    test('should shrink pages', () => {
      const pages: IResourceOffsetPage[] = [];
      const initialPages: IResourceOffsetPage[] = [];

      for (let i = 0; i < 10; i++) {
        const randomPage = getRandomPage(i * 100, 100, false);
        initialPages.push(randomPage);
        expandOffsetPageRange(pages, { offset: randomPage.from, limit: randomPage.to - randomPage.from }, randomPage.items, false, true);
      }

      const randomPage = getRandomPage(50, 100, false);
      initialPages[0]?.setSize(0, 50);
      initialPages[1]?.setSize(150, 200);
      initialPages.splice(1, 0, randomPage);
      expandOffsetPageRange(pages, { offset: randomPage.from, limit: randomPage.to - randomPage.from }, randomPage.items, false, true);

      expect(pages).toStrictEqual(initialPages);
    });

    test('should remove pages after end', () => {
      const pages: IResourceOffsetPage[] = [];
      const initialPages: IResourceOffsetPage[] = [];

      for (let i = 0; i < 10; i++) {
        const randomPage = getRandomPage(i * 100, 100, false);
        initialPages.push(randomPage);
        expandOffsetPageRange(pages, { offset: randomPage.from, limit: randomPage.to - randomPage.from }, randomPage.items, false, true);
      }

      const randomPage = getRandomPage(300, 100, false);
      initialPages.splice(4);
      expandOffsetPageRange(pages, { offset: randomPage.from, limit: randomPage.to - randomPage.from }, randomPage.items, false, false);

      expect(pages).toStrictEqual(initialPages);
    });
  });
});

function getRandomPage(offset: number, limit: number, outdate: boolean): IResourceOffsetPage {
  const page = new ResourceOffsetPage();

  page.setSize(offset, offset + limit);
  page.setOutdated(outdate);
  page.update(
    0,
    new Array(limit).fill(null).map((_, i) => i),
  );

  return page;
}
