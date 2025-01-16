/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';
import { type RefObject, useEffect, useMemo } from 'react';

import { debounce, isNotNullDefined } from '@cloudbeaver/core-utils';

import { useFuzzySearch } from '../useFuzzySearch.js';
import { useObservableRef } from '../useObservableRef.js';

export type InputAutocompleteStrategy = 'startsWith' | 'contains' | 'fuzzy';

interface InputAutocompleteOptions {
  sourceHints: InputAutocompleteProposal[];
  matchStrategy?: InputAutocompleteStrategy;
  predicate?: (suggestion: InputAutocompleteProposal, lastWord?: string) => boolean;
}

export interface InputAutocompleteProposal {
  id: string;
  displayString: string;
  replacementString: string;
  icon?: string;
  title?: string;
  score?: number;
}

const INPUT_DELAY = 300;
const SEARCH_FIELDS: Array<keyof InputAutocompleteProposal> = ['displayString', 'replacementString'];

export const useInputAutocomplete = (
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement>,
  { sourceHints, matchStrategy = 'contains', predicate }: InputAutocompleteOptions,
) => {
  const fuzzySearch = useFuzzySearch({
    sourceProposals: sourceHints,
    fields: SEARCH_FIELDS,
  });
  const state = useObservableRef(
    () => ({
      isFound: false,
      input: inputRef.current?.value as string | undefined,
      selectionStart: inputRef.current?.selectionStart ?? null,
      selectionEnd: inputRef.current?.value?.length ?? null,
      replaceCurrentWord(replacement: string) {
        const cursorPosition = this.selectionStart;
        const words = this.input?.split(' ');

        if (!this.currentWord || !isNotNullDefined(words) || !isNotNullDefined(cursorPosition)) {
          return;
        }

        const start = cursorPosition - this.currentWord.length;
        const end = cursorPosition;

        this.input = this.input?.slice(0, start) + replacement + this.input?.slice(end);
        this.selectionStart = start + replacement.length;
        this.selectionEnd = start + replacement.length;

        if (this.inputRef.current) {
          this.inputRef.current.value = this.input;
          this.inputRef.current.focus();
        }

        this.fuzzySearch.setSearch('');
        this.isFound = true;
      },
      get currentWord(): string {
        const cursorPosition = this.selectionStart;

        if (!cursorPosition) {
          return '';
        }

        const substring = this.input?.slice(0, cursorPosition);

        if (!substring) {
          return '';
        }

        return substring.split(' ').at(-1) ?? '';
      },
      get filteredSuggestions() {
        if (!this.currentWord || this.isFound) {
          return [];
        }

        if (this.matchStrategy === 'fuzzy') {
          return this.fuzzySearch.proposals
            .filter(suggestion => filterWithoutSameWord(suggestion, this.currentWord) && (predicate ? predicate(suggestion, this.currentWord) : true))
            .sort(sortByScore);
        }

        const matchFunctions: Record<Exclude<InputAutocompleteStrategy, 'fuzzy'>, (value: string) => boolean> = {
          startsWith: value => value.toLocaleLowerCase().startsWith(this.currentWord.toLocaleLowerCase()),
          contains: value => value.toLocaleLowerCase().includes(this.currentWord.toLocaleLowerCase()),
        };

        return this.sourceHints
          .filter(suggestion => {
            const values = SEARCH_FIELDS.map(field => suggestion[field]).filter(value => isNotNullDefined(value) && typeof value === 'string');

            return (
              filterWithoutSameWord(suggestion, this.currentWord) &&
              values.some(matchFunctions[this.matchStrategy as Exclude<InputAutocompleteStrategy, 'fuzzy'>])
            );
          })
          .filter(suggestion => (predicate ? predicate(suggestion, this.currentWord) : true))
          .sort(sortByScore);
      },
    }),
    {
      input: observable.ref,
      selectionStart: observable.ref,
      selectionEnd: observable.ref,
      isFound: observable.ref,
      sourceHints: observable.ref,
      matchStrategy: observable.ref,
      inputRef: observable.ref,
      currentWord: computed,
      filteredSuggestions: computed,
      replaceCurrentWord: action.bound,
    },
    { sourceHints, matchStrategy, inputRef, fuzzySearch },
  );

  const handleInput = useMemo(
    () =>
      debounce((event: Event) => {
        const target = event.target as HTMLInputElement;

        state.selectionStart = target.selectionStart;
        state.selectionEnd = target.selectionEnd;
        state.input = target?.value;
        fuzzySearch.setSearch(state.currentWord);
        state.isFound = false;
      }, INPUT_DELAY),
    [],
  );

  useEffect(() => {
    const input = state.inputRef.current;

    if (!input) {
      return;
    }

    input.addEventListener('input', handleInput);
    return () => {
      input.removeEventListener('input', handleInput);
    };
  }, [state.inputRef.current]);

  return state;
};

function sortByScore(a: InputAutocompleteProposal, b: InputAutocompleteProposal) {
  if (isNotNullDefined(a.score) && isNotNullDefined(b.score)) {
    return b.score - a.score;
  }

  return 0;
}

function filterWithoutSameWord(suggestion: InputAutocompleteProposal, currentWord: string) {
  const values = SEARCH_FIELDS.map(field => suggestion[field]).filter(value => isNotNullDefined(value) && typeof value === 'string');
  const isEqual = values.some(value => value.toLocaleLowerCase() === currentWord?.toLocaleLowerCase());

  if (!currentWord || isEqual) {
    return false;
  }

  return true;
}
