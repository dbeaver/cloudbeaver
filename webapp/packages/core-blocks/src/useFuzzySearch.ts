/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import Fuse, { type IFuseOptions } from 'fuse.js';
import { action, computed, observable } from 'mobx';
import { useMemo } from 'react';

import { useObservableRef } from './useObservableRef.js';

interface UseSearchProps<T> {
  dataSet: T[];
  keys: string[];
  threshold?: number;
}

const DEFAULT_THRESHOLD = 0.4;

export function useFuzzySearch<T>({ dataSet, keys, threshold = DEFAULT_THRESHOLD }: UseSearchProps<T>) {
  const fuse = useMemo(() => {
    const options: IFuseOptions<T> = {
      includeScore: true,
      keys,
      threshold,
    };
    return new Fuse(dataSet, options);
  }, [dataSet, keys, threshold]);

  const state = useObservableRef(
    () => ({
      fuzzySetSearchValue: '',
      setFuzzySearchValue(value: string) {
        this.fuzzySetSearchValue = value;
      },
      get fuzzySetsResults() {
        if (!this.fuzzySetSearchValue) {
          return [];
        }

        return this.fuse
          .search(this.fuzzySetSearchValue)
          .filter(result => (result.score ?? 1) < threshold)
          .map(result => result.item);
      },
    }),
    {
      fuzzySetSearchValue: observable,
      setFuzzySearchValue: action.bound,
      fuzzySetsResults: computed,
    },
    { fuse },
  );

  return {
    searchValue: state.fuzzySetSearchValue,
    setSearchValue: state.setFuzzySearchValue,
    searchResults: state.fuzzySetsResults,
  };
}
