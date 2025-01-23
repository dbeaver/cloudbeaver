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
  const storeFields = useMemo(
    () =>
      sourceProposals.reduce((acc, proposal) => {
        for (const field of fields) {
          if (typeof proposal[field as keyof typeof proposal] === 'string') {
            acc.push(field);
          }
        }
        return acc;
      }, [] as string[]),
    [],
  );
  const options = useMemo(
    () => ({
      fields,
      storeFields,
      searchOptions: {
        fuzzy: threshold,
        prefix,
      },
    }),
    [fields, storeFields],
  );
  const miniSearch = useMiniSearch(sourceProposals, options);

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
