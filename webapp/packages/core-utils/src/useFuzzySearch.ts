/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import Fuse, { type IFuseOptions } from 'fuse.js';
import { useMemo, useState } from 'react';

interface UseSearchProps<T> {
  dataSet: T[];
  keys: string[];
  threshold?: number;
}

const DEFAULT_THRESHOLD = 0.4;

export function useFuzzySearch<T>({ dataSet, keys, threshold = DEFAULT_THRESHOLD }: UseSearchProps<T>) {
  const [fuzzySetSearchValue, setFuzzySearchValue] = useState('');

  const fuse = useMemo(() => {
    const options: IFuseOptions<T> = {
      includeScore: true,
      keys,
      threshold,
    };
    return new Fuse(dataSet, options);
  }, [dataSet, keys, threshold]);

  const fuzzySetsResults = useMemo(() => {
    if (!fuzzySetSearchValue) {
      return dataSet;
    }

    return fuse
      .search(fuzzySetSearchValue)
      .filter(result => (result.score ?? 1) < threshold)
      .map(result => result.item);
  }, [fuse, fuzzySetSearchValue, dataSet, threshold]);

  return { fuzzySetSearchValue, setFuzzySearchValue, fuzzySetsResults };
}
