/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import MiniSearch, { type Options } from 'minisearch';
import { action, computed, observable } from 'mobx';
import { useEffect, useRef } from 'react';

import { useObservableRef } from './useObservableRef.js';

interface UseSearchProps<T> extends Options {
  sourceProposals: T[];
}

const DEFAULT_THRESHOLD = 0.4;

function createSearchInstance<T>(options: Options) {
  return new MiniSearch<T>(options);
}

export function useFuzzySearch<T extends object>({ sourceProposals, ...options }: UseSearchProps<T>) {
  const minisearchOptions = { ...options };
  const dataSetKeys = sourceProposals.reduce((acc, item) => {
    Object.keys(item).forEach(key => acc.add(key));

    return acc;
  }, new Set<string>());
  const searchInstance = useRef(createSearchInstance<T>(minisearchOptions));

  if (!minisearchOptions.searchOptions) {
    minisearchOptions.searchOptions = {
      prefix: true,
      fuzzy: DEFAULT_THRESHOLD,
    };
  }

  if (!minisearchOptions.storeFields) {
    minisearchOptions.storeFields = Array.from(dataSetKeys);
  }

  useEffect(() => {
    searchInstance.current = createSearchInstance<T>(minisearchOptions);
    searchInstance.current.addAll(sourceProposals);
  }, [sourceProposals]);

  function search(searchWord: string) {
    return searchInstance.current.search(searchWord) as T[];
  }

  return search;
}
