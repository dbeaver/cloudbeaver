/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { autorun, observable } from 'mobx';
import { useMemo } from 'react';
import { useMiniSearch } from 'react-minisearch';

import { useObservableRef } from './useObservableRef.js';

interface UseSearchProps<T> {
  sourceProposals: T[];
  fields: Array<keyof T>;
  threshold?: number;
  prefix?: boolean;
}

interface UseSearchAPI<T> {
  searchResult: T[] | null;
  isIndexing: boolean;
  removeAll: () => void;
  addAll: (proposals: T[]) => void;
  search: (query: string) => void;
  clearSearch: VoidFunction;
}

const DEFAULT_THRESHOLD = 0.4;

export function useFuzzySearch<T extends object>({
  sourceProposals,
  fields,
  threshold = DEFAULT_THRESHOLD,
  prefix = true,
}: UseSearchProps<T>): UseSearchAPI<T> {
  const miniSearch = useMiniSearch([] as T[], {
    fields: fields as string[],
    searchOptions: {
      fuzzy: threshold,
      prefix,
    },
  });
  const state = useObservableRef(
    () => ({}),
    {
      searchResult: observable.ref,
      isIndexing: observable.ref,
    },
    {
      searchResult: miniSearch.searchResults,
      isIndexing: miniSearch.isIndexing,
      removeAll: miniSearch.removeAll,
      addAll: miniSearch.addAll,
      search: miniSearch.search,
      clearSearch: miniSearch.clearSearch,
    },
    ['removeAll', 'addAll', 'search', 'clearSearch'],
  );

  useMemo(
    () =>
      autorun(() => {
        state.removeAll();
        state.addAll(sourceProposals.map((proposal, index) => ({ id: index, ...proposal })));
      }),
    [sourceProposals],
  );

  return state as UseSearchAPI<T>;
}
