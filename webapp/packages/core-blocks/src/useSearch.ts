/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';

import { isNotNullDefined } from '@dbeaver/js-helpers';

import { useFuzzySearch } from './useFuzzySearch.js';
import { useObservableRef } from './useObservableRef.js';

export type SearchStrategy = 'startsWith' | 'contains' | 'fuzzy';

interface Props<T extends object> {
  sourceHints: T[];
  searchFields: (keyof T)[];
  matchStrategy?: SearchStrategy;
  predicate?: (suggestion: T, lastWord?: string) => boolean;
}

export interface UseSearchAPI<T> {
  searchResult: T[];
  setSearch: (searchWord: string) => void;
}

export function useSearch<T extends object>({
  sourceHints,
  searchFields,
  predicate,
  matchStrategy = 'contains',
}: Props<T>): Readonly<UseSearchAPI<T>> {
  const fuzzySearch = useFuzzySearch({
    sourceProposals: sourceHints,
    fields: searchFields,
  });
  const state = useObservableRef(
    () => ({
      search: '',
      setSearch(searchWord: string) {
        if (this.matchStrategy === 'fuzzy') {
          this.fuzzySearch.search(searchWord);
        }

        this.search = searchWord;
      },
      get searchResult(): T[] {
        if (this.matchStrategy === 'fuzzy') {
          return (this.fuzzySearch.searchResult ?? []).filter(suggestion => filterBase(suggestion, this.searchFields, this.search, this.predicate));
        }

        const matchFunctions: Record<Exclude<SearchStrategy, 'fuzzy'>, (value: string) => boolean> = {
          startsWith: value => value.toLocaleLowerCase().startsWith(this.search.toLocaleLowerCase()),
          contains: value => value.toLocaleLowerCase().includes(this.search.toLocaleLowerCase()),
        };

        return this.sourceHints.filter(suggestion => {
          const values = this.searchFields.map(field => suggestion[field]).filter(value => isNotNullDefined(value) && typeof value === 'string');

          return (
            values.some(matchFunctions[this.matchStrategy as Exclude<SearchStrategy, 'fuzzy'>]) &&
            filterBase(suggestion, this.searchFields, this.search, this.predicate)
          );
        });
      },
    }),
    {
      search: observable.ref,
      setSearch: action.bound,
      searchResult: computed,
    },
    { sourceHints, searchFields, predicate, matchStrategy, fuzzySearch },
  );

  return state as Readonly<UseSearchAPI<T>>;
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
