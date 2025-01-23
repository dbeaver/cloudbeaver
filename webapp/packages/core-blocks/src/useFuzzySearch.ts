/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { autorun } from 'mobx';
import { useMemo } from 'react';
import { useMiniSearch } from 'react-minisearch';

interface UseSearchProps<T> {
  sourceProposals: T[];
  fields: string[];
  threshold?: number;
  prefix?: boolean;
}

const DEFAULT_THRESHOLD = 0.4;

export function useFuzzySearch<T extends object>({ sourceProposals, fields, threshold = DEFAULT_THRESHOLD, prefix = true }: UseSearchProps<T>) {
  const miniSearch = useMiniSearch(sourceProposals, {
    fields,
    searchOptions: {
      fuzzy: threshold,
      prefix,
    },
  });

  useMemo(
    () =>
      autorun(() => {
        miniSearch.removeAll();
        miniSearch.addAll(sourceProposals.map((proposal, index) => ({ id: index, ...proposal })));
      }),
    [sourceProposals],
  );

  return miniSearch;
}
