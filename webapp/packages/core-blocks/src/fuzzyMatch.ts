/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import MiniSearch, { type SearchResult } from 'minisearch';

const FUZZY_THRESHOLD = 0.5;

export interface FuzzyMatchResult<T> {
  item: T;
  score: number;
  match: SearchResult;
}

interface FuzzyMatchOptions<T extends object> {
  query: string;
  items: T[];
  fields: Array<keyof T & string>;
}

export function fuzzyMatch<T extends object>({ query, items, fields }: FuzzyMatchOptions<T>): FuzzyMatchResult<T>[] {
  if (items.length === 0 || query.length === 0) {
    return items.map(item => ({ item, score: 0, match: {} as SearchResult }));
  }

  const miniSearch = new MiniSearch({
    fields,
    searchOptions: {
      fuzzy: FUZZY_THRESHOLD,
      prefix: true,
      combineWith: 'OR',
    },
  });

  miniSearch.addAll(items.map((item, index) => ({ id: index, ...item })));

  const results = miniSearch.search(query);

  return results.map(result => ({
    item: items[result.id as number]!,
    score: result.score,
    match: result,
  }));
}
