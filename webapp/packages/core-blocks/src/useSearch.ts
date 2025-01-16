/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { isNotNullDefined } from '@cloudbeaver/core-utils';

import { useFuzzySearch } from './useFuzzySearch.js';

export type SearchStrategy = 'startsWith' | 'contains' | 'fuzzy';

interface Props<T extends object> {
  sourceHints: T[];
  searchFields: (keyof T)[];
  matchStrategy?: SearchStrategy;
  predicate?: (suggestion: T, lastWord?: string) => boolean;
}

export function useSearch<T extends object>({
  sourceHints,
  searchFields,
  predicate,
  matchStrategy = 'contains',
}: Props<T>): (searchWord: string) => T[] {
  const fuzzySearch = useFuzzySearch({
    sourceProposals: sourceHints,
    fields: searchFields as string[],
  });

  function search(searchWord: string): T[] {
    if (matchStrategy === 'fuzzy') {
      return fuzzySearch(searchWord).filter(suggestion => filterBase(suggestion, searchFields, searchWord, predicate));
    }

    const matchFunctions: Record<Exclude<SearchStrategy, 'fuzzy'>, (value: string) => boolean> = {
      startsWith: value => value.toLocaleLowerCase().startsWith(searchWord.toLocaleLowerCase()),
      contains: value => value.toLocaleLowerCase().includes(searchWord.toLocaleLowerCase()),
    };

    return sourceHints.filter(suggestion => {
      const values = searchFields.map(field => suggestion[field]).filter(value => isNotNullDefined(value) && typeof value === 'string');
      return values.some(matchFunctions[matchStrategy]) && filterBase(suggestion, searchFields, searchWord, predicate);
    });
  }

  return search;
}

function filterBase<T extends object>(
  suggestion: T,
  searchFields: (keyof T)[],
  currentWord: string,
  predicate?: (suggestion: T, currentWord: string) => boolean,
): boolean {
  const values = searchFields.map(field => suggestion[field]).filter(value => isNotNullDefined(value) && typeof value === 'string');
  const hasEqual = values.some(value => value.toLocaleLowerCase() === currentWord.toLocaleLowerCase());

  if (!currentWord || hasEqual) {
    return false;
  }

  return predicate ? predicate(suggestion, currentWord) : true;
}
